import React from 'react';
import { ShieldCheck, TrendingUp, XCircle, Info } from 'lucide-react';

const STATUS = {
  qualified: {
    label: 'Qualified',
    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Icon: ShieldCheck
  },
  possible: {
    label: 'In the hunt',
    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Icon: TrendingUp
  },
  out: {
    label: 'Out',
    cls: 'bg-red-500/10 text-red-400 border-red-500/30',
    Icon: XCircle
  }
};

export default function QualificationPanel({ standings, teamsMap, qualification }) {
  if (!qualification) return null;

  const rows = standings
    .map((s) => ({ team: s, q: qualification[s.id] }))
    .filter((r) => r.q && r.q.status !== 'qualified');

  if (!rows.length) return null;
  const provisional = rows.some((r) => r.q.provisional);

  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          Qualification Scenarios
        </h2>
        {provisional && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
            Provisional · based on current table
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-700/40">
        {rows.map(({ team, q }) => {
          const info = STATUS[q.status] || STATUS.out;
          const t = teamsMap?.[team.id];
          const Icon = info.Icon;
          return (
            <div key={team.id} className="px-4 py-3 flex items-start gap-3">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                style={{ backgroundColor: t?.primary_color || '#374151' }}
              >
                {t?.short_name?.charAt(0) || '?'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-white truncate">
                    {t?.name || 'Team'}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${info.cls}`}
                  >
                    <Icon className="w-3 h-3" />
                    {info.label}
                  </span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {q.lines.length ? (
                    q.lines.map((l, idx) => (
                      <p key={idx} className="text-xs text-slate-300">
                        {l.text}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">
                      {q.status === 'out'
                        ? 'Can no longer reach the qualifying places on the current table.'
                        : 'No remaining league fixtures.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-700/50 flex items-start gap-1.5">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        <span>
          Assumes the current table holds for other fixtures. Net run rate margins are estimates.
        </span>
      </div>
    </div>
  );
}