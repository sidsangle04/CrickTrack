import React from 'react';

export default function BowlerCard({ bowler, playerName }) {
  const overs = bowler ? `${bowler.overs}.${bowler.balls % 6}` : '0.0';
  const economy = bowler && (bowler.overs > 0 || bowler.balls > 0)
    ? (bowler.runs_conceded / (bowler.overs + bowler.balls / 6)).toFixed(2)
    : '0.00';

  return (
    <div className="flex-1 p-3 rounded-xl bg-slate-800/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-slate-400 truncate">
          {playerName || 'No bowler'}
        </span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-slate-300">
          {bowler?.wickets || 0}-{bowler?.runs_conceded || 0}
        </span>
        <span className="text-slate-500 text-sm">({overs})</span>
      </div>
      
      <div className="flex gap-3 mt-1 text-xs text-slate-500">
        <span>Econ {economy}</span>
        <span>{bowler?.dots || 0} dots</span>
        <span>{bowler?.maidens || 0} mdn</span>
      </div>
    </div>
  );
}