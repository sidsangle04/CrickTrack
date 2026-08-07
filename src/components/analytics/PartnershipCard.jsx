import React from 'react';

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function PartnershipCard({ partnership, playersMap, rank }) {
  const p = partnership;
  const b1 = playersMap[p.batter1_id];
  const b2 = playersMap[p.batter2_id];
  const b1Runs = p.batter1_runs || 0;
  const b1Balls = p.batter1_balls || 0;
  const b2Runs = p.batter2_runs || 0;
  const b2Balls = p.batter2_balls || 0;

  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {rank != null && <span className="text-slate-500 text-xs w-5 text-center">{rank}</span>}
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            {ordinal(p.wicket_number)} Wicket
          </span>
          {p.is_active && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-emerald-400">{p.runs || 0}</span>
          <span className="text-xs text-slate-500 ml-1">({p.balls || 0} balls)</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-white font-medium truncate">{b1?.name || 'Unknown'}</span>
          <span className="text-slate-400">{b1Runs} <span className="text-slate-600">({b1Balls})</span></span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-white font-medium truncate">{b2?.name || 'Unknown'}</span>
          <span className="text-slate-400">{b2Runs} <span className="text-slate-600">({b2Balls})</span></span>
        </div>
      </div>
    </div>
  );
}