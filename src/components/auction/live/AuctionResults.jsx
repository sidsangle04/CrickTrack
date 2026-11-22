import React from 'react';
import { Trophy } from 'lucide-react';
import { Panel, PlayerAvatar, TeamBadge } from '../Shared';
import SoldCardPhotoButton from './SoldCardPhotoButton';
import { teamFinance } from '@/lib/auction/squad';

export default function AuctionResults({ teams, players, settings }) {
  const rows = teams.map((team) => ({
    team,
    finance: teamFinance({ teamId: team.id, players, settings })
  }));
  const topBuys = players
    .filter((p) => p.status === 'sold' && p.category !== 'icon')
    .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 border border-emerald-500/40 p-5 text-center">
        <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-white">Auction complete</h2>
        <p className="text-sm text-slate-300">
          {teams.length} teams · {players.filter((p) => p.sold_to_team_id).length} players signed
        </p>
      </div>

      {topBuys.length > 0 && (
        <Panel title="Biggest buys">
          <div className="space-y-1.5">
            {topBuys.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <PlayerAvatar player={p} size="sm" />
                <span className="text-sm text-white truncate flex-1">{p.name}</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {p.sold_price}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map(({ team, finance }) => (
          <Panel key={team.id}>
            <div className="flex items-center gap-3 mb-3">
              <TeamBadge team={team} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{team.name}</p>
                <p className="text-[11px] text-slate-400">
                  {finance.squad.length}/{finance.target} players · spent {finance.spent} · left{' '}
                  {finance.purseLeft}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              {finance.squad.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 text-xs border-b border-slate-700/40 last:border-0 py-1"
                >
                  <span className="text-slate-200 truncate">
                    {p.name}
                    {p.category === 'icon' && (
                      <span className="text-[9px] uppercase text-purple-300 ml-1">icon</span>
                    )}
                  </span>
                  <span className="text-slate-400 tabular-nums shrink-0">
                    {p.category === 'icon' ? 'Free' : p.sold_price || 0}
                  </span>
                  <SoldCardPhotoButton
                    sale={{ player: p, team, price: p.category === 'icon' ? 0 : p.sold_price }}
                  />
                </div>
              ))}
              {finance.squad.length === 0 && (
                <p className="text-xs text-slate-500">No players.</p>
              )}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}