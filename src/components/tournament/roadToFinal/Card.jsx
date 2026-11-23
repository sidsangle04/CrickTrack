import React from 'react';
import { Crown, Eye, Play } from 'lucide-react';

// Chamfered frame — an outer clipped layer acts as the 1px border.
export const CHAMFER =
  'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)';
export const HATCH = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(148,163,184,0.65) 0 1px, transparent 1px 3px)',
};

const TONES = {
  emerald: 'rgba(16,185,129,0.55)',
  amber: 'rgba(245,158,11,0.65)',
  slate: 'rgba(148,163,184,0.4)',
};

export function Frame({ children, tone = 'emerald', className = '', style }) {
  return (
    <div
      className={`p-px ${className}`}
      style={{ clipPath: CHAMFER, backgroundColor: TONES[tone] || TONES.emerald, ...style }}
    >
      <div className="h-full" style={{ clipPath: CHAMFER, backgroundColor: '#0f172a' }}>
        {children}
      </div>
    </div>
  );
}

export function TeamLine({ teamId, winner, crown, teamsMap, onPick }) {
  const team = teamId ? teamsMap[teamId] : null;
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!onPick}
      title={onPick ? 'Set as winner' : undefined}
      className={`w-full text-left flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
        winner ? 'bg-emerald-500/15' : onPick ? 'hover:bg-slate-700/50' : ''
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: team?.primary_color || 'rgba(148,163,184,0.5)' }}
      />
      <span
        className={`text-[11px] leading-tight truncate ${
          winner ? 'text-emerald-300 font-semibold' : team ? 'text-white' : 'text-slate-500'
        }`}
      >
        {team ? team.name || team.short_name : 'To be decided'}
      </span>
      {crown && winner && <Crown className="w-3 h-3 text-amber-400 ml-auto shrink-0" />}
    </button>
  );
}

export function SeedBoxBody({ place, teamId, teamsMap }) {
  const team = teamId ? teamsMap[teamId] : null;
  return (
    <div className="h-full px-2 flex items-center gap-2">
      <span className="text-[9px] font-bold tracking-wider text-emerald-400/80 uppercase shrink-0">
        {place}
      </span>
      <span
        className={`text-[11px] truncate ml-auto ${team ? 'text-white' : 'text-slate-500'}`}
        title={team ? team.name : undefined}
      >
        {team ? team.name || team.short_name : 'TBD'}
      </span>
    </div>
  );
}

export function MatchCardBody({
  stage,
  row = {},
  teamsMap = {},
  matchesMap = {},
  crown,
  onSetWinner,
  onStartGame,
  onOpenMatch,
}) {
  const team1 = row.team1 || '';
  const team2 = row.team2 || '';
  const winner = row.winner || '';
  const linked = row.match_id ? matchesMap[row.match_id] : null;
  const ready = !!team1 && !!team2 && !winner;

  let action;
  if (winner) {
    action =
      linked && onOpenMatch ? (
        <button
          type="button"
          onClick={() => onOpenMatch(row.match_id, linked.status)}
          className="w-full flex items-center justify-center gap-1 text-[10px] text-slate-300 hover:text-white"
        >
          <Eye className="w-3 h-3" /> View match
        </button>
      ) : (
        <div className="text-center text-[10px] text-emerald-400">Winner advances</div>
      );
  } else if (ready) {
    if (linked) {
      action = onOpenMatch ? (
        <button
          type="button"
          onClick={() => onOpenMatch(row.match_id, linked.status)}
          className="w-full flex items-center justify-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {linked.status === 'live' ? (
            <>
              <Play className="w-3 h-3" /> Score
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" /> Resume
            </>
          )}
        </button>
      ) : (
        <div className="text-center text-[10px] text-slate-400">In progress</div>
      );
    } else {
      action = onStartGame ? (
        <button
          type="button"
          onClick={() => onStartGame(row.id, team1, team2)}
          className="w-full flex items-center justify-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <Play className="w-3 h-3" /> Start game
        </button>
      ) : (
        <div className="text-center text-[10px] text-slate-400">Ready to play</div>
      );
    }
  } else {
    action = <div className="text-center text-[10px] text-slate-500">Awaiting teams</div>;
  }

  return (
    <div className="h-full flex flex-col px-2.5 py-1.5">
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <span className="text-[9px] font-bold tracking-[0.14em] text-emerald-400 uppercase">
          {stage.label}
        </span>
        <span className="w-5 h-1.5 shrink-0 mt-1" style={HATCH} />
      </div>
      <TeamLine
        teamId={team1}
        winner={winner && winner === team1}
        crown={crown}
        teamsMap={teamsMap}
        onPick={ready && onSetWinner ? () => onSetWinner(row.id, team1) : undefined}
      />
      <TeamLine
        teamId={team2}
        winner={winner && winner === team2}
        crown={crown}
        teamsMap={teamsMap}
        onPick={ready && onSetWinner ? () => onSetWinner(row.id, team2) : undefined}
      />
      <div className="mt-auto pt-1 border-t border-slate-700/60">{action}</div>
    </div>
  );
}