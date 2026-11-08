import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Trophy, CalendarDays, MapPin, Lock } from 'lucide-react';
import InningsBlock from '@/components/share/InningsBlock';

const LOGO = 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

const Shell = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <header className="border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <a href="https://cricktrack.com" className="flex items-center gap-2 min-w-0">
          <img src={LOGO} alt="CrickTrack" className="h-9 w-auto rounded-lg bg-white p-1 shrink-0" />
          <span className="text-base font-bold text-white tracking-tight truncate">CrickTrack</span>
        </a>
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold shrink-0">
          Shared scorecard
        </span>
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    <footer className="max-w-3xl mx-auto px-4 pb-10">
      <a
        href="https://cricktrack.com"
        className="block rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center hover:bg-emerald-500/15 transition-colors"
      >
        <span className="block text-sm font-semibold text-emerald-400">Score your own matches with CrickTrack</span>
        <span className="block text-xs text-slate-400 mt-1">Ball-by-ball scoring, player analytics and shareable scorecards</span>
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

export default function SharedScorecard() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-scorecard', matchId],
    queryFn: async () => {
      const res = await base44.functions.invoke('getPublicScorecard', { match_id: matchId });
      return res.data;
    },
    enabled: !!matchId,
    retry: false,
  });

  if (!matchId) {
    return <Notice title="No scorecard selected" message="This link is missing its match reference." />;
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

  if (isError || !data?.match) {
    const status = error?.response?.status;
    return (
      <Notice
        title={status === 403 ? 'This scorecard is not public yet' : 'Scorecard not found'}
        message={
          status === 403
            ? 'A shared scorecard link goes live once the match has been marked complete.'
            : 'The link may be incomplete, or the match is no longer available.'
        }
      />
    );
  }

  const { match, innings, batterInnings, bowlerInnings, partnerships, teams, players } = data;
  const teamsMap = Object.fromEntries(teams.map((t) => [t.id, t]));
  const playersMap = Object.fromEntries(players.map((p) => [p.id, p]));
  const regularInnings = innings
    .filter((i) => !i.is_super_over)
    .sort((a, b) => (a.innings_number ?? 0) - (b.innings_number ?? 0));

  const team1 = teamsMap[match.team1_id]?.name || 'Team 1';
  const team2 = teamsMap[match.team2_id]?.name || 'Team 2';
  const dateText = match.date
    ? new Date(`${match.date}T00:00:00`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  return (
    <Shell>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mb-2">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {dateText || 'Date not recorded'}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            {match.venue || 'Venue not recorded'}
          </span>
          {match.overs_per_innings && match.format !== 'test' && (
            <span className="text-slate-500">{match.overs_per_innings} overs a side</span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          {team1} <span className="text-slate-500 font-normal">vs</span> {team2}
        </h1>

        {match.result && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <Trophy className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-emerald-400">{match.result}</span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {regularInnings.map((inn) => (
          <InningsBlock
            key={inn.id}
            innings={inn}
            batterInnings={batterInnings}
            bowlerInnings={bowlerInnings}
            partnerships={partnerships.filter((p) => p.innings_id === inn.id)}
            playersMap={playersMap}
            teamName={teamsMap[inn.batting_team_id]?.name || 'Team'}
          />
        ))}
      </div>
    </Shell>
  );
}