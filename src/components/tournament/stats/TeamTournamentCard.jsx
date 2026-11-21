import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight } from 'lucide-react';

const nrr = (v) =>
  v === null || v === undefined ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(3)}`;

export default function TeamTournamentCard({ teamId, stats, tournamentName, onClose, onOpenMatch }) {
  const team = stats.teams.find((t) => t.team_id === teamId);
  const matches = stats.linked
    .filter((m) => m.team1_id === teamId || m.team2_id === teamId)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const scoreFor = (matchId, sideTeamId) => {
    const inn = stats.innings.find(
      (i) => i.match_id === matchId && i.batting_team_id === sideTeamId
    );
    if (!inn) return '—';
    return `${inn.total_runs || 0}/${inn.total_wickets || 0} (${Math.floor((inn.total_balls || 0) / 6)}.${(inn.total_balls || 0) % 6})`;
  };

  const squad = stats.batting
    .filter((r) => r.team_id === teamId)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 4);
  const bowlers = stats.bowling
    .filter((r) => r.team_id === teamId)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 4);

  return (
    <Dialog open={!!teamId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-200">
        <DialogTitle className="sr-only">{team?.name || 'Team'} tournament performance</DialogTitle>

        <div className="flex items-center gap-3 mb-4">
          <span
            className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0"
            style={{ backgroundColor: team?.color }}
          >
            {team?.logo_url ? (
              <img src={team.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (team?.short_name || team?.name || '?').charAt(0)
            )}
          </span>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
              {tournamentName}
            </div>
            <h2 className="text-lg font-bold text-white truncate">{team?.name || 'Team'}</h2>
            <p className="text-xs text-slate-400">
              {team ? `${team.won}W · ${team.lost}L · ${team.tied}T · ${team.no_result}NR` : ''}
            </p>
          </div>
        </div>

        {team && (
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {[
              ['Played', team.played],
              ['Points', team.points],
              ['NRR', nrr(team.nrr)],
              ['Runs for', team.runs_for],
              ['Runs against', team.runs_against],
              ['Average', team.average_score ?? '—'],
              ['Highest', team.highest ?? '—'],
              ['Lowest', team.lowest ?? '—'],
              ['Wkts taken', team.wickets_taken],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-800/70 px-2 py-1.5">
                <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
                <div className="text-sm font-bold text-white tabular-nums truncate">{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-slate-700/50 overflow-hidden mb-3">
          <div className="px-3 py-2 border-b border-slate-700/50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Match history
          </div>
          {matches.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">No matches played yet</div>
          ) : (
            <div className="divide-y divide-slate-700/30">
              {matches.map((m) => {
                const oppId = m.team1_id === teamId ? m.team2_id : m.team1_id;
                const opp = stats.teamsById[oppId];
                const won = m.winner_id === teamId;
                const lost = m.winner_id && m.winner_id !== teamId;
                return (
                  <button
                    key={m.id}
                    onClick={() => onOpenMatch(m.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/60"
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        won
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : lost
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {won ? 'W' : lost ? 'L' : m.status === 'completed' ? 'T' : '·'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-white truncate">
                        vs {opp?.short_name || opp?.name || 'Opponent'}
                      </span>
                      <span className="block text-[10px] text-slate-500 truncate">
                        {scoreFor(m.id, teamId)} · {m.date || 'No date'}
                        {m.status !== 'completed' && (
                          <span className="ml-1 text-amber-400 uppercase">{m.status.replace('_', ' ')}</span>
                        )}
                      </span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 mb-2">
              Top run scorers
            </div>
            {squad.length === 0 ? (
              <p className="text-xs text-slate-500">—</p>
            ) : (
              squad.map((p) => (
                <div key={p.player_id} className="flex items-center justify-between gap-2 text-[11px] py-0.5">
                  <span className="text-slate-300 truncate">{p.name}</span>
                  <span className="text-white tabular-nums font-medium">{p.runs}</span>
                </div>
              ))
            )}
          </div>
          <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-400 mb-2">
              Top wicket takers
            </div>
            {bowlers.length === 0 ? (
              <p className="text-xs text-slate-500">—</p>
            ) : (
              bowlers.map((p) => (
                <div key={p.player_id} className="flex items-center justify-between gap-2 text-[11px] py-0.5">
                  <span className="text-slate-300 truncate">{p.name}</span>
                  <span className="text-white tabular-nums font-medium">{p.wickets}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}