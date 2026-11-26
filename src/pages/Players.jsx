import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Search, Loader2, Users, ChevronRight, ArrowLeftRight, Plus, Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGroundShape } from '@/lib/GroundShapeContext';
import PlayerFormModal from '@/components/players/PlayerFormModal';
import { normPlayerName } from '@/lib/playerLookup';

const ROLES = [
  { key: 'all', label: 'All Roles' },
  { key: 'batsman', label: 'Batsman' },
  { key: 'bowler', label: 'Bowler' },
  { key: 'all_rounder', label: 'All-Rounder' },
  { key: 'wicket_keeper', label: 'Wicket Keeper' },
];

const ROLE_LABEL = { batsman: 'Batsman', bowler: 'Bowler', all_rounder: 'All-Rounder', wicket_keeper: 'Wicket Keeper' };

export default function Players() {
  const { mode } = useGroundShape();
  const queryClient = useQueryClient();
  const modeLabel = mode === 'circular' ? 'Standard' : 'TURF';
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const { data: allPlayers = [], isLoading } = useQuery({
    queryKey: ['all-players-analytics'],
    queryFn: () => base44.entities.Player.list(),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ['teams-analytics'],
    queryFn: () => base44.entities.Team.list(),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ['matches-analytics', mode],
    queryFn: () => base44.entities.Match.list('-created_date', 500),
  });
  const { data: batterInnings = [] } = useQuery({
    queryKey: ['all-batter-innings-lb'],
    queryFn: () => base44.entities.BatterInnings.list(),
  });
  const { data: bowlerInnings = [] } = useQuery({
    queryKey: ['all-bowler-innings-lb'],
    queryFn: () => base44.entities.BowlerInnings.list(),
  });

  const modeMatchIds = useMemo(
    () => new Set(matches.filter(m => (m.ground_mode || 'turf') === mode).map(m => m.id)),
    [matches, mode]
  );
  const modeTeams = useMemo(
    () => teams.filter(t => (t.ground_mode || 'turf') === mode && !t.tournament_id),
    [teams, mode]
  );
  // Tournament and auction squads are real player profiles too — list them here.
  const modePlayers = useMemo(
    () => allPlayers.filter(p => (p.ground_mode || 'turf') === mode),
    [allPlayers, mode]
  );
  const teamsMap = useMemo(() => teams.reduce((a, t) => ({ ...a, [t.id]: t }), {}), [teams]);

  // Quick career chips per player (mode-scoped)
  const statsByPlayer = useMemo(() => {
    const m = {};
    const ensure = (pid) => (m[pid] = m[pid] || { runs: 0, wickets: 0 });
    batterInnings.filter(b => modeMatchIds.has(b.match_id)).forEach(b => { ensure(b.player_id).runs += b.runs || 0; });
    bowlerInnings.filter(b => modeMatchIds.has(b.match_id)).forEach(b => { ensure(b.player_id).wickets += b.wickets || 0; });
    return m;
  }, [batterInnings, bowlerInnings, modeMatchIds]);

  // A player in a tournament squad has its own record per squad, so the same
  // person can exist several times in the table. The directory lists people,
  // not records: one card per name, with every record's stats added up.
  const people = useMemo(() => {
    const groups = new Map();
    modePlayers.forEach(p => {
      const key = normPlayerName(p.name) || p.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });
    return [...groups.values()].map(group => {
      const rep =
        group.find(p => p.team_id && teamsMap[p.team_id]) ||
        group.find(p => p.team_id) ||
        group[0];
      const ids = group.map(p => p.id);
      const stats = ids.reduce(
        (a, id) => {
          const s = statsByPlayer[id];
          if (s) {
            a.runs += s.runs;
            a.wickets += s.wickets;
          }
          return a;
        },
        { runs: 0, wickets: 0 }
      );
      return {
        key: normPlayerName(rep.name) || rep.id,
        rep,
        ids,
        stats,
        name: rep.name,
        team_id: rep.team_id,
        role: rep.role,
        photo_url: group.find(p => p.photo_url)?.photo_url || '',
      };
    });
  }, [modePlayers, teamsMap, statsByPlayer]);

  const handleDeletePlayer = async (person) => {
    if (!window.confirm(`Delete ${person.name}? Their past scorecards stay as they are.`)) return;
    await base44.entities.Player.deleteMany({ id: { $in: person.ids } });
    queryClient.invalidateQueries({ queryKey: ['all-players-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['free-players'] });
  };

  const filtered = people.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (teamFilter !== 'all' && p.team_id !== teamFilter) return false;
    if (roleFilter !== 'all' && p.role !== roleFilter) return false;
    return true;
  });

  return (
    <div className="pb-24 md:pb-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white mb-1">Players</h1>
          <p className="text-slate-400 text-sm">Search any {modeLabel} player and open their full profile with stats & insights</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Link
            to={createPageUrl('PlayerComparison')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-700 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span className="hidden sm:inline">Compare</span>
          </Link>
          <button
            onClick={() => {
              setEditingPlayer(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add player</span>
          </button>
        </div>
      </div>

      {/* Search & filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player by name…"
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-44 bg-slate-800/60 border-slate-700 text-white text-xs h-9">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 max-h-60">
              <SelectItem value="all" className="text-white">All Teams</SelectItem>
              {modeTeams.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5 flex-wrap">
            {ROLES.map(r => (
              <button
                key={r.key}
                onClick={() => setRoleFilter(r.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  roleFilter === r.key
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Directory */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No players found</h3>
          <p className="text-slate-400 text-sm">
            {modePlayers.length === 0
              ? `No ${modeLabel} players yet — tap Add player to register one`
              : 'Try a different search or filter'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => {
            const team = teamsMap[p.team_id];
            const stats = p.stats;
            const initials = (p.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
            return (
              <Link
                key={p.key}
                to={createPageUrl('PlayerProfile') + `?playerId=${p.rep.id}`}
                className="group p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-all flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0 overflow-hidden">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {team?.name || 'No team'}
                    {p.role && <span className="text-slate-600"> • {ROLE_LABEL[p.role] || p.role}</span>}
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">{stats.runs} runs</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-semibold">{stats.wickets} wkts</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingPlayer(p.rep);
                    setFormOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-slate-700/50 transition-colors flex-shrink-0"
                  title="Edit player details or photo"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeletePlayer(p);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                  title="Delete player"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
      <PlayerFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        player={editingPlayer}
        teams={modeTeams}
        mode={mode}
      />
    </div>
  );
}