import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function ScoreHeader({ 
  match, 
  innings, 
  team1Name, 
  team2Name,
  onMenuOpen 
}) {
  const battingTeamName = innings?.batting_team_id === match?.team1_id ? team1Name : team2Name;
  const overs = innings ? `${innings.current_over_number}.${innings.current_ball_in_over}` : '0.0';
  const maxOvers = innings?.is_super_over ? 1 : match?.overs_per_innings || 20;
  
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 pt-2 pb-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <Link 
          to={createPageUrl('Home')}
          className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="text-center">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            {innings?.is_super_over ? `Super Over ${innings.super_over_number || 1}` : `Innings ${innings?.innings_number || 1}`}
          </span>
        </div>
        
        <button 
          onClick={onMenuOpen}
          className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
      
      {/* Main Score Display */}
      <div className="text-center">
        <h2 className="text-slate-400 text-sm font-medium mb-1">{battingTeamName}</h2>
        
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-6xl font-black text-white tracking-tight">
            {innings?.total_runs || 0}
          </span>
          <span className="text-3xl font-bold text-slate-500">/</span>
          <span className="text-4xl font-bold text-slate-400">
            {innings?.total_wickets || 0}
          </span>
        </div>
        
        <div className="mt-2 flex items-center justify-center gap-4">
          <span className="text-slate-400">
            <span className="text-white font-semibold">{overs}</span>
            <span className="text-slate-500"> / {maxOvers} ov</span>
          </span>
          
          {innings?.target && (
            <>
              <span className="text-slate-600">•</span>
              {(innings?.total_runs || 0) >= innings.target ? (
                <span className="text-emerald-400 font-semibold">
                  Target achieved!
                </span>
              ) : (
                <span className="text-slate-400">
                  Need <span className="text-amber-400 font-semibold">{innings.target - (innings?.total_runs || 0)}</span>
                  <span className="text-slate-500"> from {(maxOvers * 6) - (innings?.current_over_number * 6 + innings?.current_ball_in_over)} balls</span>
                </span>
              )}
            </>
          )}
        </div>
        
        {/* Run Rate */}
        {innings && (innings.current_over_number > 0 || innings.current_ball_in_over > 0) && (
          <div className="mt-2 flex items-center justify-center gap-4 text-sm">
            <span className="text-slate-500">
              CRR: <span className="text-white font-medium">
                {((innings.total_runs || 0) / ((innings.current_over_number || 0) + (innings.current_ball_in_over || 0) / 6) || 0).toFixed(2)}
              </span>
            </span>
            {innings?.target && innings.current_over_number < maxOvers && (
              <span className="text-slate-500">
                RRR: <span className="text-amber-400 font-medium">
                  {(((innings.target - innings.total_runs) / (maxOvers - innings.current_over_number - innings.current_ball_in_over / 6)) || 0).toFixed(2)}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}