import React, { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  Trophy,
  Plus,
  ArrowLeft,
  Loader2,
  Crown,
  Trash2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTournamentModal from '@/components/tournament/CreateTournamentModal';
import BracketView from '@/components/tournament/BracketView';
import { deriveBracket, computeStandings, leagueComplete, seedKnockoutRound1, seedPlayoffs } from '@/lib/bracket';
import { computeQualification } from '@/lib/qualification';
import LeagueView from '@/components/tournament/LeagueView';
import { useGroundShape } from '@/lib/GroundShapeContext';

export default function Tournaments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode } = useGroundShape();
  const modeLabel = mode === 'circular' ? 'Circular' : 'TURF';
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments', mode],
    queryFn: () => base44.entities.Tournament.list('-created_date', 50)
  });
  const { data: teams = [] } = useQuery({
    queryKey: ['teams', mode],
    queryFn: () => base44.entities.Team.list()
  });
  const { data: allMatches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.list('-created_date', 100)
  });

  const modeTournaments = useMemo(
    () => tournaments.filter((t) => (t.ground_mode || 'turf') === mode),
    [tournaments, mode]
  );
  const modeTeams = useMemo(
    () => teams.filter((t) => (t.ground_mode || 'turf') === mode),
    [teams, mode]
  );

  const teamsMap = useMemo(
    () => modeTeams.reduce((a, t) => ({ ...a, [t.id]: t }), {}),
    [modeTeams]
  );
  const matchesMap = useMemo(
    () => allMatches.reduce((a, m) => ({ ...a, [m.id]: m }), {}),
    [allMatches]
  );

  const selected = modeTournaments.find((t) => t.id === selectedId);

  const { data: tmMatches = [] } = useQuery({
    queryKey: ['tournament-matches', selectedId],
    queryFn: () =>
      selectedId
        ? base44.entities.TournamentMatch.filter({ tournament_id: selectedId })
        : [],
    enabled: !!selectedId
  });

  const leagueMatchIds = useMemo(
    () =>
      tmMatches
        .filter((m) => m.stage === 'league' && m.match_id)
        .map((m) => m.match_id),
    [tmMatches]
  );

  const { data: leagueInnings = [] } = useQuery({
    queryKey: ['tournament-league-innings', selectedId, leagueMatchIds.join(',')],
    queryFn: () =>
      leagueMatchIds.length
        ? base44.entities.Innings.filter({ match_id: { $in: leagueMatchIds } })
        : [],
    enabled: leagueMatchIds.length > 0
  });

  const inningsByMatch = useMemo(
    () =>
      leagueInnings.reduce((a, inn) => {
        (a[inn.match_id] = a[inn.match_id] || []).push(inn);
        return a;
      }, {}),
    [leagueInnings]
  );

  const derived = useMemo(() => {
    if (!tmMatches.length) return null;
    if (selected?.format === 'league_playoffs') {
      const leagueMatches = tmMatches.filter((m) => m.stage === 'league');
      const knockoutMatches = tmMatches.filter((m) => m.stage !== 'league');
      const standings = computeStandings(leagueMatches, matchesMap, inningsByMatch);
      const done = leagueComplete(leagueMatches, matchesMap);
      const roundTeams = done
        ? seedPlayoffs(standings, knockoutMatches, matchesMap).roundTeams
        : null;
      const knockout = knockoutMatches.length
        ? deriveBracket(knockoutMatches, matchesMap, { roundTeams })
        : null;
      const qualification = computeQualification({
        standings,
        leagueMatches,
        matchesMap,
        teamsMap,
        qualifyPlaces: 3
      });
      return { format: 'league_playoffs', leagueMatches, standings, leagueComplete: done, knockout, qualification };
    }
    if (selected?.format === 'league_knockout') {
      const leagueMatches = tmMatches.filter((m) => m.stage === 'league');
      const knockoutMatches = tmMatches.filter((m) => m.stage !== 'league');
      const standings = computeStandings(leagueMatches, matchesMap, inningsByMatch);
      const done = leagueComplete(leagueMatches, matchesMap);
      const round1Teams = done ? seedKnockoutRound1(standings, selected.knockout_teams || 4) : null;
      const knockout = knockoutMatches.length
        ? deriveBracket(knockoutMatches, matchesMap, { round1Teams })
        : null;
      const qualification = computeQualification({
        standings,
        leagueMatches,
        matchesMap,
        teamsMap,
        qualifyPlaces: selected.knockout_teams || 4
      });
      return { format: 'league_knockout', leagueMatches, standings, leagueComplete: done, knockout, qualification };
    }
    return { format: 'knockout', knockout: deriveBracket(tmMatches, matchesMap) };
  }, [tmMatches, matchesMap, selected, inningsByMatch]);

  // Persist champion + completed status once the final is decided.
  const championRef = useRef('');
  useEffect(() => {
    if (!derived || !selected) return;
    const ko = derived.knockout;
    const finalMatch = ko?.state[ko?.totalRounds]?.[0];
    const champion = finalMatch?.winner;
    const key = `${selected.id}|${champion}`;
    if (champion && selected.champion_team_id !== champion && championRef.current !== key) {
      championRef.current = key;
      base44.entities.Tournament
        .update(selected.id, { champion_team_id: champion, status: 'completed' })
        .then(() => queryClient.invalidateQueries(['tournaments']));
    }
  }, [derived, selected, queryClient]);

  const handleSetWinner = async (tmId, winnerId) => {
    if (!winnerId) return;
    await base44.entities.TournamentMatch.update(tmId, {
      winner_team_id: winnerId,
      status: 'completed'
    });
    queryClient.invalidateQueries(['tournament-matches', selectedId]);
  };

  const handleStartGame = (tmId, team1Id, team2Id) => {
    navigate(
      createPageUrl('MatchSetup') +
        `?team1_id=${team1Id}&team2_id=${team2Id}&tournament_match_id=${tmId}`
    );
  };

  const handleOpenMatch = (matchId, status) => {
    if (status === 'completed')
      navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
    else if (status === 'setup')
      navigate(createPageUrl('MatchSetup') + `?matchId=${matchId}`);
    else navigate(createPageUrl('LiveScoring') + `?matchId=${matchId}`);
  };

  const handleDeleteTournament = async (id) => {
    if (!window.confirm('Delete this tournament and all its bracket matches?')) return;
    await base44.entities.TournamentMatch.deleteMany({ tournament_id: id });
    await base44.entities.Tournament.delete(id);
    queryClient.invalidateQueries(['tournaments']);
    setSelectedId(null);
  };

  if (selected) {
    const isPlayoffs = selected.format === 'league_playoffs';
    const isLeagueKO = selected.format === 'league_knockout';
    const isLeagueStage = isLeagueKO || isPlayoffs;
    const formatLabel = isPlayoffs
      ? 'League + Playoffs'
      : isLeagueKO
      ? 'League + Knockout'
      : 'Knockout';
    return (
      <div className="pb-24 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{selected.name}</h1>
            <p className="text-slate-400 text-xs">{formatLabel} · {selected.num_teams} teams</p>
          </div>
          {selected.status === 'completed' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium shrink-0">
              <Crown className="w-4 h-4" />
              {teamsMap[selected.champion_team_id]?.name || 'Champion'}
            </span>
          )}
          <button
            onClick={() => handleDeleteTournament(selected.id)}
            className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10"
            title="Delete tournament"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {!derived ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : isLeagueStage ? (
          <>
            <LeagueView
              leagueMatches={derived.leagueMatches}
              standings={derived.standings}
              teamsMap={teamsMap}
              matchesMap={matchesMap}
              leagueComplete={derived.leagueComplete}
              qualification={derived.qualification}
              knockoutTeams={selected.knockout_teams || 4}
              seedLabels={isPlayoffs ? ['Final', 'SF', 'SF', 'OUT'] : undefined}
              footerNote={
                isPlayoffs
                  ? 'Table topper goes straight to the Final · 2nd vs 3rd in the Semifinal · 4th eliminated · Win = 2 pts'
                  : undefined
              }
              onSetWinner={handleSetWinner}
              onStartGame={handleStartGame}
              onOpenMatch={handleOpenMatch}
            />
            {isPlayoffs && derived.leagueComplete && derived.standings.length === 4 && (
              <div className="mt-6 grid sm:grid-cols-3 gap-2">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Straight to Final</div>
                    <div className="text-sm text-white font-medium truncate">
                      {teamsMap[derived.standings[0].id]?.name || 'TBD'}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 p-3 flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Semifinal</div>
                    <div className="text-sm text-white font-medium truncate">
                      {teamsMap[derived.standings[1].id]?.name || 'TBD'} vs {teamsMap[derived.standings[2].id]?.name || 'TBD'}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Eliminated</div>
                    <div className="text-sm text-white font-medium truncate">
                      {teamsMap[derived.standings[3].id]?.name || 'TBD'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {derived.knockout && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{isPlayoffs ? 'Playoffs' : 'Knockout'}</h2>
                  {!derived.leagueComplete && (
                    <span className="text-xs text-slate-500">· seeds after league stage</span>
                  )}
                </div>
                <BracketView
                  derived={derived.knockout}
                  teamsMap={teamsMap}
                  matchesMap={matchesMap}
                  onSetWinner={handleSetWinner}
                  onStartGame={handleStartGame}
                  onOpenMatch={handleOpenMatch}
                />
              </div>
            )}
          </>
        ) : (
          <BracketView
            derived={derived.knockout}
            teamsMap={teamsMap}
            matchesMap={matchesMap}
            onSetWinner={handleSetWinner}
            onStartGame={handleStartGame}
            onOpenMatch={handleOpenMatch}
          />
        )}
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Tournaments</h1>
          <p className="text-slate-400 text-sm">
            Create knockout brackets & track the road to the final
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          <Plus className="w-4 h-4 mr-2" /> New
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : modeTournaments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No {modeLabel} tournaments yet</h3>
          <p className="text-slate-400 text-sm mb-4">
            Create your first {modeLabel} knockout tournament
          </p>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-4 h-4 mr-2" /> New Tournament
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modeTournaments.map((t) => {
            const champ = teamsMap[t.champion_team_id];
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className="text-left p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      t.status === 'completed'
                        ? 'bg-amber-500/20 text-amber-400'
                        : t.status === 'in_progress'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {t.status === 'completed'
                      ? 'Completed'
                      : t.status === 'in_progress'
                      ? 'In Progress'
                      : 'Setup'}
                  </span>
                  {t.status === 'completed' && champ && (
                    <Crown className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <h3 className="font-semibold text-white mb-1">{t.name}</h3>
                <p className="text-sm text-slate-400">
                  {t.num_teams} teams ·{' '}
                  {t.format === 'league_playoffs'
                    ? 'League + Playoffs'
                    : t.format === 'league_knockout'
                    ? 'League + KO'
                    : 'Knockout'}
                </p>
                {champ && (
                  <p className="text-sm text-amber-400 mt-2">🏆 {champ.name}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTournamentModal
          teams={modeTeams}
          onClose={() => setShowCreate(false)}
          onCreated={(id) => {
            setShowCreate(false);
            setSelectedId(id);
          }}
        />
      )}
    </div>
  );
}