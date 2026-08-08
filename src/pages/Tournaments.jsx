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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateTournamentModal from '@/components/tournament/CreateTournamentModal';
import BracketView from '@/components/tournament/BracketView';
import { deriveBracket } from '@/lib/bracket';

export default function Tournaments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => base44.entities.Tournament.list('-created_date', 50)
  });
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });
  const { data: allMatches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.list('-created_date', 100)
  });

  const teamsMap = useMemo(
    () => teams.reduce((a, t) => ({ ...a, [t.id]: t }), {}),
    [teams]
  );
  const matchesMap = useMemo(
    () => allMatches.reduce((a, m) => ({ ...a, [m.id]: m }), {}),
    [allMatches]
  );

  const selected = tournaments.find((t) => t.id === selectedId);

  const { data: tmMatches = [] } = useQuery({
    queryKey: ['tournament-matches', selectedId],
    queryFn: () =>
      selectedId
        ? base44.entities.TournamentMatch.filter({ tournament_id: selectedId })
        : [],
    enabled: !!selectedId
  });

  const derived = useMemo(() => {
    if (!tmMatches.length) return null;
    return deriveBracket(tmMatches, matchesMap);
  }, [tmMatches, matchesMap]);

  // Persist champion + completed status once the final is decided.
  const championRef = useRef('');
  useEffect(() => {
    if (!derived || !selected) return;
    const finalMatch = derived.state[derived.totalRounds]?.[0];
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
    return (
      <div className="pb-24 md:pb-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedId(null)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{selected.name}</h1>
            <p className="text-slate-400 text-xs">
              Knockout bracket · {selected.num_teams} teams
            </p>
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
        ) : (
          <BracketView
            derived={derived}
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
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No tournaments yet</h3>
          <p className="text-slate-400 text-sm mb-4">
            Create your first knockout tournament
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
          {tournaments.map((t) => {
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
                  {t.num_teams} teams · Knockout
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
          teams={teams}
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