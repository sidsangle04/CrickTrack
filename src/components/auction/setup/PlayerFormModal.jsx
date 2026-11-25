import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { CATEGORY_LABELS, PlayerAvatar } from '../Shared';
import PlayerNameInput from '@/components/players/PlayerNameInput';

const EMPTY = {
  name: '',
  photo_url: '',
  signature_url: '',
  age: '',
  batting_style: '',
  bowling_style: '',
  primary_role: '',
  experience: '',
  category: 'gold'
};

const ROLES = [
  { value: 'batsman', label: 'Batsman' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'all_rounder', label: 'All-rounder' },
  { value: 'wicket_keeper', label: 'Wicket keeper' }
];

const BOWLING = [
  { value: 'right_arm_fast', label: 'Right arm fast' },
  { value: 'right_arm_medium', label: 'Right arm medium' },
  { value: 'right_arm_off_spin', label: 'Right arm off spin' },
  { value: 'right_arm_leg_spin', label: 'Right arm leg spin' },
  { value: 'left_arm_fast', label: 'Left arm fast' },
  { value: 'left_arm_medium', label: 'Left arm medium' },
  { value: 'left_arm_orthodox', label: 'Left arm orthodox' },
  { value: 'left_arm_chinaman', label: 'Left arm chinaman' },
  { value: 'none', label: 'Does not bowl' }
];

function UploadRow({ label, value, field, onUpload, uploading, onClear }) {
  const ref = useRef(null);
  return (
    <div>
      <Label className="text-slate-200">{label} (optional)</Label>
      <div className="flex items-center gap-2 mt-1">
        {value && (
          <img
            src={value}
            alt={label}
            className="h-10 w-10 rounded-lg object-cover border border-slate-700 bg-slate-950"
          />
        )}
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0], field)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => ref.current?.click()}
          disabled={uploading === field}
          className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
        >
          {uploading === field ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {value ? 'Replace' : 'Upload'}
        </Button>
        {value && (
          <button
            type="button"
            onClick={() => onClear(field)}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400"
          >
            <X className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

export default function PlayerFormModal({ open, onOpenChange, player, tournamentId, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      player
        ? {
            name: player.name || '',
            photo_url: player.photo_url || '',
            signature_url: player.signature_url || '',
            age: player.age ?? '',
            batting_style: player.batting_style || '',
            bowling_style: player.bowling_style || '',
            primary_role: player.primary_role || '',
            experience: player.experience || '',
            category: player.category || 'gold'
          }
        : EMPTY
    );
  }, [open, player]);

  const upload = async (file, field) => {
    if (!file) return;
    setUploading(field);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((f) => ({ ...f, [field]: file_url }));
    } finally {
      setUploading('');
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      setError('A player name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), category: form.category || 'gold' };
      if (form.photo_url) payload.photo_url = form.photo_url;
      if (form.signature_url) payload.signature_url = form.signature_url;
      if (form.age !== '' && form.age !== null) payload.age = Number(form.age);
      if (form.batting_style) payload.batting_style = form.batting_style;
      if (form.bowling_style) payload.bowling_style = form.bowling_style;
      if (form.primary_role) payload.primary_role = form.primary_role;
      if (form.experience) payload.experience = form.experience;

      if (player) await base44.entities.AuctionPlayer.update(player.id, payload);
      else
        await base44.entities.AuctionPlayer.create({
          ...payload,
          tournament_id: tournamentId,
          status: 'available',
          bowl: 'none'
        });
      onSaved && onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e?.message || 'Could not save the player.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{player ? 'Edit player' : 'Add player'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <PlayerAvatar player={{ name: form.name, photo_url: form.photo_url }} size="md" />
            <p className="text-xs text-slate-400">
              Only the name is needed. Everything else can be added later.
            </p>
          </div>

          <div>
            <Label className="text-slate-200">Player name *</Label>
            <PlayerNameInput
              value={form.name}
              onChange={(name) => setForm({ ...form, name })}
              onPick={(p) =>
                setForm((f) => ({
                  ...f,
                  name: p.name,
                  photo_url: f.photo_url || p.photo_url || '',
                  batting_style: f.batting_style || p.batting_style || '',
                  bowling_style: f.bowling_style || p.bowling_style || '',
                  primary_role: f.primary_role || p.primary_role || p.role || ''
                }))
              }
              placeholder="e.g. Arjun Mehta"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <UploadRow
            label="Player photograph"
            value={form.photo_url}
            field="photo_url"
            onUpload={upload}
            uploading={uploading}
            onClear={(f) => setForm({ ...form, [f]: '' })}
          />
          <UploadRow
            label="Player signature"
            value={form.signature_url}
            field="signature_url"
            onUpload={upload}
            uploading={uploading}
            onClear={(f) => setForm({ ...form, [f]: '' })}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-200">Age</Label>
              <Input
                type="number"
                min="0"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="Optional"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label className="text-slate-200">Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-200">Batting style</Label>
              <Select
                value={form.batting_style || 'unset'}
                onValueChange={(v) =>
                  setForm({ ...form, batting_style: v === 'unset' ? '' : v })
                }
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="unset">Not specified</SelectItem>
                  <SelectItem value="right_hand">Right hand</SelectItem>
                  <SelectItem value="left_hand">Left hand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-200">Primary role</Label>
              <Select
                value={form.primary_role || 'unset'}
                onValueChange={(v) => setForm({ ...form, primary_role: v === 'unset' ? '' : v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="unset">Not specified</SelectItem>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Bowling style</Label>
            <Select
              value={form.bowling_style || 'unset'}
              onValueChange={(v) => setForm({ ...form, bowling_style: v === 'unset' ? '' : v })}
            >
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                <SelectItem value="unset">Not specified</SelectItem>
                {BOWLING.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-200">Playing experience</Label>
            <Textarea
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: e.target.value })}
              placeholder="Optional — e.g. 5 years club cricket, 2 seasons district"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              rows={2}
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
            {player ? 'Save player' : 'Add player'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}