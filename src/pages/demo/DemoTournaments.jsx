import React from 'react';
import { Trophy, CalendarDays } from 'lucide-react';
import DemoShell from '@/components/demo/DemoShell';
import DemoLockedAction from '@/components/demo/DemoLockedAction';
import RoadToFinal from '@/components/tournament/RoadToFinal';
import { DEMO_TOURNAMENT, DEMO_TEAMS_MAP } from '@/lib/demoData';

const FORMAT_LABEL = {
  knockout: 'Knockout',
  league_knockout: 'League + Knockout',
  league_playoffs: 'League + Playoffs',
  league_qualifiers: 'League + Qualifiers',
};

export default function DemoTournaments() {
  const t = DEMO_TOURNAMENT;

  return (
    <DemoShell
      title="Cup"
      subtitle="Run leagues, knockouts and playoffs with automatic standings and brackets"
      action={<DemoLockedAction label="New tournament" className="!px-3 !py-2 shrink-0" />}
    >
      {/* Tournament header */}
      <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30 p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white truncate">{t.name}</h2>
            <p className="text-sm text-slate-400">
              {FORMAT_LABEL[t.format]} · {t.team_ids.length} teams
            </p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              In progress
            </span>
          </div>
        </div>
      </div>

      {/* Playoff bracket */}
      <RoadToFinal
        teamsMap={DEMO_TEAMS_MAP}
        seeds={t.standings.map((row) => row.team_id)}
        matches={[
          t.bracket[0],
          t.bracket[1],
          { team1: t.bracket[0].team2_id, team2: t.bracket[1].winner_team_id, winner: t.bracket[1].winner_team_id },
          t.bracket[2],
        ].map((m) => ({ team1: m.team1_id || m.team1, team2: m.team2_id || m.team2, winner: m.winner_team_id || m.winner }))}
      />
      <p className="mt-3 mb-6 text-xs text-slate-500 flex items-center gap-2">
        <CalendarDays className="w-3.5 h-3.5" />
        Winners advance automatically as soon as a fixture is scored.
      </p>

      {/* Standings */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 mb-6">
        <h3 className="font-semibold text-white mb-3">League standings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left font-medium py-2">Team</th>
                <th className="text-center font-medium py-2 w-10">P</th>
                <th className="text-center font-medium py-2 w-10">W</th>
                <th className="text-center font-medium py-2 w-10">L</th>
                <th className="text-center font-medium py-2 w-12">Pts</th>
                <th className="text-right font-medium py-2 w-16">NRR</th>
              </tr>
            </thead>
            <tbody>
              {t.standings.map((row, i) => {
                const team = DEMO_TEAMS_MAP[row.team_id];
                const qualifies = i < 2;
                return (
                  <tr key={row.team_id} className="border-t border-slate-700/40">
                    <td className="py-2.5">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: team?.primary_color }}
                        />
                        <span className={`truncate ${qualifies ? 'text-white font-medium' : 'text-slate-300'}`}>
                          {team?.name}
                        </span>
                      </span>
                    </td>
                    <td className="text-center text-slate-300">{row.played}</td>
                    <td className="text-center text-emerald-400">{row.won}</td>
                    <td className="text-center text-slate-400">{row.lost}</td>
                    <td className="text-center font-bold text-white">{row.points}</td>
                    <td className="text-right text-slate-400">{row.nrr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Top 4 qualify: 1st plays 2nd in Qualifier 1, 3rd plays 4th in the Eliminator.
        </p>
      </div>

    </DemoShell>
  );
}