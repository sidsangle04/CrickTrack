import React from 'react';
import { Panel, PlayerAvatar, TeamBadge } from '../Shared';
import { teamFinance } from '@/lib/auction/squad';

export default function SquadBoard({ teams, players, settings }) {
  return (
    <Panel title="Squads & purse">
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {teams.map((team) => {
          const finance = teamFinance({ teamId: team.id, players, settings });
          return (
            <details key={team.id} className="rounded-lg bg-slate-900/60 border border-slate-700/60">
              <summary className="flex items-center gap-2 p-2 cursor-pointer list-none">
                <TeamBadge team={team} size="sm" />
                <span className="text-xs font-semibold text-white truncate flex-1">{team.name}</span>
                <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                  {finance.squad.length}/{finance.target} · {finance.purseLeft}
                </span>
              </summary>
              <div className="px-2 pb-2 space-y-1">
                {finance.squad.length === 0 && (
                  <p className="text-[11px] text-slate-500">No players yet.</p>
                )}
                {finance.squad.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <PlayerAvatar player={p} size="sm" className="!w-6 !h-6 !text-[9px] !rounded-md" />
                    <span className="text-[11px] text-slate-300 truncate flex-1">{p.name}</span>
                    <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                      {p.category === 'icon' ? 'Icon · free' : p.sold_price || 0}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-slate-700/50 text-[10px] text-slate-400">
                  <span>Spent {finance.spent}</span>
                  <span>Purse left {finance.purseLeft}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{finance.slotsLeft} still to buy</span>
                  <span>Max bid {finance.maxBid}</span>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </Panel>
  );
}