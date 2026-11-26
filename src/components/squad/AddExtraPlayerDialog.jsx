import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLE_LABELS } from '@/components/auction/Shared';

// Adds a backup player to a finished auction squad. Extras sit outside the
// squad size and the purse, but they are in the squad for tournament matches.
// Typing a name suggests players already on the Players page so an existing
// profile is reused instead of registered twice.
export default function AddExtraPlayerDialog({
  open,
  onOpenChange,
  teamName,
  mode,
  tournamentId,
  excludeIds = [],
  excludeNames = [],
  onConfirm
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('batsman');
  const [picked, setPicked] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['players', mode || 'all'],
    queryFn: () => base44.entities.Player.list(),
    staleTime: 60000,
    enabled: open
  });

  // Who was sold in this tournament — they are already in a squad, so they are
  // never offered as an extra.
  const { data: auctionPlayers = [] } = useQuery({
    queryKey: ['auction-players-extra', tournamentId],
    queryFn: () => base44.entities.AuctionPlayer.filter({ tournament_id: tournamentId }),
    staleTime: 30000,
    enabled: open && !!tournamentId
  });

  // Fresh form every time the dialog opens for a different team.
  useEffect(() => {
    if (!open) {
      setName('');
      setRole('batsman');
      setPicked(null);
    }
  }, [open]);

  const matches = useMemo(() => {
    const q = name.trim().toLowerCase();
    const ids = new Set(excludeIds);
    const names = new Set(excludeNames.map((n) => (n || '').trim().toLowerCase()));

    // Already picked up in this auction (any team) — not an extra.
    (Array.isArray(auctionPlayers) ? auctionPlayers : [])
      .filter((p) => p.status === 'sold' || p.sold_to_team_id)
      .forEach((p) => names.add((p.name || '').trim().toLowerCase()));

    // The same person can exist as several records — show one row per name,
    // preferring the record that already carries a photo.
    const byName = new Map();
    (Array.isArray(players) ? players : [])
      .filter((p) => p.name && p.id)
      .filter((p) => (mode ? (p.ground_mode || 'turf') === mode : true))
      .filter((p) => !ids.has(p.id))
      .filter((p) => !p.team_id)
      .filter((p) => !names.has(p.name.trim().toLowerCase()))
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .forEach((p) => {
        const key = p.name.trim().toLowerCase();
        const prev = byName.get(key);
        if (!prev || (!prev.photo_url && p.photo_url)) byName.set(key, p);
      });

    return [...byName.values()]
      .sort((a, b) => {
        const ap = q && a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bp = q && b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return ap - bp || a.name.localeCompare(b.name);
      })
      .slice(0, 40);
  }, [players, auctionPlayers, name, mode, excludeIds, excludeNames]);

  const pick = (player) => {
    if (picked?.id === player.id) {
      setPicked(null);
      setName('');
      return;
    }
    setPicked(player);
    setName(player.name);
    if (player.role) setRole(player.role);
  };

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onConfirm({
        name: name.trim(),
        role,
        playerId: picked?.id || '',
        photo_url: picked?.photo_url || ''
      });
      setName('');
      setRole('batsman');
      setPicked(null);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Extra player · {teamName || 'team'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-400">
            A backup player for the squad. No squad slot and no purse is used — they are still
            available to pick in this tournament's matches.
          </p>
          <div>
            <Label className="text-slate-200">Player name *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (picked && picked.name !== e.target.value) setPicked(null);
                }}
                placeholder="Search a player or type a new name"
                autoComplete="off"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 pl-9"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {picked
                ? 'Existing profile selected — their record is reused.'
                : 'Only unsold players and players in no squad are listed — or type a new name.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/60 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-slate-700/60 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Unsold or new
              </span>
              <span className="text-[10px] text-slate-500">{matches.length}</span>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-slate-800">
              {matches.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    picked?.id === p.id ? 'bg-emerald-500/15' : 'hover:bg-slate-800/70'
                  }`}
                >
                  <span className="text-sm text-white truncate flex-1">{p.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {ROLE_LABELS[p.role] || 'Player'}
                  </span>
                  {picked?.id === p.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              ))}
              {matches.length === 0 && (
                <p className="px-3 py-3 text-xs text-slate-500">
                  No saved player matches — this name will create a new profile.
                </p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-slate-200">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-white">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!name.trim() || saving}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add extra player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}