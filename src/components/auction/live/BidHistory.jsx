import React, { useMemo } from 'react';
import { Panel } from '../Shared';

export default function BidHistory({ bids, teams }) {
  const teamName = (id) => teams.find((t) => t.id === id)?.name || 'Team';

  // The whole auction's history, newest first. Bids saved in the same moment are
  // shown highest first so the running order never looks jumbled.
  const list = useMemo(
    () =>
      [...bids].sort((a, b) => {
        const byTime = new Date(b.created_date || 0) - new Date(a.created_date || 0);
        if (byTime !== 0) return byTime;
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      }),
    [bids]
  );

  return (
    <Panel title={`Bid history (${bids.length})`}>
      {list.length === 0 ? (
        <p className="text-xs text-slate-500">Bids will appear here.</p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {list.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-700/40 last:border-0"
            >
              <span className="text-slate-300 truncate">
                {bid.player_name ? `${bid.player_name} · ` : ''}
                {bid.team_name || teamName(bid.team_id)}
              </span>
              <span className="font-bold text-emerald-400 tabular-nums shrink-0">{bid.amount}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}