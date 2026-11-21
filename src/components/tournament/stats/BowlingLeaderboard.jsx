import React, { useMemo, useState } from 'react';
import { Crown, ArrowUpDown } from 'lucide-react';

const SORTS = [
  { key: 'wickets', label: 'Most wickets' },
  { key: 'average', label: 'Best average' },
  { key: 'economy', label: 'Best economy' },
  { key: 'best_sort', label: 'Best figures' },
  { key: 'strike_rate', label: 'Best strike rate' },
];

const fmt = (v) => (v === null || v === undefined ? '—' : v);

export default function BowlingLeaderboard({ rows = [], search = '', onSelectPlayer }) {
  const [sort, setSort] = useState('wickets');
  const [minBalls, setMinBalls] = useState(0);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows
      .filter((r) => r.balls >= Number(minBalls))
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.team_name.toLowerCase().includes(q));
    // Rate-based sorts read best when a bowler has actually bowled; a null
    // value (no wickets / no balls) sinks to the bottom either way.
    const ascending = ['average', 'economy', 'strike_rate'].includes(sort);
    return list.sort((a, b) => {
      const av = a[sort];
      const bv = b[sort];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return ascending ? av - bv : bv - av;
    });
  }, [rows, sort, minBalls, search]);

  const leaderId = useMemo(
    () => rows.reduce((best, r) => (!best || r.wickets > best.wickets ? r : best), null)?.player_id,
    [rows]
  );

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Bowling leaderboard</h3>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <select
            value={minBalls}
            onChange={(e) => setMinBalls(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value={0}>All bowlers</option>
            <option value={6}>Min 1 over</option>
            <option value={12}>Min 2 overs</option>
            <option value={24}>Min 4 overs</option>
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {rows.length === 0 ? 'No completed matches yet' : 'No bowlers match this filter'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[880px]">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="text-left px-3 py-2 font-medium">#</th>
                <th className="text-left px-3 py-2 font-medium">Player</th>
                <th className="text-left px-3 py-2 font-medium">Team</th>
                <th className="text-center px-2 py-2 font-medium">M</th>
                <th className="text-right px-2 py-2 font-medium">Overs</th>
                <th className="text-right px-2 py-2 font-medium">Runs</th>
                <th className="text-right px-3 py-2 font-medium text-white">Wkts</th>
                <th className="text-right px-2 py-2 font-medium">Best</th>
                <th className="text-right px-2 py-2 font-medium">Avg</th>
                <th className="text-right px-2 py-2 font-medium">Econ</th>
                <th className="text-right px-2 py-2 font-medium">SR</th>
                <th className="text-right px-2 py-2 font-medium">Dots</th>
                <th className="text-right px-3 py-2 font-medium">Mdns</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => {
                const isLeader = r.player_id === leaderId;
                return (
                  <tr
                    key={r.player_id}
                    onClick={() => onSelectPlayer(r.player_id)}
                    className={`border-b border-slate-700/30 cursor-pointer hover:bg-slate-700/30 ${
                      isLeader ? 'bg-amber-500/10' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5 text-white font-medium">
                        {isLeader && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="truncate">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 truncate">{r.team_name || '—'}</td>
                    <td className="text-center px-2 py-2 text-slate-300">{r.matches}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{r.overs}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{r.runs}</td>
                    <td className="text-right px-3 py-2 text-white font-bold tabular-nums">{r.wickets}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{r.best_text}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{fmt(r.average)}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{fmt(r.economy)}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{fmt(r.strike_rate)}</td>
                    <td className="text-right px-2 py-2 text-cyan-400 tabular-nums">{r.dots}</td>
                    <td className="text-right px-3 py-2 text-slate-400 tabular-nums">{r.maidens}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-700/50">
        Average = runs ÷ wickets · Economy = runs ÷ legal overs · Strike rate = legal balls ÷ wickets ·
        run-outs are not credited to the bowler
      </div>
    </div>
  );
}