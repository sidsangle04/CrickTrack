import React from 'react';
import { cn } from '@/lib/utils';

// Two-colour split bar: team 1 (emerald) vs team 2 (cyan), leading side emphasised.
export default function WinProbabilityBar({
  team1Name,
  team2Name,
  team1Pct = 50,
  why = null,
  insight = null,
  compact = false
}) {
  const t1 = Math.max(0, Math.min(100, Math.round(team1Pct)));
  const t2 = 100 - t1;
  const team1Leads = t1 >= t2;

  return (
    <div className={cn('w-full', compact ? 'space-y-1.5' : 'space-y-2')}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className={cn('truncate font-medium', team1Leads ? 'text-emerald-400' : 'text-slate-400')}>
          {team1Name} <span className={cn('font-black', !team1Leads && 'text-slate-500')}>{t1}%</span>
        </span>
        <span className="shrink-0 text-[10px] uppercase tracking-wider text-slate-500">Win chance</span>
        <span className={cn('truncate text-right font-medium', !team1Leads ? 'text-cyan-400' : 'text-slate-400')}>
          <span className={cn('font-black', team1Leads && 'text-slate-500')}>{t2}%</span> {team2Name}
        </span>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
          style={{ width: `${t1}%` }}
        />
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-cyan-600 transition-all duration-500"
          style={{ width: `${t2}%` }}
        />
      </div>

      {why && <p className="text-[11px] text-slate-400">{why}</p>}
      {insight && <p className="text-[11px] italic text-amber-300/90">{insight}</p>}
    </div>
  );
}