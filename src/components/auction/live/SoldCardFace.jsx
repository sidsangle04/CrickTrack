import React, { forwardRef } from 'react';
import { Gavel } from 'lucide-react';
import { CategoryBadge, PlayerAvatar, ROLE_LABELS, TeamBadge } from '../Shared';

// The sold-card design itself — a slab lit in the winning team's colour.
// Shared by the 3D pop-up and the photo download so both always look the same.
// The layout deliberately avoids flex rows and gaps: the photo is drawn by
// html2canvas, which lays flex rows out badly (text ends up overlapping), while
// plain block and inline-block flow comes out exactly as it does on screen.
const SoldCardFace = forwardRef(function SoldCardFace({ player, team, price }, ref) {
  if (!player) return null;

  const color = team?.color || '#10b981';

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-3xl border"
      style={{
        borderColor: `${color}80`,
        background: `linear-gradient(165deg, ${color}40 0%, #101a2c 38%, #030712 100%)`,
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.16) inset, 0 0 0 1px rgba(255,255,255,0.05) inset, 0 30px 60px -25px #000',
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

      <div className="relative px-5 pt-5 pb-6 text-center">
        <div
          className="inline-block rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-[0.3em] text-slate-950"
          style={{
            background: 'linear-gradient(180deg, #fde68a, #f59e0b)',
            boxShadow: '0 5px 0 #b45309, 0 12px 26px rgba(245,158,11,0.4)',
          }}
        >
          <Gavel
            className="h-4 w-4"
            style={{ display: 'inline-block', verticalAlign: '-3px', marginRight: '6px' }}
          />
          Sold
        </div>

        <div className="mt-5 text-center">
          <div
            className="inline-block rounded-2xl p-1"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 0 5px rgba(255,255,255,0.07), 0 18px 40px -10px ${color}`,
            }}
          >
            <PlayerAvatar player={player} size="hero" />
          </div>
        </div>

        <h2
          className="mt-4 text-2xl sm:text-3xl font-black text-white leading-tight"
          style={{ wordBreak: 'break-word' }}
        >
          {player.name}
        </h2>
        <div className="mt-2">
          <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <CategoryBadge category={player.category} />
          </div>
          {player.primary_role && (
            <div
              className="text-[11px] uppercase tracking-widest text-slate-400"
              style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '8px' }}
            >
              {ROLE_LABELS[player.primary_role]}
            </div>
          )}
        </div>

        <div
          className="mt-5 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)',
          }}
        />

        <div className="mt-4 text-center">
          <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <TeamBadge team={team} size="lg" />
          </div>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              textAlign: 'left',
              marginLeft: '12px',
              maxWidth: '200px',
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Sold to</div>
            <div
              className="text-lg sm:text-xl font-bold text-white"
              style={{ wordBreak: 'break-word' }}
            >
              {team?.name || 'Team'}
            </div>
          </div>
        </div>

        <div
          className="mt-4 rounded-2xl border py-3"
          style={{
            borderColor: `${color}55`,
            background: `linear-gradient(180deg, ${color}26, rgba(2,6,23,0.9))`,
            boxShadow: `0 0 34px -14px ${color} inset`,
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

        {/* CrickTrack lockup */}
        <div className="mt-4 text-center">
          <div style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <img
              src="https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png"
              alt="CrickTrack"
              className="h-6 w-auto rounded bg-white p-0.5"
            />
          </div>
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              textAlign: 'left',
              marginLeft: '8px',
            }}
          >
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-300 leading-none">
              CrickTrack
            </p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.2em] text-slate-500 leading-none">
              Tag · Analyse · Elevate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SoldCardFace;