import React from 'react';
import { Play, Eye, CheckCircle2, Crown } from 'lucide-react';

function TeamRow({ teamId, isWinner, onPick }) {
  const team = teamId || null;
  const name = team ? team.name || 'Team' : 'TBD';
  return (
    <button
      onClick={onPick}
      disabled={!teamId}
      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
        isWinner
          ? 'bg-emerald-500/20 text-emerald-300'
          : teamId
          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
      }`}
    >
      <span
        className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: team?.primary_color || '#374151' }}
      >
        {team?.short_name?.charAt(0) || '?'}
      </span>
      <span className="text-sm font-medium flex-1 truncate">{name}</span>
      {isWinner && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
    </button>
  );
}

export default function BracketView({
  derived,
  teamsMap,
  matchesMap,
  onSetWinner,
  onStartGame,
  onOpenMatch
}) {
  const { state, totalRounds } = derived;
  const teamsMapResolved = teamsMap || {};

  const rounds = [];
  for (let r = 1; r <= totalRounds; r++) {
    const count = Object.keys(state[r] || {}).length;
    const arr = [];
    for (let i = 0; i < count; i++) arr.push(state[r][i]);
    rounds.push({ round: r, label: arr[0]?.stage_label || `Round ${r}`, matches: arr });
  }

  return (
    <div className="overflow-x-auto pb-4 -mx-2 px-2">
      <div className="flex gap-6 min-w-max">
        {rounds.map(({ round, label, matches }, rIdx) => {
          const isFinal = rIdx === rounds.length - 1;
          return (
            <div key={round} className="flex flex-col" style={{ minWidth: 210 }}>
              <div className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {label}
              </div>
              <div className="flex flex-col justify-around flex-1 gap-6">
                {matches.map((m, i) => {
                  const linked = m.match_id ? matchesMap[m.match_id] : null;
                  const hasGame = !!linked;
                  const gameStatus = linked?.status;
                  const ready = !!m.team1 && !!m.team2 && !m.winner;
                  const isChampion = isFinal && !!m.winner;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl p-3 border ${
                        isChampion
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-800/60 border-slate-700/50'
                      }`}
                    >
                      {isChampion && (
                        <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-semibold mb-2">
                          <Crown className="w-4 h-4" /> Champion
                        </div>
                      )}
                      <div className="space-y-2">
                        <TeamRow
                          teamId={teamsMapResolved[m.team1]}
                          isWinner={!!m.winner && m.winner === m.team1}
                          onPick={() => onSetWinner(m.id, m.team1)}
                        />
                        <div className="text-center text-[10px] text-slate-600">vs</div>
                        <TeamRow
                          teamId={teamsMapResolved[m.team2]}
                          isWinner={!!m.winner && m.winner === m.team2}
                          onPick={() => onSetWinner(m.id, m.team2)}
                        />
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-700/50">
                        {m.winner ? (
                          hasGame ? (
                            <button
                              onClick={() => onOpenMatch(m.match_id, gameStatus)}
                              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Match
                            </button>
                          ) : (
                            <div className="text-center text-xs text-emerald-400/80">
                              Winner advances
                            </div>
                          )
                        ) : ready ? (
                          hasGame ? (
                            <button
                              onClick={() => onOpenMatch(m.match_id, gameStatus)}
                              className="w-full flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                            >
                              {gameStatus === 'live' ? (
                                <>
                                  <Play className="w-3.5 h-3.5" /> Score
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" /> Resume
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => onStartGame(m.id, m.team1, m.team2)}
                              className="w-full flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                            >
                              <Play className="w-3.5 h-3.5" /> Start Game
                            </button>
                          )
                        ) : (
                          <div className="text-center text-xs text-slate-600">Awaiting teams</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}