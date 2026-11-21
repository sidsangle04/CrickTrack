import React, { useMemo, useState } from 'react';
import { Hand, Crown } from 'lucide-react';

const SORTS = [
  { key: 'total', label: 'Most dismissals' },
  { key: 'catches', label: 'Most catches' },
  { key: 'run_outs', label: 'Most run-outs' },
  { key: 'stumpings', label: 'Most stumpings' },
];

export default function FieldingLeaderboard({ rows = [], search = '', onSelectPlayer }) {
  const [sort, setSort] = useState('total');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.team_name.toLowerCase().includes(q))
      .sort((a, b) => b[sort] - a[sort] || b.total - a.total);
  }, [rows, sort, search]);

  const leaderId = visible[0]?.player_id;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white flex items-center gap-2">
          <Hand className="w-4 h-4 text-emerald-400" />
          Fielding leaderboard
        </h3>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
        >
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {rows.length === 0 ? 'No fielding dismissals recorded yet' : 'No players match this filter'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="text-left px-3 py-2 font-medium">#</th>
                <th className="text-left px-3 py-2 font-medium">Player</th>
                <th className="text-left px-3 py-2 font-medium">Team</th>
                <th className="text-center px-2 py-2 font-medium">M</th>
                <th className="text-right px-3 py-2 font-medium">Catches</th>
                <th className="text-right px-2 py-2 font-medium">Run-outs</th>
                <th className="text-right px-2 py-2 font-medium">Stumpings</th>
                <th className="text-right px-3 py-2 font-medium text-white">Total</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr
                  key={r.player_id}
                  onClick={() => onSelectPlayer(r.player_id)}
                  className={`border-b border-slate-700/30 cursor-pointer hover:bg-slate-700/30 ${
                    r.player_id === leaderId ? 'bg-emerald-500/10' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-1.5 text-white font-medium">
                      {r.player_id === leaderId && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className="truncate">{r.name}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-400 truncate">{r.team_name || '—'}</td>
                  <td className="text-center px-2 py-2 text-slate-300">{r.matches}</td>
                  <td className="text-right px-3 py-2 text-slate-300 tabular-nums">{r.catches}</td>
                  <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{r.run_outs}</td>
                  <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{r.stumpings}</td>
                  <td className="text-right px-3 py-2 text-white font-bold tabular-nums">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-700/50">
        Only dismissals recorded against a fielder in the scoring data are counted
      </div>
    </div>
  );
}