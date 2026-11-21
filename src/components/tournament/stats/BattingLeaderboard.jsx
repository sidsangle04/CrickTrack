import React, { useMemo, useState } from 'react';
import { Crown, ArrowUpDown } from 'lucide-react';

const SORTS = [
  { key: 'runs', label: 'Runs' },
  { key: 'average', label: 'Batting average' },
  { key: 'strike_rate', label: 'Strike rate' },
  { key: 'hs', label: 'Highest score' },
  { key: 'sixes', label: 'Sixes' },
];

const fmt = (v) => (v === null || v === undefined ? '—' : v);

export default function BattingLeaderboard({ rows = [], search = '', onSelectPlayer }) {
  const [sort, setSort] = useState('runs');
  const [minInnings, setMinInnings] = useState(1);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => r.innings >= Number(minInnings))
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.team_name.toLowerCase().includes(q))
      .sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1) || b.runs - a.runs);
  }, [rows, sort, minInnings, search]);

  const leaderId = useMemo(
    () => rows.reduce((best, r) => (!best || r.runs > best.runs ? r : best), null)?.player_id,
    [rows]
  );

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700/50 flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Batting leaderboard</h3>
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
            value={minInnings}
            onChange={(e) => setMinInnings(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-200 px-2 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            {[1, 2, 3, 5].map((n) => <option key={n} value={n}>Min {n} inns</option>)}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-center text-sm text-slate-500">
          {rows.length === 0 ? 'No completed matches yet' : 'No players match this filter'}
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
                <th className="text-center px-2 py-2 font-medium">Inn</th>
                <th className="text-right px-3 py-2 font-medium text-white">Runs</th>
                <th className="text-right px-2 py-2 font-medium">Balls</th>
                <th className="text-right px-2 py-2 font-medium">HS</th>
                <th className="text-right px-2 py-2 font-medium">Avg</th>
                <th className="text-right px-2 py-2 font-medium">SR</th>
                <th className="text-right px-2 py-2 font-medium">4s</th>
                <th className="text-right px-2 py-2 font-medium">6s</th>
                <th className="text-right px-2 py-2 font-medium">30s</th>
                <th className="text-right px-3 py-2 font-medium">50s</th>
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
                      isLeader ? 'bg-emerald-500/10' : ''
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
                    <td className="text-center px-2 py-2 text-slate-300">{r.innings}</td>
                    <td className="text-right px-3 py-2 text-white font-bold tabular-nums">{r.runs}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{r.balls}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{r.hs_text}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{fmt(r.average)}</td>
                    <td className="text-right px-2 py-2 text-slate-300 tabular-nums">{fmt(r.strike_rate)}</td>
                    <td className="text-right px-2 py-2 text-cyan-400 tabular-nums">{r.fours}</td>
                    <td className="text-right px-2 py-2 text-amber-400 tabular-nums">{r.sixes}</td>
                    <td className="text-right px-2 py-2 text-slate-400 tabular-nums">{r.thirties}</td>
                    <td className="text-right px-3 py-2 text-slate-400 tabular-nums">{r.fifties}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-4 py-2 text-[10px] text-slate-500 border-t border-slate-700/50">
        Average = runs ÷ dismissals · Strike rate = runs ÷ balls faced × 100 · HS* = not out
      </div>
    </div>
  );
}