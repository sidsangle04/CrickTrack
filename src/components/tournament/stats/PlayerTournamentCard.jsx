import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Download, Loader2, TrendingUp } from 'lucide-react';
import { PlayerFormChart, PlayerWicketsChart } from './StatsCharts';
import { downloadNodeAsPng } from '@/lib/shareGraphic';

const Line = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2 text-[11px]">
    <span className="text-slate-500">{label}</span>
    <span className="text-slate-200 tabular-nums font-medium">{value}</span>
  </div>
);

const Block = ({ title, children }) => (
  <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
    <div className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 mb-2">{title}</div>
    <div className="space-y-1">{children}</div>
  </div>
);

const formTone = (runs) => {
  if (runs === null || runs === undefined) return 'bg-slate-700 text-slate-300';
  if (runs >= 50) return 'bg-emerald-500 text-slate-900';
  if (runs >= 30) return 'bg-emerald-500/40 text-emerald-200';
  if (runs >= 10) return 'bg-slate-600 text-slate-200';
  return 'bg-slate-800 text-slate-400';
};

export default function PlayerTournamentCard({ playerId, stats, tournamentName, onClose, onOpenMatch }) {
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const player = stats.playersById[playerId];
  const bat = stats.batting.find((r) => r.player_id === playerId);
  const bowl = stats.bowling.find((r) => r.player_id === playerId);
  const field = stats.fielding.find((r) => r.player_id === playerId);
  const log = stats.playerLog[playerId] || [];
  const team = stats.teamsById[player?.team_id];

  const inningsLog = log.filter((e) => e.runs !== null);
  const recent = inningsLog.slice(-5).reverse();
  const chartData = log.map((e) => ({
    label: e.label.slice(0, 6),
    runs: e.runs ?? 0,
    wickets: e.wickets ?? 0,
  }));
  const bowlingData = log.filter((e) => e.wickets !== null).map((e) => ({
    label: e.label.slice(0, 6),
    wickets: e.wickets,
  }));

  const save = async () => {
    setBusy(true);
    try {
      await downloadNodeAsPng(cardRef.current, `${player?.name || 'player'}-${tournamentName}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!playerId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-200 p-0">
        <DialogTitle className="sr-only">{player?.name || 'Player'} tournament performance</DialogTitle>

        <div ref={cardRef} className="p-5 bg-slate-900">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
                {tournamentName}
              </div>
              <h2 className="text-xl font-bold text-white truncate">{player?.name || 'Player'}</h2>
              <p className="text-xs text-slate-400">{team?.name || '—'}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold text-white tabular-nums">{bat?.runs ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">runs</div>
              <div className="mt-1 text-sm font-semibold text-amber-400 tabular-nums">
                {bowl?.wickets ?? 0} wkts
              </div>
            </div>
          </div>

          {recent.length > 0 && (
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Recent form
              </div>
              <div className="flex gap-1.5">
                {recent.map((e, i) => (
                  <span
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums ${formTone(e.runs)}`}
                  >
                    {e.runs}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <Block title="Batting">
              <Line label="Matches" value={bat?.matches ?? 0} />
              <Line label="Innings" value={bat?.innings ?? 0} />
              <Line label="Runs" value={bat?.runs ?? 0} />
              <Line label="Highest" value={bat?.hs_text ?? '—'} />
              <Line label="Average" value={bat?.average ?? '—'} />
              <Line label="Strike rate" value={bat?.strike_rate ?? '—'} />
              <Line label="Fours / Sixes" value={`${bat?.fours ?? 0} / ${bat?.sixes ?? 0}`} />
            </Block>
            <Block title="Bowling">
              <Line label="Overs" value={bowl?.overs ?? 0} />
              <Line label="Wickets" value={bowl?.wickets ?? 0} />
              <Line label="Best" value={bowl?.best_text ?? '—'} />
              <Line label="Average" value={bowl?.average ?? '—'} />
              <Line label="Economy" value={bowl?.economy ?? '—'} />
              <Line label="Strike rate" value={bowl?.strike_rate ?? '—'} />
              <Line label="Dots / Maidens" value={`${bowl?.dots ?? 0} / ${bowl?.maidens ?? 0}`} />
            </Block>
            <Block title="Fielding">
              <Line label="Catches" value={field?.catches ?? 0} />
              <Line label="Run-outs" value={field?.run_outs ?? 0} />
              <Line label="Stumpings" value={field?.stumpings ?? 0} />
              <Line label="Total" value={field?.total ?? 0} />
            </Block>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 mt-3">
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Runs per match
              </div>
              <PlayerFormChart data={chartData} />
            </div>
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                Wickets per match
              </div>
              <PlayerWicketsChart data={bowlingData} />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-700/50 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Match by match
            </div>
            {log.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No matches recorded</div>
            ) : (
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/40">
                    <th className="text-left px-3 py-1.5 font-medium">Opponent</th>
                    <th className="text-right px-2 py-1.5 font-medium">Batting</th>
                    <th className="text-right px-2 py-1.5 font-medium">Bowling</th>
                    <th className="text-right px-3 py-1.5 font-medium">Fielding</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((e) => (
                    <tr
                      key={e.match_id}
                      onClick={() => onOpenMatch(e.match_id)}
                      className="border-b border-slate-700/20 cursor-pointer hover:bg-slate-800/60"
                    >
                      <td className="px-3 py-1.5 text-slate-300">
                        <span className="truncate">{e.label}</span>
                        {e.live && (
                          <span className="ml-1.5 text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 align-middle">
                            LIVE
                          </span>
                        )}
                      </td>
                      <td className="text-right px-2 py-1.5 tabular-nums text-slate-200">
                        {e.runs === null ? '—' : `${e.runs}${e.out ? '' : '*'} (${e.balls})`}
                      </td>
                      <td className="text-right px-2 py-1.5 tabular-nums text-slate-200">
                        {e.wickets === null ? '—' : `${e.wickets}/${e.conceded}`}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums text-slate-400">
                        {e.catches + e.run_outs + e.stumpings || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-700/60 bg-slate-900/95 px-4 py-3 backdrop-blur">
          <button
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Save card
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}