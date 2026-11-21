import React from 'react';
import { Lock } from 'lucide-react';
import { TeamBadge, contrastText } from '../Shared';

export default function TeamBidCard({ team, finance, nextAmount, isHighest, blocked, onBid }) {
  const color = team.color || '#10b981';
  return (
    <div
      className={`rounded-xl border bg-slate-900/60 p-2.5 transition-colors ${
        isHighest ? 'border-emerald-500/70' : 'border-slate-700/70'
      }`}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center gap-2">
        <TeamBadge team={team} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-white truncate">{team.name}</p>
          <p className="text-[10px] text-slate-400 tabular-nums">
            {finance.purseLeft} left · {finance.squad.length}/{finance.target} squad
          </p>
        </div>
        {isHighest && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
            Top
          </span>
        )}
      </div>

      <button
        onClick={() => onBid(team.id)}
        disabled={!!blocked}
        className="mt-2 w-full py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={
          blocked
            ? { backgroundColor: '#1e293b', color: '#94a3b8' }
            : { backgroundColor: color, color: contrastText(color) }
        }
        title={blocked || `Bid ${nextAmount}`}
      >
        {blocked ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium">
            <Lock className="w-3 h-3" /> {blocked}
          </span>
        ) : (
          <>Bid {nextAmount}</>
        )}
      </button>
    </div>
  );
}