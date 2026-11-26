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
import { TeamBadge, contrastText } from '@/components/auction/Shared';
import { TEAM_COLOURS } from '@/components/auction/setup/TeamFormModal';
import { shortNameFor } from '@/lib/tournament/teamRecord';

// Edits a team from inside the tournament — name, colour and logo. The auction's
// copy of the same team is kept in step, so auction results never drift.
export default function TeamEditDialog({ team, open, onOpenChange, onSaved }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [logo, setLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open || !team) return;
    setName(team.name || '');
    setColor(team.primary_color || '#10b981');
    setLogo(team.logo_url || '');
    setError('');
  }, [open, team]);

  const uploadLogo = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setLogo(file_url);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      setError('A team name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        primary_color: color,
        logo_url: logo || ''
      };
      await base44.entities.Team.update(team.id, {
        ...payload,
        short_name: shortNameFor(name) || team.short_name || 'TEAM'
      });
      const linked = await base44.entities.AuctionTeam.filter({ team_id: team.id });
      const list = Array.isArray(linked) ? linked : [];
      if (list.length) {
        await base44.entities.AuctionTeam.bulkUpdate(
          list.map((t) => ({ id: t.id, name: payload.name, color: payload.primary_color, logo_url: payload.logo_url }))
        );
      }
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
          <DialogTitle>Edit team</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <TeamBadge team={{ name, color, logo_url: logo }} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{name || 'Team name'}</p>
              <p className="text-xs text-slate-400">
                {logo ? 'Logo uploaded' : 'Initials are used when there is no logo'}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Team name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Royal Strikers"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <Label className="text-slate-200">Team colour</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TEAM_COLOURS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`h-8 w-8 rounded-full border-2 transition-transform ${
                    color?.toLowerCase() === c.hex ? 'border-white scale-110' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                  aria-label={c.name}
                />
              ))}
              <label
                className="h-8 px-2 rounded-full border-2 border-dashed border-slate-600 flex items-center gap-2 cursor-pointer"
                title="Custom colour"
              >
                <input
                  type="color"
                  value={color || '#10b981'}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-5 w-7 bg-transparent border-0 p-0 cursor-pointer"
                />
                <span className="text-[11px] text-slate-400">Custom</span>
              </label>
            </div>
            <div
              className="mt-2 inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-semibold"
              style={{ backgroundColor: color, color: contrastText(color) }}
            >
              {color}
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Team logo</Label>
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
                {logo ? 'Replace logo' : 'Upload logo'}
              </Button>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo('')}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}