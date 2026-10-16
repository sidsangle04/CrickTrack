import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DemoShell from '@/components/demo/DemoShell';
import DemoLockedAction from '@/components/demo/DemoLockedAction';
import { DEMO_PLAYERS, DEMO_TEAMS, DEMO_TEAMS_MAP } from '@/lib/demoData';

const ROLES = [
  { key: 'all', label: 'All Roles' },
  { key: 'batsman', label: 'Batsman' },
  { key: 'bowler', label: 'Bowler' },
  { key: 'all_rounder', label: 'All-Rounder' },
  { key: 'wicket_keeper', label: 'Wicket Keeper' },
];

const ROLE_LABEL = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  all_rounder: 'All-Rounder',
  wicket_keeper: 'Wicket Keeper',
};

export default function DemoPlayers() {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = useMemo(
    () =>
      DEMO_PLAYERS.filter((p) => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (teamFilter !== 'all' && p.team_id !== teamFilter) return false;
        if (roleFilter !== 'all' && p.role !== roleFilter) return false;
        return true;
      }),
    [search, teamFilter, roleFilter]
  );

  return (
    <DemoShell
      title="Players"
      subtitle="Search any player and open their full profile with stats and insights"
      action={
        <DemoLockedAction
          label="Compare"
          variant="ghost"
          className="!px-3 !py-2 shrink-0"
        />
      }
    >
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
              {DEMO_TEAMS.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5 flex-wrap">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
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
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No players found</h3>
          <p className="text-slate-400 text-sm">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const team = DEMO_TEAMS_MAP[p.team_id];
            const initials = (p.name || '?')
              .split(' ')
              .map((w) => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();
            return (
              <Link
                key={p.id}
                to={`/PlayerProfile?playerId=${p.id}`}
                className="group p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-all flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400 flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {team?.name || 'No team'}
                    <span className="text-slate-600"> • {ROLE_LABEL[p.role] || p.role}</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold">
                      {p.runs} runs
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-semibold">
                      {p.wickets} wkts
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ArrowLeftRight className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-slate-300">
            Compare any two players head to head, with a coach-style verdict on who wins the match-up.
          </p>
        </div>
        <DemoLockedAction label="Open comparison" />
      </div>
    </DemoShell>
  );
}