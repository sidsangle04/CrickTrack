import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { PlayerAvatar } from '../Shared';

const BOWL_LABEL = { bowl1: 'Bowl 1', bowl2: 'Bowl 2' };

// Hand-pick the player a team receives from one bowl, instead of spinning the wheel.
export default function AssignPlayerDialog({
  slot,
  options,
  search,
  onSearch,
  busy,
  onAssign,
  onClose
}) {
  return (
    <Dialog open={!!slot} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign an icon player</DialogTitle>
        </DialogHeader>
        {slot && (
          <>
            <p className="text-xs text-slate-400">
              Choose the player <strong className="text-white">{slot.team.name}</strong> should
              receive — every player still left in {BOWL_LABEL.bowl1} and {BOWL_LABEL.bowl2} is
              listed.
            </p>
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search players"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
            <div className="max-h-[45vh] overflow-y-auto space-y-1.5 py-1">
              {options.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  disabled={busy}
                  onClick={() => onAssign(p)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg border border-slate-700 bg-slate-950 text-left hover:border-emerald-500/60 disabled:opacity-60"
                >
                  <PlayerAvatar player={p} size="sm" />
                  <span className="text-sm text-white truncate flex-1">{p.name}</span>
                  <span className="text-[10px] uppercase text-slate-500 shrink-0">
                    {BOWL_LABEL[p.bowl]}
                  </span>
                  {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                </button>
              ))}
              {options.length === 0 && (
                <p className="text-xs text-slate-500 py-2">
                  Every icon player has already been assigned.
                </p>
              )}
            </div>
          </>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-300">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}