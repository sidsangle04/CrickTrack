import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PlusCircle, Trophy, MapPin, Calendar, Play, Eye, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import DemoShell from '@/components/demo/DemoShell';
import DemoLockedAction from '@/components/demo/DemoLockedAction';
import { signIn } from '@/lib/signIn';
import { DEMO_MATCHES, DEMO_TEAMS_MAP, DEMO_VENUES, demoScoreLine } from '@/lib/demoData';

function StatusBadge({ status }) {
  if (status === 'live') {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-medium">
      <Clock className="w-3 h-3" />
      Upcoming
    </span>
  );
}

function TeamLine({ team, score, live }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ backgroundColor: team?.primary_color || '#374151' }}
      >
        {team?.short_name?.charAt(0) || '?'}
      </div>
      <span className="font-semibold text-white flex-1 truncate">{team?.name || 'Team'}</span>
      {score && <span className={`text-sm font-bold ${live ? 'text-red-400' : 'text-slate-200'}`}>{score}</span>}
    </div>
  );
}

export default function DemoMatches() {
  const [filter, setFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');

  const matches = DEMO_MATCHES.filter((m) => {
    if (venueFilter !== 'all' && m.venue !== venueFilter) return false;
    if (filter === 'live') return m.status === 'live';
    if (filter === 'completed') return m.status === 'completed';
    if (filter === 'upcoming') return m.status === 'setup';
    return true;
  });

  return (
    <DemoShell
      title="Matches"
      subtitle="Score club cricket ball by ball and keep every result in one place"
    >
      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <button
          type="button"
          onClick={signIn}
          className="text-left p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group"
        >
          <PlusCircle className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">New Match</h3>
          <p className="text-sm text-slate-400">Start scoring a new game</p>
        </button>
        <button
          type="button"
          onClick={signIn}
          className="text-left p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
        >
          <Trophy className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Teams</h3>
          <p className="text-sm text-slate-400">Manage squads &amp; players</p>
        </button>
        <Link
          to="/Venues"
          className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/30 hover:border-sky-500/50 transition-all group"
        >
          <MapPin className="w-8 h-8 text-sky-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Venues</h3>
          <p className="text-sm text-slate-400">Grounds &amp; par scores</p>
        </Link>
      </div>

      {/* Venue filter */}
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
        <Select value={venueFilter} onValueChange={setVenueFilter}>
          <SelectTrigger className="w-full sm:w-72 bg-slate-800 border-slate-700 text-slate-200">
            <SelectValue placeholder="All venues" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All venues</SelectItem>
            {DEMO_VENUES.map((v) => (
              <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'live', 'upcoming', 'completed'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === f ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="space-y-3">
        {matches.map((match) => {
          const team1 = DEMO_TEAMS_MAP[match.team1_id];
          const team2 = DEMO_TEAMS_MAP[match.team2_id];
          const isLive = match.status === 'live';
          return (
            <div
              key={match.id}
              className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-400 min-w-0">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  {format(new Date(match.date), 'MMM d, yyyy')}
                  <span className="text-slate-600">•</span>
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{match.venue}</span>
                </div>
                <StatusBadge status={match.status} />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2 min-w-0">
                  <TeamLine team={team1} score={demoScoreLine(match, match.team1_id)} live={isLive} />
                  <TeamLine team={team2} score={demoScoreLine(match, match.team2_id)} live={isLive} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isLive && <DemoLockedAction label="Score" className="!px-3 !py-2" />}
                  {match.status === 'completed' && (
                    <DemoLockedAction label="View" variant="ghost" className="!px-3 !py-2" />
                  )}
                  {match.status === 'setup' && (
                    <DemoLockedAction label="Set up" variant="ghost" className="!px-3 !py-2" />
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </div>

              {match.result && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <p className="text-sm text-emerald-400">{match.result}</p>
                </div>
              )}
            </div>
          );
        })}

        {matches.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No {filter} matches in this demo</h3>
            <p className="text-slate-400 text-sm">Try another filter, or log in to create your own.</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Play className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm text-slate-300">
            Live scoring records every ball — runs, extras, wickets, shot direction and pitch map.
          </p>
        </div>
        <DemoLockedAction label="Score your own match" />
      </div>

      <p className="mt-4 text-xs text-slate-500 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5" />
        Example data — nothing here is saved.
      </p>
    </DemoShell>
  );
}