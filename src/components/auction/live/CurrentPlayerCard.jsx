import React from 'react';
import { Gavel, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryBadge, PlayerAvatar, ROLE_LABELS, TeamBadge } from '../Shared';

export default function CurrentPlayerCard({ player, bid, bidderTeam, nextAmount, onNominate, locked }) {
  if (!player) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 p-8 text-center">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
          <Gavel className="w-7 h-7 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400 mb-4">No player on the block right now.</p>
        <Button
          onClick={onNominate}
          disabled={locked}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Bring in the next player
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <PlayerAvatar player={player} size="xl" className="mx-auto sm:mx-0" />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{player.name}</h2>
            <CategoryBadge category={player.category} />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {[
              ROLE_LABELS[player.primary_role],
              player.age ? `${player.age} yrs` : '',
              player.batting_style === 'left_hand' ? 'Left hand bat' : player.batting_style ? 'Right hand bat' : ''
            ]
              .filter(Boolean)
              .join(' · ') || 'No extra details'}
          </p>
          {player.experience && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{player.experience}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-950/60 border border-slate-700/60 p-3 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Current bid</p>
          <p className="text-3xl font-black text-emerald-400 tabular-nums leading-tight">
            {bid || 0}
          </p>
          <p className="text-[10px] text-slate-500">Next bid {nextAmount}</p>
        </div>
        <div className="rounded-xl bg-slate-950/60 border border-slate-700/60 p-3 flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">
            Highest bidder
          </p>
          {bidderTeam ? (
            <div className="flex items-center gap-2 min-w-0">
              <TeamBadge team={bidderTeam} size="sm" />
              <span className="text-sm font-semibold text-white truncate">{bidderTeam.name}</span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">No bids yet</span>
          )}
        </div>
      </div>
    </div>
  );
}