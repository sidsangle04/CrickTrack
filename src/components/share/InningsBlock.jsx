import React from 'react';
import PartnershipTable from '@/components/analytics/PartnershipTable';
import { getDismissalText, getOversDisplay } from '@/lib/scorecardText';

const TableShell = ({ title, children }) => (
  <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-700/50">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
    </div>
    <div className="overflow-x-auto">{children}</div>
  </div>
);

export default function InningsBlock({ innings, batterInnings, bowlerInnings, partnerships, playersMap, teamName }) {
  const batters = batterInnings
    .filter((b) => b.innings_id === innings.id)
    .sort((a, b) => (a.batting_position ?? 99) - (b.batting_position ?? 99));
  const bowlers = bowlerInnings.filter((b) => b.innings_id === innings.id);
  const extras =
    (innings.extras_wide || 0) +
    (innings.extras_no_ball || 0) +
    (innings.extras_byes || 0) +
    (innings.extras_leg_byes || 0);

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">
          {teamName} innings
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{innings.total_runs ?? 0}</span>
          <span className="text-xl text-slate-400">/{innings.total_wickets ?? 0}</span>
          <span className="text-slate-500 text-sm">({getOversDisplay(innings.total_balls)} ov)</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Extras: {extras}
          <span className="text-slate-600 ml-2">
            (Wd {innings.extras_wide || 0}, Nb {innings.extras_no_ball || 0}, B {innings.extras_byes || 0}, Lb{' '}
            {innings.extras_leg_byes || 0})
          </span>
        </div>
      </div>

      <TableShell title="Batting">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-700/50">
              <th className="text-left p-3">Batter</th>
              <th className="text-right p-3">R</th>
              <th className="text-right p-3">B</th>
              <th className="text-right p-3">4s</th>
              <th className="text-right p-3">6s</th>
              <th className="text-right p-3">SR</th>
            </tr>
          </thead>
          <tbody>
            {batters.map((b) => {
              const sr = b.balls_faced > 0 ? ((b.runs / b.balls_faced) * 100).toFixed(1) : '0.0';
              return (
                <tr key={b.id} className="border-b border-slate-700/30">
                  <td className="p-3">
                    <div className="font-medium text-white text-sm">{playersMap[b.player_id]?.name || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{getDismissalText(b, playersMap)}</div>
                  </td>
                  <td className="text-right p-3 font-semibold text-white">{b.runs ?? 0}</td>
                  <td className="text-right p-3 text-slate-400">{b.balls_faced ?? 0}</td>
                  <td className="text-right p-3 text-slate-400">{b.fours ?? 0}</td>
                  <td className="text-right p-3 text-slate-400">{b.sixes ?? 0}</td>
                  <td className="text-right p-3 text-slate-400">{sr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>

      <TableShell title="Bowling">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-700/50">
              <th className="text-left p-3">Bowler</th>
              <th className="text-right p-3">O</th>
              <th className="text-right p-3">M</th>
              <th className="text-right p-3">R</th>
              <th className="text-right p-3">W</th>
              <th className="text-right p-3">Econ</th>
            </tr>
          </thead>
          <tbody>
            {bowlers.map((b) => {
              const econ = b.balls > 0 ? (b.runs_conceded / (b.balls / 6)).toFixed(2) : '0.00';
              return (
                <tr key={b.id} className="border-b border-slate-700/30">
                  <td className="p-3 font-medium text-white text-sm">{playersMap[b.player_id]?.name || 'Unknown'}</td>
                  <td className="text-right p-3 text-slate-400">{b.overs}.{(b.balls || 0) % 6}</td>
                  <td className="text-right p-3 text-slate-400">{b.maidens || 0}</td>
                  <td className="text-right p-3 text-slate-400">{b.runs_conceded}</td>
                  <td className="text-right p-3 font-semibold text-white">{b.wickets}</td>
                  <td className="text-right p-3 text-slate-400">{econ}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>

      {partnerships.length > 0 && (
        <PartnershipTable partnerships={partnerships} playersMap={playersMap} teamName={teamName} />
      )}
    </div>
  );
}