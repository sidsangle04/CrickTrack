import React from 'react';
import { Panel } from '../Shared';

export default function BidHistory({ bids, teams, playerId }) {
  const teamName = (id) => teams.find((t) => t.id === id)?.name || 'Team';
  const list = playerId ? bids.filter((b) => b.player_id === playerId) : bids.slice(0, 30);

  return (
    <Panel title="Bid history">
      {list.length === 0 ? (
        <p className="text-xs text-slate-500">
          {playerId ? 'No bids for this player yet.' : 'Bids will appear here.'}
        </p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {list.map((bid) => (
            <div
              key={bid.id}
              className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-700/40 last:border-0"
            >
              <span className="text-slate-300 truncate">
                {bid.player_name && !playerId ? `${bid.player_name} · ` : ''}
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