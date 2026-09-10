import React from 'react';
import { Zap, Target } from 'lucide-react';

const Stat = ({ label, value, sub }) => (
  <div>
    <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
    <div className="text-lg font-bold text-white">
      {value}
      {sub && <span className="text-[11px] font-normal text-slate-500 ml-1">{sub}</span>}
    </div>
  </div>
);

export default function H2HStatCards({ h2h, batterName, bowlerName }) {
  return (
    <>
      {/* Duel overview strip */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat label="Matches faced off" value={h2h.matches} />
          <Stat label="Balls bowled at him" value={h2h.ballsFaced} />
          <Stat label="Runs in the duel" value={h2h.conceded} sub="conceded" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Batter's haul */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
          <h4 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4" />
            {batterName} with the bat
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Runs off the bat" value={h2h.runsBat} />
            <Stat label="Strike rate" value={h2h.strikeRate.toFixed(1)} />
            <Stat label="Boundary %" value={`${Math.round(h2h.boundaryPct)}%`} />
            <Stat label="Fours" value={h2h.fours} />
            <Stat label="Sixes" value={h2h.sixes} />
            <Stat
              label="Dismissals"
              value={h2h.wickets}
              sub={h2h.wickets > 0 ? h2h.wicketTypes.join(', ') : 'not out'}
            />
          </div>
        </div>

        {/* Bowler's stranglehold */}
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5">
          <h4 className="font-semibold text-rose-400 mb-4 flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" />
            {bowlerName} with the ball
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Wickets taken" value={h2h.wickets} />
            <Stat label="Economy" value={h2h.economy.toFixed(2)} />
            <Stat label="Dot balls" value={h2h.dots} />
            <Stat label="Dot ball %" value={`${Math.round(h2h.dotPct)}%`} />
          </div>
        </div>
      </div>
    </>
  );
}