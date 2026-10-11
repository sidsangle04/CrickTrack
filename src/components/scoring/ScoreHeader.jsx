import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { isTestMatch, getLeadTrailBanner, oversRemaining } from '../../lib/testCricket';

export default function ScoreHeader({ 
  match, 
  innings, 
  allInnings,
  team1Name, 
  team2Name,
  onMenuOpen 
}) {
  const battingTeamName = innings?.batting_team_id === match?.team1_id ? team1Name : team2Name;
  const overs = innings ? `${innings.current_over_number}.${innings.current_ball_in_over}` : '0.0';
  const isTest = isTestMatch(match);
  const maxOvers = innings?.is_super_over ? 1 : (isTest ? Infinity : (match?.overs_per_innings || 20));
  const banner = getLeadTrailBanner(match, allInnings || [], innings, team1Name, team2Name);
  const oversLeft = isTest && match?.is_over_limited ? oversRemaining(match, allInnings || []) : null;

  // Run rates. CRR once a ball has been bowled; RRR throughout a chase, from
  // the first ball, so the scorer always sees the pace being asked for.
  const ballsBowled = (innings?.current_over_number || 0) * 6 + (innings?.current_ball_in_over || 0);
  const runsSoFar = innings?.total_runs || 0;
  const runsNeeded = (innings?.target || 0) - runsSoFar;
  const oversLeftForRrr = Number.isFinite(maxOvers) ? maxOvers - ballsBowled / 6 : 0;
  const isChase = !isTest && runsNeeded > 0 && oversLeftForRrr > 0;
  const crr = ballsBowled > 0 ? runsSoFar / (ballsBowled / 6) : 0;
  const rrr = oversLeftForRrr > 0 ? runsNeeded / oversLeftForRrr : 0;
  
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
            {Number.isFinite(maxOvers) ? <span className="text-slate-500"> / {maxOvers} ov</span> : <span className="text-slate-500"> ov</span>}
            {oversLeft !== null && oversLeft !== Infinity && <span className="text-slate-500"> · {oversLeft} ov left</span>}
          </span>
          
          {innings?.target && !isTest && (
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
        
        {/* Run rates — CRR and RRR shown together through a chase */}
        {innings && (isChase || ballsBowled > 0) && (
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-slate-800/70">
              <span className="text-[10px] uppercase tracking-wider text-slate-500">CRR</span>
              <span className="ml-1.5 text-sm font-semibold text-white">{crr.toFixed(2)}</span>
            </div>
            {isChase && (
              <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] uppercase tracking-wider text-amber-500/80">RRR</span>
                <span className="ml-1.5 text-sm font-semibold text-amber-400">{rrr.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Test cricket live lead / trail / target banner */}
        {banner && (
          <div className="mt-3 py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
            {banner}
          </div>
        )}
      </div>
    </div>
  );
}