import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { TeamBadge, contrastText } from '../Shared';

export const TEAM_COLOURS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Purple', hex: '#7c3aed' },
  { name: 'Black', hex: '#111827' },
  { name: 'Teal', hex: '#0d9488' }
];

const EMPTY = { name: '', color: '#10b981', logo_url: '', owner_name: '' };

export default function TeamFormModal({
  open,
  onOpenChange,
  team,
  tournamentId,
  orderIndex = 0,
  onSaved
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      team
        ? {
            name: team.name || '',
            color: team.color || '#10b981',
            logo_url: team.logo_url || '',
            owner_name: team.owner_name || ''
          }
        : EMPTY
    );
  }, [open, team]);

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((f) => ({ ...f, logo_url: file_url }));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError('A team name is required.');
      return;
    }
    if (!form.color) {
      setError('Pick a team colour.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
        logo_url: form.logo_url || '',
        owner_name: form.owner_name.trim()
      };
      if (team) await base44.entities.AuctionTeam.update(team.id, payload);
      else
        await base44.entities.AuctionTeam.create({
          ...payload,
          tournament_id: tournamentId,
          order_index: orderIndex
        });
      onSaved && onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e?.message || 'Could not save the team.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team ? 'Edit team' : 'Add team'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <TeamBadge team={{ name: form.name, color: form.color, logo_url: form.logo_url }} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {form.name || 'Team name'}
              </p>
              <p className="text-xs text-slate-400">
                {form.logo_url ? 'Logo uploaded' : 'Initials are used when there is no logo'}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Team name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Royal Strikers"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <Label className="text-slate-200">Team colour *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TEAM_COLOURS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.hex })}
                  className={`h-9 w-9 rounded-full border-2 transition-transform ${
                    form.color?.toLowerCase() === c.hex ? 'border-white scale-110' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
              <label
                className="h-9 px-2 rounded-full border-2 border-dashed border-slate-600 flex items-center gap-2 cursor-pointer"
                title="Custom colour"
              >
                <input
                  type="color"
                  value={form.color || '#10b981'}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-6 w-8 bg-transparent border-0 p-0 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">Custom</span>
              </label>
            </div>
            <div
              className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: form.color, color: contrastText(form.color) }}
            >
              Preview · {form.color}
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Team logo (optional)</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => uploadLogo(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {form.logo_url ? 'Replace logo' : 'Upload logo'}
              </Button>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logo_url: '' })}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Owner or representative (optional)</Label>
            <Input
              value={form.owner_name}
              onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
              placeholder="e.g. Rahul"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {team ? 'Save team' : 'Add team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}