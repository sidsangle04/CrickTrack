import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  PlusCircle, 
  Calendar, 
  MapPin, 
  Play, 
  Eye, 
  ChevronRight,
  Trophy,
  Clock,
  CheckCircle2,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export default function Home() {
  const [filter, setFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const handleDelete = async (matchId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmDeleteId !== matchId) {
      setConfirmDeleteId(matchId);
      return;
    }
    setDeletingId(matchId);
    setConfirmDeleteId(null);
    await base44.entities.Match.delete(matchId);
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    setDeletingId(null);
  };
  
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.list('-created_date', 50)
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});

  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'live') return m.status === 'live' || m.status === 'super_over';
    if (filter === 'completed') return m.status === 'completed';
    if (filter === 'upcoming') return m.status === 'setup';
    return true;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'live':
      case 'super_over':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            LIVE
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'innings_break':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Innings Break
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-medium">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Matches</h1>
        <p className="text-slate-400 text-sm">Manage and score your club cricket matches</p>
      </div>



      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Link 
          to={createPageUrl('MatchSetup')}
          className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group"
        >
          <PlusCircle className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">New Match</h3>
          <p className="text-sm text-slate-400">Start scoring a new game</p>
        </Link>
        <Link 
          to={createPageUrl('TeamManagement')}
          className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 hover:border-purple-500/50 transition-all group"
        >
          <Trophy className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Teams</h3>
          <p className="text-sm text-slate-400">Manage squads & players</p>
        </Link>
        <Link 
          to={createPageUrl('Tournaments')}
          className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 hover:border-amber-500/50 transition-all group"
        >
          <Trophy className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-white">Tournaments</h3>
          <p className="text-sm text-slate-400">Knockout brackets & cup</p>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'live', 'upcoming', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === f
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Match List */}
      {matchesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No matches found</h3>
          <p className="text-slate-400 text-sm mb-4">
            {filter === 'all' ? "Create your first match to get started" : `No ${filter} matches`}
          </p>
          {filter === 'all' && (
            <Link 
              to={createPageUrl('MatchSetup')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium"
            >
              <PlusCircle className="w-4 h-4" />
              Create Match
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map(match => {
            const team1 = teamsMap[match.team1_id];
            const team2 = teamsMap[match.team2_id];
            
            return (
              <Link
                key={match.id}
                to={match.status === 'setup' 
                  ? createPageUrl('MatchSetup') + `?matchId=${match.id}`
                  : match.status === 'completed'
                  ? createPageUrl('Scorecard') + `?matchId=${match.id}`
                  : createPageUrl('LiveScoring') + `?matchId=${match.id}`
                }
                className="block p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {match.date ? format(new Date(match.date), 'MMM d, yyyy') : 'TBD'}
                    <span className="text-slate-600">•</span>
                    <MapPin className="w-3.5 h-3.5" />
                    {match.venue || 'TBD'}
                  </div>
                  {getStatusBadge(match.status)}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: team1?.primary_color || '#374151' }}
                      >
                        {team1?.short_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-semibold text-white">{team1?.name || 'Team 1'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: team2?.primary_color || '#374151' }}
                      >
                        {team2?.short_name?.charAt(0) || '?'}
                      </div>
                      <span className="font-semibold text-white">{team2?.name || 'Team 2'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {(match.status === 'live' || match.status === 'super_over' || match.status === 'innings_break') && (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-medium flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5" />
                        Score
                      </span>
                    )}
                    {match.status === 'setup' && (
                      <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium">
                        Setup
                      </span>
                    )}
                    {match.status === 'completed' && (
                      <span className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm font-medium flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                    <button
                      onClick={(e) => handleDelete(match.id, e)}
                      className={`p-1.5 rounded-lg transition-all ${
                        confirmDeleteId === match.id
                          ? 'bg-red-500 text-white'
                          : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10'
                      }`}
                      title={confirmDeleteId === match.id ? 'Click again to confirm' : 'Delete match'}
                    >
                      {deletingId === match.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : confirmDeleteId === match.id ? (
                        <Trash2 className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                    {confirmDeleteId === match.id && (
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(null); }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {match.result && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <p className="text-sm text-emerald-400">{match.result}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}