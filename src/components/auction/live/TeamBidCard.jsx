import React from 'react';
import { Lock, Zap } from 'lucide-react';
import { TeamBadge, contrastText } from '../Shared';

export default function TeamBidCard({
  team,
  finance,
  nextAmount,
  isHighest,
  blocked,
  onBid,
  onJump
}) {
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

      <div className="mt-2 flex gap-1.5">
        <button
          onClick={() => onBid(team.id)}
          disabled={!!blocked}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
        <button
          onClick={() => onJump && onJump(team.id)}
          disabled={!!blocked}
          className="px-2.5 rounded-lg border border-slate-700 bg-slate-950 text-amber-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          title={blocked || 'Jump bid — name your own amount'}
        >
          <Zap className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}