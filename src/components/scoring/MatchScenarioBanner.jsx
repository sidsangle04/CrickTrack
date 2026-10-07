import React from 'react';
import { Target } from 'lucide-react';

const KIND = {
  through: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  nrr: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  outside: 'bg-red-500/10 text-red-300 border-red-500/30'
};

export default function MatchScenarioBanner({ scenario, teamsMap }) {
  if (!scenario) return null;

  const rows = [scenario.batting, scenario.bowling].filter(
    (r) => r && r.requirement.kind !== 'qualified'
  );
  if (!rows.length) return null;

  return (
    <div className="mx-4 mt-3 rounded-xl bg-slate-900/80 border border-slate-700/60 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white uppercase tracking-wide">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          Qualification scenario
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
          Provisional
        </span>
      </div>
      <div className="divide-y divide-slate-700/40">
        {rows.map(({ teamId, requirement }) => {
          const team = teamsMap?.[teamId];
          const cls = KIND[requirement.kind] || KIND.out;
          return (
            <div key={teamId} className="px-3 py-2 flex items-center gap-2 flex-wrap">
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: team?.primary_color || '#374151' }}
              >
                {team?.short_name?.charAt(0) || '?'}
              </span>
              <span className="text-sm font-medium text-white truncate">
                {team?.name || 'Team'}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${cls}`}>
                {requirement.text}
              </span>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-1.5 text-[10px] text-slate-500 border-t border-slate-700/50">
        Based on the current league table. Net run rate margins are estimates.
      </div>
    </div>
  );
}