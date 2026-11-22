import React, { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { TeamBadge } from '../Shared';
import { bidProblem } from '@/lib/auction/squad';

// A team can skip the ladder and name its own figure — e.g. jump from 130
// straight to 900. The bid still has to clear the standing bid and the purse.
export default function JumpBidDialog({
  open,
  onOpenChange,
  team,
  finance,
  currentBid,
  nextAmount,
  onConfirm
}) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (open) setAmount(String(nextAmount || ''));
  }, [open, nextAmount, team?.id]);

  const value = Math.round(Number(amount));
  let problem = '';
  if (!amount || !Number.isFinite(value) || value <= 0) {
    problem = 'Enter an amount';
  } else if (value <= currentBid) {
    problem = `Must be more than the current bid of ${currentBid}`;
  } else if (finance) {
    problem = bidProblem({ amount: value, finance });
  }

  const quickPicks = finance
    ? [nextAmount, currentBid + 100, currentBid + 500, currentBid + 1000]
        .map((n) => Math.round(n))
        .filter((n, i, arr) => n > currentBid && n <= finance.maxBid && arr.indexOf(n) === i)
        .slice(0, 4)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Zap className="w-4 h-4 text-amber-400" /> Jump bid
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            Name a figure and skip the ladder. Current bid is {currentBid || 0}; the next ladder
            bid is {nextAmount}.
          </DialogDescription>
        </DialogHeader>

        {team && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-2">
            <TeamBadge team={team} size="sm" />
            <p className="text-sm font-semibold truncate">{team.name}</p>
          </div>
        )}

        <div className="space-y-2">
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-slate-950 border-slate-700 text-white text-lg font-bold tabular-nums"
            placeholder="Amount"
          />
          {quickPicks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickPicks.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(String(n))}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 tabular-nums"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          <p className={`text-xs ${problem ? 'text-red-400' : 'text-slate-500'}`}>
            {problem || `Bid ${value} coins`}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            disabled={!!problem}
            onClick={() => onConfirm(value)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
          >
            <Zap className="w-4 h-4 mr-1.5" /> Bid {problem ? '' : value}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}