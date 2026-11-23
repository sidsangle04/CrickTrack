import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BOWLING_LABELS, PlayerAvatar, ROLE_LABELS } from '@/components/auction/Shared';

const EMPTY = {
  name: '',
  photo_url: '',
  team_id: '',
  role: 'batsman',
  batting_style: 'right_hand',
  bowling_style: 'none',
  jersey_number: '',
  is_captain: false,
  is_wicket_keeper: false
};

const ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const BOWLING = Object.entries(BOWLING_LABELS).map(([value, label]) => ({ value, label }));

// Adds a player to the Players section by hand, with every detail (and an
// optional photograph), or edits one already saved.
export default function PlayerFormModal({
  open,
  onOpenChange,
  player,
  teams = [],
  mode = 'turf'
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(
      player
        ? {
            name: player.name || '',
            photo_url: player.photo_url || '',
            team_id: player.team_id || '',
            role: player.role || 'batsman',
            batting_style: player.batting_style || 'right_hand',
            bowling_style: player.bowling_style || 'none',
            jersey_number: player.jersey_number ?? '',
            is_captain: !!player.is_captain,
            is_wicket_keeper: !!player.is_wicket_keeper
          }
        : EMPTY
    );
  }, [open, player]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set({ photo_url: file_url });
    } finally {
      setUploading(false);
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
      const payload = {
        name: form.name.trim(),
        photo_url: form.photo_url || '',
        team_id: form.team_id || '',
        role: form.role,
        batting_style: form.batting_style,
        bowling_style: form.bowling_style,
        is_captain: form.is_captain,
        is_wicket_keeper: form.is_wicket_keeper || form.role === 'wicket_keeper'
      };
      if (form.jersey_number !== '' && form.jersey_number !== null) {
        payload.jersey_number = Number(form.jersey_number);
      }

      if (player) {
        await base44.entities.Player.update(player.id, payload);
      } else {
        await base44.entities.Player.create({ ...payload, ground_mode: mode });
      }

      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['all-players-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['team-players'] });
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
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {form.name || 'New player'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  {form.photo_url ? 'Change photo' : 'Add photo'}
                </button>
                {form.photo_url && (
                  <button
                    type="button"
                    onClick={() => set({ photo_url: '' })}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400"
                  >
                    <X className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Player name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Arjun Mehta"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-200">Team</Label>
              <Select
                value={form.team_id || 'none'}
                onValueChange={(v) => set({ team_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue placeholder="No team" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60">
                  <SelectItem value="none">No team</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-200">Role *</Label>
              <Select value={form.role} onValueChange={(v) => set({ role: v })}>
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
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
                value={form.batting_style}
                onValueChange={(v) => set({ batting_style: v })}
              >
                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                  <SelectItem value="right_hand">Right hand</SelectItem>
                  <SelectItem value="left_hand">Left hand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-200">Jersey number</Label>
              <Input
                type="number"
                min="0"
                value={form.jersey_number}
                onChange={(e) => set({ jersey_number: e.target.value })}
                placeholder="Optional"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Bowling style</Label>
            <Select value={form.bowling_style} onValueChange={(v) => set({ bowling_style: v })}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-white">
                {BOWLING.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: 'is_captain', label: 'Captain' },
              { key: 'is_wicket_keeper', label: 'Wicket keeper' }
            ].map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={() => set({ [tag.key]: !form[tag.key] })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form[tag.key]
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {tag.label}
              </button>
            ))}
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