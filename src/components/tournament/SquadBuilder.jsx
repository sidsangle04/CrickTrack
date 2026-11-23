import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const ROLES = [
  { value: 'batsman', label: 'Batsman' },
  { value: 'bowler', label: 'Bowler' },
  { value: 'all_rounder', label: 'All-rounder' },
  { value: 'wicket_keeper', label: 'Wicket-keeper' }
];

const ROLE_LABELS = ROLES.reduce((a, r) => ({ ...a, [r.value]: r.label }), {});

// Builds the new team's squad two ways at once: pick players who already exist
// in the app, and/or type in brand-new names.
export default function SquadBuilder({
  mode,
  tournamentId,
  selected,
  onSelectedChange,
  newPlayers,
  onNewPlayersChange
}) {
  const [search, setSearch] = useState('');

  const { data: players = [] } = useQuery({
    queryKey: ['players', mode],
    queryFn: () => base44.entities.Player.list()
  });

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter((p) => (p.ground_mode || 'turf') === mode)
      .filter((p) => p.tournament_id !== tournamentId)
      .filter((p) => !q || (p.name || '').toLowerCase().includes(q))
      .slice(0, 60);
  }, [players, mode, tournamentId, search]);

  const isPicked = (id) => selected.some((s) => s.id === id);

  const toggle = (p) => {
    onSelectedChange(isPicked(p.id) ? selected.filter((s) => s.id !== p.id) : [...selected, p]);
  };

  const setNewPlayer = (index, patch) => {
    onNewPlayersChange(newPlayers.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const total =
    selected.length + newPlayers.filter((p) => (p.name || '').trim()).length;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Squad</p>
          <p className="text-[11px] text-slate-400">{total} players</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search existing players"
            className="pl-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-700/60 divide-y divide-slate-700/40">
          {available.length === 0 ? (
            <p className="text-xs text-slate-500 p-3">No matching players — register one below.</p>
          ) : (
            available.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/60 transition-colors"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    isPicked(p.id)
                      ? 'bg-emerald-500 border-emerald-500 text-slate-900'
                      : 'border-slate-600'
                  }`}
                >
                  {isPicked(p.id) && <Check className="w-3 h-3" />}
                </span>
                <span className="text-xs text-white truncate flex-1">{p.name}</span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {ROLE_LABELS[p.role] || 'Player'}
                </span>
              </button>
            ))
          )}
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Picked players are copied into this tournament — your existing teams stay untouched.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-white">Register new players</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onNewPlayersChange([...newPlayers, { name: '', role: 'batsman' }])}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>

        {newPlayers.length === 0 ? (
          <p className="text-xs text-slate-500">
            Optional — type in anyone who isn't in the app yet.
          </p>
        ) : (
          <div className="space-y-2">
            {newPlayers.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-slate-500 shrink-0" />
                <Input
                  value={p.name}
                  onChange={(e) => setNewPlayer(i, { name: e.target.value })}
                  placeholder="Player name"
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 h-9"
                />
                <Select
                  value={p.role}
                  onValueChange={(v) => setNewPlayer(i, { role: v })}
                >
                  <SelectTrigger className="w-36 h-9 bg-slate-950 border-slate-700 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-white">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => onNewPlayersChange(newPlayers.filter((_, idx) => idx !== i))}
                  className="p-1.5 text-slate-500 hover:text-red-400"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}