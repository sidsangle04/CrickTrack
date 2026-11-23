import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { PlayerAvatar, ROLE_LABELS } from '@/components/auction/Shared';

// Lists every player saved in the Players section so one can be added to a
// team, excluding those the team (or this tournament) already holds.
export default function PlayerPicker({
  open,
  onOpenChange,
  mode,
  tournamentId,
  excludeIds = [],
  title = 'Add players',
  onConfirm
}) {
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState([]);

  const { data: players = [] } = useQuery({
    queryKey: ['players', mode || 'all'],
    queryFn: () => base44.entities.Player.list('-created_date', 500),
    enabled: open
  });

  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter((p) => (p.ground_mode || 'turf') === (mode || 'turf'))
      .filter((p) => !excludeIds.includes(p.id))
      .filter((p) => !tournamentId || p.tournament_id !== tournamentId)
      .filter((p) => !q || (p.name || '').toLowerCase().includes(q))
      .slice(0, 200);
  }, [players, mode, tournamentId, excludeIds, search]);

  const isPicked = (id) => picked.some((p) => p.id === id);

  const toggle = (p) =>
    setPicked(isPicked(p.id) ? picked.filter((x) => x.id !== p.id) : [...picked, p]);

  const close = (next) => {
    setPicked([]);
    setSearch('');
    onOpenChange(next);
  };

  const confirm = () => {
    onConfirm(picked);
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players"
              className="pl-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-700/60 divide-y divide-slate-700/40">
            {available.length === 0 ? (
              <p className="text-xs text-slate-500 p-3">
                No players left to add — register them in the Players section first.
              </p>
            ) : (
              available.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-800/60 transition-colors"
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
                  <PlayerAvatar player={p} size="sm" className="!w-8 !h-8" />
                  <span className="text-xs text-white truncate flex-1">{p.name}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {ROLE_LABELS[p.role] || 'Player'}
                  </span>
                </button>
              ))
            )}
          </div>

          <p className="text-[10px] text-slate-500">
            Everyone in the Players section is listed here. Picked players are copied into this
            tournament team.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => close(false)} className="text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={picked.length === 0}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Add {picked.length || ''} player{picked.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}