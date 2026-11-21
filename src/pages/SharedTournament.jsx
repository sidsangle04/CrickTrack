import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Trophy, Lock } from 'lucide-react';
import { buildTournamentStats } from '@/lib/tournamentStats';
import StatTile from '@/components/tournament/stats/StatTile';
import { Flag, TrendingUp, Target, Timer, Flame, Zap, Award, Crosshair } from 'lucide-react';

const LOGO = 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <a href="https://cricktrack.com" className="flex items-center gap-2 min-w-0">
          <img src={LOGO} alt="CrickTrack" className="h-9 w-auto rounded-lg bg-white p-1 shrink-0" />
          <span className="text-base font-bold text-white tracking-tight truncate">CrickTrack</span>
        </a>
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold shrink-0">
          Tournament statistics
        </span>
      </div>
    </header>
    <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    <footer className="max-w-5xl mx-auto px-4 pb-10">
      <a
        href="https://cricktrack.com"
        className="block rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center hover:bg-emerald-500/15 transition-colors"
      >
        <span className="block text-sm font-semibold text-emerald-400">Run your own tournaments on CrickTrack</span>
        <span className="block text-xs text-slate-400 mt-1">Ball-by-ball scoring, automatic statistics and shareable scorecards</span>
      </a>
    </footer>
  </div>
);

const Notice = ({ title, message }) => (
  <Shell>
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
      <Lock className="w-8 h-8 text-slate-500 mx-auto mb-3" />
      <h1 className="text-lg font-bold text-white mb-2">{title}</h1>
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  </Shell>
);

const Table = ({ title, head, rows }) => (
  <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-700/50 text-xs font-semibold uppercase tracking-wide text-white">
      {title}
    </div>
    {rows.length === 0 ? (
      <div className="py-8 text-center text-sm text-slate-500">Nothing recorded yet</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[520px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700/50">
              {head.map((h, i) => (
                <th key={h} className={`px-3 py-2 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-700/30">
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={`px-3 py-2 ${j === 0 ? 'text-white font-medium' : 'text-right text-slate-300 tabular-nums'}`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default function SharedTournament() {
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('tournamentId');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-tournament', tournamentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPublicTournamentStats', {
        tournament_id: tournamentId,
      });
      return res.data;
    },
    enabled: !!tournamentId,
    retry: false,
  });

  if (!tournamentId) {
    return <Notice title="No tournament selected" message="This link is missing its tournament reference." />;
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (isError || !data?.tournament) {
    return (
      <Notice
        title="Tournament not found"
        message="The link may be incomplete, or the tournament is no longer available."
      />
    );
  }

  const stats = buildTournamentStats({
    tournament: data.tournament,
    tournamentMatches: data.tournamentMatches || [],
    matches: data.matches || [],
    innings: data.innings || [],
    batterInnings: data.batterInnings || [],
    bowlerInnings: data.bowlerInnings || [],
    partnerships: data.partnerships || [],
    teams: data.teams || [],
    players: data.players || [],
  });

  const { overview, pointsTable, batting, bowling, fielding, records } = stats;

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{data.tournament.name}</h1>
        <p className="text-sm text-slate-400 mt-1">
          {overview.matches} completed {overview.matches === 1 ? 'match' : 'matches'}
          {overview.live_matches > 0 ? ` · ${overview.live_matches} in progress` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatTile icon={Flag} label="Matches" value={overview.matches} accent="emerald" />
        <StatTile icon={TrendingUp} label="Runs" value={overview.runs} accent="cyan" />
        <StatTile icon={Target} label="Wickets" value={overview.wickets} accent="rose" />
        <StatTile icon={Timer} label="Overs" value={overview.overs} accent="slate" />
        <StatTile icon={Flame} label="Sixes" value={overview.sixes} accent="amber" />
        <StatTile icon={Zap} label="Fours" value={overview.fours} accent="cyan" />
        <StatTile
          icon={Award}
          label="Highest team score"
          value={overview.highest_team_score?.value || '—'}
          sub={overview.highest_team_score?.team}
          accent="emerald"
        />
        <StatTile
          icon={Crosshair}
          label="Best bowling"
          value={overview.best_bowling?.value || '—'}
          sub={overview.best_bowling?.name}
          accent="rose"
        />
      </div>

      <div className="space-y-5">
        <Table
          title="Points table"
          head={['Team', 'P', 'W', 'L', 'T', 'NR', 'Pts', 'NRR']}
          rows={pointsTable.map((t) => [
            t.name,
            t.played,
            t.won,
            t.lost,
            t.tied,
            t.no_result,
            t.points,
            t.nrr === null ? '—' : t.nrr.toFixed(3),
          ])}
        />
        <Table
          title="Leading run scorers"
          head={['Player', 'Team', 'Inn', 'Runs', 'HS', 'Avg', 'SR']}
          rows={[...batting]
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 10)
            .map((p) => [p.name, p.team_name, p.innings, p.runs, p.hs_text, p.average ?? '—', p.strike_rate ?? '—'])}
        />
        <Table
          title="Leading wicket takers"
          head={['Player', 'Team', 'Overs', 'Wkts', 'Best', 'Econ']}
          rows={[...bowling]
            .sort((a, b) => b.wickets - a.wickets || b.best_sort - a.best_sort)
            .slice(0, 10)
            .map((p) => [p.name, p.team_name, p.overs, p.wickets, p.best_text, p.economy ?? '—'])}
        />
        <Table
          title="Fielding"
          head={['Player', 'Team', 'Catches', 'Run-outs', 'Stumpings', 'Total']}
          rows={[...fielding]
            .sort((a, b) => b.total - a.total)
            .slice(0, 10)
            .map((p) => [p.name, p.team_name, p.catches, p.run_outs, p.stumpings, p.total])}
        />
        <Table
          title="Tournament records"
          head={['Record', 'Value', 'Name', 'Match']}
          rows={Object.entries(records)
            .filter(([, r]) => r)
            .map(([key, r]) => [
              key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
              r.value,
              r.name,
              r.match || '—',
            ])}
        />
      </div>

      {overview.matches === 0 && (
        <p className="mt-6 flex items-center gap-2 text-xs text-slate-500">
          <Trophy className="w-4 h-4" />
          Statistics appear here once matches in this tournament are completed.
        </p>
      )}
    </Shell>
  );
}