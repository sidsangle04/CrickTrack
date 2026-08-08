import React from 'react';
import { Play, Eye, CheckCircle2 } from 'lucide-react';

function TeamChip({ team, teamId, isWinner }) {
  const name = team?.name || (teamId ? 'Team' : 'TBD');
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg flex-1 min-w-0 ${
        isWinner
          ? 'bg-emerald-500/20 text-emerald-300'
          : teamId
          ? 'bg-slate-800 text-slate-200'
          : 'bg-slate-800/40 text-slate-500'
      }`}
    >
      <span
        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: team?.primary_color || '#374151' }}
      >
        {team?.short_name?.charAt(0) || '?'}
      </span>
      <span className="text-sm font-medium truncate">{name}</span>
      {isWinner && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-auto" />}
    </div>
  );
}

export default function LeagueView({
  leagueMatches,
  standings,
  teamsMap,
  matchesMap,
  leagueComplete,
  knockoutTeams,
  onSetWinner,
  onStartGame,
  onOpenMatch
}) {
  const teamsMapResolved = teamsMap || {};
  const k = knockoutTeams || 4;

  const byRound = {};
  leagueMatches.forEach((m) => {
    (byRound[m.round] = byRound[m.round] || []).push(m);
  });
  const rounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);

  const resultOf = (m) => {
    if (m.winner_team_id) return m.winner_team_id;
    const linked = m.match_id ? matchesMap[m.match_id] : null;
    if (linked && linked.status === 'completed') return linked.winner_id || 'tie';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Standings */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">League Standings</h2>
          {!leagueComplete && <span className="text-xs text-slate-500">In progress</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 text-xs border-b border-slate-700/50">
                <th className="text-left px-4 py-2 font-medium">#</th>
                <th className="text-left px-4 py-2 font-medium">Team</th>
                <th className="text-center px-2 py-2 font-medium">P</th>
                <th className="text-center px-2 py-2 font-medium">W</th>
                <th className="text-center px-2 py-2 font-medium">L</th>
                <th className="text-center px-2 py-2 font-medium">NR</th>
                <th className="text-center px-4 py-2 font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-slate-500 py-6">No fixtures yet</td>
                </tr>
              ) : (
                standings.map((s, i) => {
                  const team = teamsMapResolved[s.id];
                  const qualifies = i < k;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-slate-700/30 ${qualifies ? 'bg-emerald-500/5' : ''}`}
                    >
                      <td className="px-4 py-2.5 text-slate-400">{i + 1}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: team?.primary_color || '#374151' }}
                          >
                            {team?.short_name?.charAt(0) || '?'}
                          </span>
                          <span className="text-white font-medium">{team?.name || 'Team'}</span>
                          {qualifies && <span className="text-[10px] text-emerald-400 ml-1">Q</span>}
                        </div>
                      </td>
                      <td className="text-center px-2 py-2.5 text-slate-300">{s.p}</td>
                      <td className="text-center px-2 py-2.5 text-emerald-400">{s.w}</td>
                      <td className="text-center px-2 py-2.5 text-slate-300">{s.l}</td>
                      <td className="text-center px-2 py-2.5 text-slate-300">{s.nr}</td>
                      <td className="text-center px-4 py-2.5 text-white font-bold">{s.pts}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 text-[11px] text-slate-500 border-t border-slate-700/50">
          Top {k} qualify for the knockout · Win = 2 pts · Tie/No-result = 1 pt each
        </div>
      </div>

      {/* Fixtures */}
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-4">Fixtures</h2>
        <div className="space-y-5">
          {rounds.map((r) => (
            <div key={r}>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Round {r}
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {byRound[r]
                  .sort((a, b) => a.match_index - b.match_index)
                  .map((m) => {
                    const t1 = teamsMapResolved[m.team1_id];
                    const t2 = teamsMapResolved[m.team2_id];
                    const res = resultOf(m);
                    const linked = m.match_id ? matchesMap[m.match_id] : null;
                    const hasGame = !!linked;
                    const gameStatus = linked?.status;
                    const decided = !!res;
                    return (
                      <div
                        key={m.id}
                        className="rounded-xl bg-slate-900/60 border border-slate-700/40 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <TeamChip team={t1} teamId={m.team1_id} isWinner={decided && res === m.team1_id} />
                          <span className="text-[10px] text-slate-600">vs</span>
                          <TeamChip team={t2} teamId={m.team2_id} isWinner={decided && res === m.team2_id} />
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-700/40">
                          {decided ? (
                            hasGame ? (
                              <button
                                onClick={() => onOpenMatch(m.match_id, gameStatus)}
                                className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Match
                              </button>
                            ) : res === 'tie' ? (
                              <div className="text-center text-xs text-slate-500">Tie / No result</div>
                            ) : (
                              <div className="text-center text-xs text-emerald-400/80">Result recorded</div>
                            )
                          ) : m.team1_id && m.team2_id ? (
                            hasGame ? (
                              <button
                                onClick={() => onOpenMatch(m.match_id, gameStatus)}
                                className="w-full flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                              >
                                {gameStatus === 'live' ? (
                                  <><Play className="w-3.5 h-3.5" /> Score</>
                                ) : (
                                  <><Eye className="w-3.5 h-3.5" /> Resume</>
                                )}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => onStartGame(m.id, m.team1_id, m.team2_id)}
                                  className="w-full flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                                >
                                  <Play className="w-3.5 h-3.5" /> Start
                                </button>
                                <div className="flex gap-1.5 mt-1.5">
                                  <button
                                    onClick={() => onSetWinner(m.id, m.team1_id)}
                                    className="flex-1 text-[10px] py-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                  >
                                    Win {t1?.short_name || 'T1'}
                                  </button>
                                  <button
                                    onClick={() => onSetWinner(m.id, m.team2_id)}
                                    className="flex-1 text-[10px] py-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                                  >
                                    Win {t2?.short_name || 'T2'}
                                  </button>
                                </div>
                              </>
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
          ))}
        </div>
      </div>
    </div>
  );
}