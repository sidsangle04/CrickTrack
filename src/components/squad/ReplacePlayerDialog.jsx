import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { PlayerAvatar, ROLE_LABELS } from '@/components/auction/Shared';

// Swaps one squad member for another after the auction: pick a player who is
// still free, or type a brand new name.
export default function ReplacePlayerDialog({
  open,
  onOpenChange,
  teamName,
  outgoing,
  candidates = [],
  onConfirm
}) {
  const [search, setSearch] = useState('');
  const [pickedKey, setPickedKey] = useState('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSearch('');
      setPickedKey('');
      setNewName('');
      setBusy(false);
    }
  }, [open]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates
      .filter((c) => !q || (c.name || '').toLowerCase().includes(q))
      .slice(0, 100);
  }, [candidates, search]);

  const picked = candidates.find((c) => c.key === pickedKey) || null;
  const ready = !!picked || !!newName.trim();

  const confirm = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onConfirm(
        picked
          ? {
              playerId: picked.playerId,
              auctionPlayerId: picked.auctionPlayerId,
              name: picked.name
            }
          : { name: newName.trim() }
      );
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Replace a player</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3 flex items-center gap-3">
            <PlayerAvatar player={outgoing} size="sm" className="!w-9 !h-9" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Out</p>
              <p className="text-sm font-semibold text-white truncate">{outgoing?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{teamName}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players still free"
              className="pl-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700/60 divide-y divide-slate-700/40">
            {list.length === 0 ? (
              <p className="text-xs text-slate-500 p-3">
                No free players to pick — type a new name below.
              </p>
            ) : (
              list.map((c) => {
                const active = c.key === pickedKey;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setPickedKey(active ? '' : c.key);
                      setNewName('');
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                      active ? 'bg-emerald-500/15' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <PlayerAvatar player={c} size="sm" className="!w-8 !h-8" />
                    <span className="text-xs text-white truncate flex-1">{c.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {c.note || ROLE_LABELS[c.role] || 'Player'}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-emerald-300">
              Or add a brand new player
            </p>
            <Input
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (e.target.value) setPickedKey('');
              }}
              placeholder="New player's name"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={confirm}
            disabled={!ready || busy}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowLeftRight className="w-4 h-4 mr-2" />
            )}
            Replace player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}