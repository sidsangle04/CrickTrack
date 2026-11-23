import React from 'react';
import { Trophy } from 'lucide-react';
import RoadToFinalDiagram from './RoadToFinalDiagram';
import PortraitDiagram from './roadToFinal/PortraitDiagram';

const STAGES = [
  { label: 'Qualifier 1', hint: '1st vs 2nd' },
  { label: 'Eliminator', hint: '3rd vs 4th' },
  { label: 'Qualifier 2', hint: 'Loser Q1 vs Winner Eliminator' },
  { label: 'Final', hint: 'Winner Q1 vs Winner Q2' },
];

/**
 * Road to the Final — the qualifier chain drawn as a wired flow chart:
 * 1st/2nd feed Qualifier 1, 3rd/4th feed the Eliminator, then Q1's loser and
 * the Eliminator's winner meet in Qualifier 2, and the two qualifier winners
 * play the Final. Landscape on desktop, portrait on phones.
 */
export default function RoadToFinal({
  seeds = [],
  matches = [],
  teamsMap = {},
  matchesMap = {},
  onSetWinner,
  onStartGame,
  onOpenMatch,
}) {
  const rows = STAGES.map((_, i) => matches[i] || {});
  const shared = {
    seeds,
    matches: rows,
    teamsMap,
    matchesMap,
    stages: STAGES,
    onSetWinner,
    onStartGame,
    onOpenMatch,
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-700/60 p-4 sm:p-5 bg-slate-900">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-emerald-400">
          ROAD TO THE FINAL
        </span>
        <span className="flex-1 h-px bg-slate-700" />
      </div>

      <RoadToFinalDiagram {...shared} />
      <PortraitDiagram {...shared} />
    </div>
  );
}