import React from 'react';
import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import { CategoryBadge, PlayerAvatar, ROLE_LABELS, TeamBadge } from '../Shared';

// Full-screen "player sold" card that swings in and keeps turning in 3D.
// It stays up until the operator taps anywhere.
export default function SoldCard3D({ sale, onDone }) {
  const { player, team, price } = sale || {};

  if (!player) return null;

  const color = team?.color || '#10b981';

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      style={{ perspective: '1400px' }}
    >
      <motion.div
        initial={{ rotateY: -170, rotateX: 22, scale: 0.7, opacity: 0 }}
        animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full max-w-sm"
      >
        <motion.div
          animate={{ rotateY: [0, 15, 0, -15, 0], rotateX: [0, -6, 0, 6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.05 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <div
            className="relative overflow-hidden rounded-3xl border-2 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950"
            style={{
              borderColor: color,
              boxShadow: `0 40px 90px -25px ${color}, 0 0 0 1px rgba(255,255,255,0.06) inset`
            }}
          >
            {/* colour wash from the winning team */}
            <div
              className="absolute inset-x-0 top-0 h-40 opacity-40 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 0%, ${color}, transparent 70%)` }}
            />

            {/* sweeping shine */}
            <motion.div
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '160%' }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none"
            />

            <div className="relative px-5 pt-5 pb-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-slate-900 px-4 py-1.5 font-black uppercase tracking-[0.3em] text-sm shadow-lg">
                <Gavel className="w-4 h-4" /> Sold
              </div>

              <div className="mt-5 flex justify-center">
                <div className="rounded-2xl p-1" style={{ backgroundColor: color }}>
                  <PlayerAvatar player={player} size="hero" />
                </div>
              </div>

              <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white leading-tight break-words">
                {player.name}
              </h2>
              <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                <CategoryBadge category={player.category} />
                {player.primary_role && (
                  <span className="text-[11px] uppercase tracking-widest text-slate-400">
                    {ROLE_LABELS[player.primary_role]}
                  </span>
                )}
              </div>

              <div className="mt-5 h-px bg-white/10" />

              <div className="mt-4 flex items-center justify-center gap-3">
                <TeamBadge team={team} size="lg" />
                <div className="text-left min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
                    Sold to
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">
                    {team?.name || 'Team'}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-slate-950/70 border border-white/10 py-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Price</p>
                <p className="text-4xl font-black tabular-nums leading-none" style={{ color }}>
                  {price || 0}
                  <span className="text-sm font-bold text-slate-400 ml-1.5">coins</span>
                </p>
              </div>

              <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Tap anywhere to continue
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}