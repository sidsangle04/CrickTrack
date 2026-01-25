import React from 'react';
import { Circle } from 'lucide-react';

export default function BatterCard({ batter, isStriker, playerName }) {
  const sr = batter?.balls_faced > 0 
    ? ((batter.runs / batter.balls_faced) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className={`flex-1 p-3 rounded-xl ${isStriker ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50'}`}>
      <div className="flex items-center gap-2 mb-2">
        {isStriker && (
          <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
        )}
        <span className={`text-sm font-medium truncate ${isStriker ? 'text-emerald-400' : 'text-slate-400'}`}>
          {playerName || 'No batter'}
        </span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${isStriker ? 'text-white' : 'text-slate-300'}`}>
          {batter?.runs || 0}
        </span>
        <span className="text-slate-500 text-sm">({batter?.balls_faced || 0})</span>
      </div>
      
      <div className="flex gap-3 mt-1 text-xs text-slate-500">
        <span>{batter?.fours || 0}×4</span>
        <span>{batter?.sixes || 0}×6</span>
        <span>SR {sr}</span>
      </div>
    </div>
  );
}