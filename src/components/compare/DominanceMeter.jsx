import React from 'react';
import { Swords, Crown } from 'lucide-react';

export default function DominanceMeter({ share, batterName, bowlerName }) {
  const pct = Math.round(share);
  const state = pct >= 60
    ? { label: `${batterName} is on top`, badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40' }
    : pct <= 40
      ? { label: `${bowlerName} is on top`, badge: 'bg-rose-500/15 text-rose-400 border-rose-500/40' }
      : { label: 'Dead even', badge: 'bg-slate-500/15 text-slate-300 border-slate-500/40' };

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Swords className="w-4 h-4 text-cyan-400" />
          Domination Meter
        </h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${state.badge}`}>
          <Crown className="w-3 h-3" />
          {state.label}
        </span>
      </div>

      {/* Batter's share fills from the left (emerald), bowler's from the right (rose) */}
      <div className="relative h-4 rounded-full overflow-hidden bg-rose-500/70">
        <div
          className="absolute inset-y-0 left-0 bg-emerald-500/80 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
        <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70" />
      </div>

      <div className="flex justify-between mt-2 text-xs font-medium">
        <span className="text-emerald-400">{batterName} · {pct}%</span>
        <span className="text-rose-400">{bowlerName} · {100 - pct}%</span>
      </div>
    </div>
  );
}