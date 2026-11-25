import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CategoryBadge, PlayerAvatar, TeamBadge } from '../Shared';

export default function BigScreen({ auction, players, teams, flash, bidControls, onClose }) {
  const player = players.find((p) => p.id === auction.current_player_id) || null;
  const bidder = teams.find((t) => t.id === auction.current_bidder_team_id) || null;
  const bid = auction.current_bid || 0;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.18),transparent_60%)]" />

      <div className="relative flex flex-col h-full">
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-emerald-400 font-bold">
            CrickTrack Auction
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {auction.status === 'paused' ? 'Paused' : 'Live'}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Close display"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {player ? (
          <div className="flex-1 grid lg:grid-cols-2 gap-6 items-center px-5 pb-8 max-w-7xl mx-auto w-full">
            <div className="flex justify-center">
              <PlayerAvatar player={player} size="hero" className="shadow-2xl" />
            </div>
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <h1 className="text-4xl sm:text-6xl font-black leading-none">{player.name}</h1>
              </div>
              <div className="mt-2 flex justify-center lg:justify-start">
                <CategoryBadge category={player.category} />
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-400">Current bid</p>
              <p className="text-6xl sm:text-8xl font-black text-emerald-400 tabular-nums leading-none">
                {bid || 0}
              </p>

              <div className="mt-6 flex items-center gap-3 justify-center lg:justify-start">
                {bidder ? (
                  <>
                    <TeamBadge team={bidder} size="lg" />
                    <div className="text-left">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        Highest bidder
                      </p>
                      <p className="text-2xl font-bold">{bidder.name}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-lg text-slate-400">Waiting for the first bid…</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid place-items-center px-6">
            <p className="text-2xl sm:text-4xl font-bold text-slate-500 text-center">
              Waiting for the next player…
            </p>
          </div>
        )}

        {bidControls && (
          <div className="relative shrink-0 border-t border-slate-800 bg-slate-950/90 px-4 pt-3 pb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">
              Teams · purse &amp; squad
            </p>
            {bidControls}
          </div>
        )}
      </div>

      {flash && (
        <motion.div
          key={flash.at}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className={`absolute inset-0 z-10 grid place-items-center ${
            flash.type === 'sold' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          <div className="text-center px-6">
            <p className="text-6xl sm:text-8xl font-black uppercase tracking-tight">
              {flash.type === 'sold' ? 'Sold' : 'Unsold'}
            </p>
            <p className="text-2xl sm:text-3xl font-bold mt-2">{flash.player?.name}</p>
            {flash.type === 'sold' && flash.team && (
              <p className="text-lg sm:text-2xl text-white/90 mt-1">
                {flash.team.name} · {flash.price} coins
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}