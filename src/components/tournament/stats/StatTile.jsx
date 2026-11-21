import React from 'react';

// One headline statistic. `accent` picks the icon chip colour, `sub` carries
// the supporting detail (a team, a player, a match).
export default function StatTile({ icon: Icon, label, value, sub, accent = 'emerald', onClick }) {
  const chip = {
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    slate: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  }[accent] || 'bg-slate-700/40 text-slate-300 border-slate-600/40';

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`text-left w-full rounded-xl border border-slate-700/50 bg-slate-800/50 p-3.5 ${
        onClick ? 'hover:border-emerald-500/40 transition-colors' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
          <div className="mt-1 text-xl font-bold text-white tabular-nums leading-tight truncate">{value}</div>
          {sub && <div className="mt-0.5 text-[11px] text-slate-500 truncate">{sub}</div>}
        </div>
        {Icon && (
          <span className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${chip}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
    </Tag>
  );
}