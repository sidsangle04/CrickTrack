import React from 'react';
import { ChevronRight } from 'lucide-react';

const nrr = (v) =>
  v === null || v === undefined ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(3)}`;

function TeamBadge({ team }) {
  return (
    <span
      className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden"
      style={{ backgroundColor: team.color }}
    >
      {team.logo_url ? (
        <img src={team.logo_url} alt="" className="w-full h-full object-cover" />
      ) : (
        (team.short_name || team.name).charAt(0)
      )}
    </span>
  );
}

export default function TeamPerformance({ pointsTable = [], teams = [], onSelectTeam }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Points table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[560px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="text-left px-3 py-2 font-medium">#</th>
                <th className="text-left px-3 py-2 font-medium">Team</th>
                <th className="text-center px-2 py-2 font-medium">P</th>
                <th className="text-center px-2 py-2 font-medium">W</th>
                <th className="text-center px-2 py-2 font-medium">L</th>
                <th className="text-center px-2 py-2 font-medium">T</th>
                <th className="text-center px-2 py-2 font-medium">NR</th>
                <th className="text-center px-2 py-2 font-medium">NRR</th>
                <th className="text-center px-3 py-2 font-medium text-white">Pts</th>
              </tr>
            </thead>
            <tbody>
              {pointsTable.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-slate-500 py-6">No teams yet</td>
                </tr>
              ) : (
                pointsTable.map((t, i) => (
                  <tr
                    key={t.team_id}
                    onClick={() => onSelectTeam(t.team_id)}
                    className="border-b border-slate-700/30 cursor-pointer hover:bg-slate-700/30"
                  >
                    <td className="px-3 py-2.5 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-2 min-w-0">
                        <TeamBadge team={t} />
                        <span className="text-white font-medium truncate">{t.name}</span>
                      </span>
                    </td>
                    <td className="text-center px-2 py-2.5 text-slate-300">{t.played}</td>
                    <td className="text-center px-2 py-2.5 text-emerald-400">{t.won}</td>
                    <td className="text-center px-2 py-2.5 text-slate-300">{t.lost}</td>
                    <td className="text-center px-2 py-2.5 text-slate-300">{t.tied}</td>
                    <td className="text-center px-2 py-2.5 text-slate-300">{t.no_result}</td>
                    <td className="text-center px-2 py-2.5 text-slate-300 font-mono">{nrr(t.nrr)}</td>
                    <td className="text-center px-3 py-2.5 text-white font-bold">{t.points}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-700/50">
          Win = 2 pts · Tie / no result = 1 pt · NRR uses legal overs, with a side bowled out charged
          its full quota
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <button
            key={t.team_id}
            onClick={() => onSelectTeam(t.team_id)}
            className="text-left rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 hover:border-emerald-500/40 transition-colors"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <TeamBadge team={t} />
              <span className="text-sm font-semibold text-white truncate flex-1">{t.name}</span>
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center mb-3">
              {[
                ['P', t.played, 'text-slate-200'],
                ['W', t.won, 'text-emerald-400'],
                ['L', t.lost, 'text-rose-400'],
                ['Pts', t.points, 'text-white'],
              ].map(([l, v, c]) => (
                <div key={l} className="rounded-lg bg-slate-900/60 py-1.5">
                  <div className={`text-sm font-bold ${c}`}>{v}</div>
                  <div className="text-[9px] text-slate-500 uppercase">{l}</div>
                </div>
              ))}
            </div>
            <dl className="space-y-1 text-[11px]">
              {[
                ['Runs scored', t.runs_for],
                ['Runs conceded', t.runs_against],
                ['Highest', t.highest ?? '—'],
                ['Lowest', t.lowest ?? '—'],
                ['Average score', t.average_score ?? '—'],
                ['Wickets taken', t.wickets_taken],
                ['Wickets lost', t.wickets_lost],
                ['Net run rate', nrr(t.nrr)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-slate-200 tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>
    </div>
  );
}