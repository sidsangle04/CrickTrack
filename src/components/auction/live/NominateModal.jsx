import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { CategoryBadge, PlayerAvatar } from '../Shared';

export default function NominateModal({ open, onOpenChange, players, onNominate }) {
  const [search, setSearch] = useState('');

  const list = players
    .filter((p) => p.category !== 'icon' && p.status !== 'sold' && !p.sold_to_team_id)
    .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nominate a player</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the player pool"
            className="pl-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto space-y-1.5">
          {list.length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">No players left to nominate.</p>
          )}
          {list.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onNominate(p)}
              className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-700 hover:border-emerald-500/60 text-left"
            >
              <PlayerAvatar player={p} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white truncate">{p.name}</p>
                {p.status === 'unsold' && (
                  <p className="text-[10px] text-amber-400">Unsold earlier</p>
                )}
              </div>
              <CategoryBadge category={p.category} />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}