import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Share2, RefreshCw, BarChart3 } from 'lucide-react';
import { buildTournamentStats, resolveTournamentMatches } from '@/lib/tournamentStats';
import StatsOverview from './StatsOverview';
import BattingLeaderboard from './BattingLeaderboard';
import BowlingLeaderboard from './BowlingLeaderboard';
import FieldingLeaderboard from './FieldingLeaderboard';
import TeamPerformance from './TeamPerformance';
import TournamentRecords from './TournamentRecords';
import PlayerTournamentCard from './PlayerTournamentCard';
import TeamTournamentCard from './TeamTournamentCard';
import ShareStatsMenu from './ShareStatsMenu';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'batting', label: 'Batting' },
  { key: 'bowling', label: 'Bowling' },
  { key: 'fielding', label: 'Fielding' },
  { key: 'teams', label: 'Teams' },
  { key: 'records', label: 'Records' },
];

const asArray = (r) => (Array.isArray(r) ? r : r?.items ?? []);

export default function TournamentStats({ tournament, tournamentMatches = [], matches = [], teams = [], onOpenMatch }) {
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Every statistic is rebuilt from the stored scoring records. The fixture and
  // match ids are part of the query key, so linking, correcting or deleting a
  // match re-reads the affected data instead of showing a stale total.
  const fixtureIds = useMemo(() => tournamentMatches.map((tm) => tm.id), [tournamentMatches]);
  const linkedFixtureKey = useMemo(
    () => tournamentMatches.map((tm) => tm.match_id || '').join(','),
    [tournamentMatches]
  );

  const { data: records = {}, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['tournament-stats', tournament.id, fixtureIds.join(','), linkedFixtureKey],
    queryFn: async () => {
      const directIds = linkedFixtureKey.split(',').filter(Boolean);
      const [byFixture, byId] = await Promise.all([
        fixtureIds.length
          ? base44.entities.Match.filter({ tournament_match_id: { $in: fixtureIds } }, { limit: 200 })
          : [],
        directIds.length
          ? base44.entities.Match.filter({ id: { $in: directIds } }, { limit: 200 })
          : [],
      ]);

      const matchMap = new Map();
      [...matches, ...asArray(byFixture), ...asArray(byId)].forEach((m) => matchMap.set(m.id, m));
      const allMatches = [...matchMap.values()];
      const ids = resolveTournamentMatches(tournamentMatches, allMatches).map((m) => m.id);

      if (!ids.length) {
        return { matches: allMatches, linkedIds: [], innings: [], batters: [], bowlers: [], partnerships: [] };
      }

      const [innings, batters, bowlers, partnerships] = await Promise.all([
        base44.entities.Innings.filter({ match_id: { $in: ids } }, { limit: 400 }),
        base44.entities.BatterInnings.filter({ match_id: { $in: ids } }, { limit: 1000 }),
        base44.entities.BowlerInnings.filter({ match_id: { $in: ids } }, { limit: 1000 }),
        base44.entities.Partnership.filter({ match_id: { $in: ids } }, { limit: 400 }),
      ]);

      return {
        matches: allMatches,
        linkedIds: ids,
        innings: asArray(innings),
        batters: asArray(batters),
        bowlers: asArray(bowlers),
        partnerships: asArray(partnerships),
      };
    },
    staleTime: 0,
    enabled: !!tournament.id,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players', tournament.ground_mode || 'turf'],
    queryFn: () => base44.entities.Player.list('-created_date', 500),
    staleTime: 60_000,
  });

  const stats = useMemo(
    () =>
      buildTournamentStats({
        tournament,
        tournamentMatches,
        matches: records.matches || matches,
        innings: records.innings || [],
        batterInnings: records.batters || [],
        bowlerInnings: records.bowlers || [],
        partnerships: records.partnerships || [],
        teams,
        players: asArray(players),
      }),
    [tournament, tournamentMatches, matches, records, teams, players]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!records.linkedIds?.length) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 py-14 text-center px-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
          <BarChart3 className="w-7 h-7 text-slate-600" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">No statistics yet</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Statistics are built automatically from the matches scored in this tournament. Start a
          fixture from the tournament view and everything appears here as soon as a match is complete.
        </p>
      </div>
    );
  }

  const showSearch = ['batting', 'bowling', 'fielding'].includes(tab);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.key
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {showSearch && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search player or team"
                className="w-40 sm:w-52 bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
          <button
            onClick={() => refetch()}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
            title="Recalculate"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-emerald-400"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      {tab === 'overview' && <StatsOverview stats={stats} onSelectPlayer={setPlayerId} />}
      {tab === 'batting' && (
        <BattingLeaderboard rows={stats.batting} search={search} onSelectPlayer={setPlayerId} />
      )}
      {tab === 'bowling' && (
        <BowlingLeaderboard rows={stats.bowling} search={search} onSelectPlayer={setPlayerId} />
      )}
      {tab === 'fielding' && (
        <FieldingLeaderboard rows={stats.fielding} search={search} onSelectPlayer={setPlayerId} />
      )}
      {tab === 'teams' && (
        <TeamPerformance
          pointsTable={stats.pointsTable}
          teams={stats.teams}
          onSelectTeam={setTeamId}
        />
      )}
      {tab === 'records' && (
        <TournamentRecords
          records={stats.records}
          onSelectPlayer={setPlayerId}
          onOpenMatch={onOpenMatch}
        />
      )}

      {playerId && (
        <PlayerTournamentCard
          playerId={playerId}
          stats={stats}
          tournamentName={tournament.name}
          onClose={() => setPlayerId(null)}
          onOpenMatch={(id) => {
            setPlayerId(null);
            onOpenMatch(id);
          }}
        />
      )}
      {teamId && (
        <TeamTournamentCard
          teamId={teamId}
          stats={stats}
          tournamentName={tournament.name}
          onClose={() => setTeamId(null)}
          onOpenMatch={(id) => {
            setTeamId(null);
            onOpenMatch(id);
          }}
        />
      )}
      <ShareStatsMenu
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        stats={stats}
        tournament={tournament}
      />
    </div>
  );
}