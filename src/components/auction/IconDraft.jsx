import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BowlPlanner from './draw/BowlPlanner';
import DrawBoard from './draw/DrawBoard';
import { bowlsReady, iconCountFor } from '@/lib/auction/draw';

export default function IconDraft({
  auction,
  teams,
  players,
  draws,
  refresh,
  onStartAuction
}) {
  const [editingBowls, setEditingBowls] = useState(false);
  const icons = iconCountFor(auction);
  const validation = bowlsReady({ players, teams, icons });
  const started = draws.length > 0 || (auction.draw_round || 1) > 1;
  const bowlWord = icons === 1 ? 'one bowl' : 'two bowls';

  if (!icons) {
    return (
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-6 text-center">
        <p className="text-sm text-slate-300 mb-3">
          This tournament runs without icon players, so there is no draw to do.
        </p>
        <Button onClick={onStartAuction} className="bg-emerald-500 hover:bg-emerald-600">
          Start the auction
        </Button>
      </div>
    );
  }

  if (!validation.ready || editingBowls) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Step 1 of 2 — sort the icon players into {bowlWord}
        </div>
        <BowlPlanner
          auction={auction}
          teams={teams}
          players={players}
          refresh={refresh}
        />
        {validation.ready && (
          <div className="flex justify-center">
            <Button
              onClick={() => setEditingBowls(false)}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              Bowls look good — go to the draw
            </Button>
          </div>
        )}
        {started && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setEditingBowls(false)}
              className="text-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to the draw
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Sparkles className="w-4 h-4 text-purple-400" />
        Step 2 of 2 — draw {icons} icon player{icons === 1 ? '' : 's'} for every team
      </div>
      <DrawBoard
        auction={auction}
        teams={teams}
        players={players}
        draws={draws}
        refresh={refresh}
        canEditBowls
        onChangeBowls={() => setEditingBowls(true)}
        onStartAuction={onStartAuction}
      />
    </div>
  );
}