import React from 'react';
import { motion } from 'framer-motion';
import { Gavel } from 'lucide-react';
import { CategoryBadge, PlayerAvatar, ROLE_LABELS, TeamBadge } from '../Shared';

// Full-screen "player sold" card: a layered, extruded 3D slab lit in the
// winning team's colour. It stays up until the operator taps anywhere.
export default function SoldCard3D({ sale, onDone }) {
  const { player, team, price } = sale || {};

  if (!player) return null;

  const color = team?.color || '#10b981';

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden p-4 bg-slate-950/90 backdrop-blur-md"
      style={{ perspective: '1600px' }}
    >
      {/* team-coloured halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[560px] w-[560px] rounded-full blur-3xl opacity-50"
        style={{ background: `radial-gradient(circle, ${color}, transparent 68%)` }}
      />

      <motion.div
        initial={{ rotateY: -170, rotateX: 22, scale: 0.7, opacity: 0 }}
        animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full max-w-sm"
      >
        <motion.div
          animate={{ rotateY: [0, 15, 0, -15, 0], rotateX: [0, -6, 0, 6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.05 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative"
        >
          {/* extruded edge — stacked layers behind the face give the slab real depth */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              aria-hidden
              className="absolute inset-0 rounded-3xl"
              style={{
                transform: `translateZ(${-10 - i * 10}px)`,
                background: `linear-gradient(165deg, ${color}, #0b1220 65%)`,
                opacity: 0.9 - i * 0.12,
                boxShadow: i === 4 ? `0 40px 80px -30px ${color}` : 'none'
              }}
            />
          ))}

          {/* card face */}
          <div
            className="relative overflow-hidden rounded-3xl border"
            style={{
              borderColor: `${color}80`,
              background: `linear-gradient(165deg, ${color}40 0%, #101a2c 38%, #030712 100%)`,
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.16) inset, 0 0 0 1px rgba(255,255,255,0.05) inset, 0 30px 60px -25px #000'
            }}
          >
            {/* top gloss */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-2/5"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)' }}
            />
            {/* colour wash from the winning team */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-50"
              style={{ background: `radial-gradient(circle at 50% -10%, ${color}, transparent 70%)` }}
            />
            {/* sweeping shine */}
            <motion.div
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '160%' }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />

            <div className="relative px-5 pt-5 pb-6 text-center">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-[0.3em] text-slate-950"
                style={{
                  background: 'linear-gradient(180deg, #fde68a, #f59e0b)',
                  boxShadow: '0 5px 0 #b45309, 0 12px 26px rgba(245,158,11,0.4)'
                }}
              >
                <Gavel className="h-4 w-4" /> Sold
              </div>

              <div className="mt-5 flex justify-center">
                <div
                  className="rounded-2xl p-1"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 0 5px rgba(255,255,255,0.07), 0 18px 40px -10px ${color}`
                  }}
                >
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

              <div
                className="mt-5 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)'
                }}
              />

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

              <div
                className="mt-4 rounded-2xl border py-3"
                style={{
                  borderColor: `${color}55`,
                  background: `linear-gradient(180deg, ${color}26, rgba(2,6,23,0.9))`,
                  boxShadow: `0 0 34px -14px ${color} inset`
                }}
              >
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Price</p>
                <p
                  className="text-4xl font-black tabular-nums leading-none text-white"
                  style={{ textShadow: `0 0 26px ${color}` }}
                >
                  {price || 0}
                  <span className="ml-1.5 text-sm font-bold text-slate-400">coins</span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}