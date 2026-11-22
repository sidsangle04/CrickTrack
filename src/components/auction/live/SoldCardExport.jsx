import React, { forwardRef } from 'react';
import SoldCardFace from './SoldCardFace';

// The sold card exactly as it is shown on screen, drawn for the photo download:
// the team-coloured halo, the extruded slab edges and the shine, all as plain
// 2D layers so the capture keeps the full look (a screenshot cannot render the
// CSS 3D transforms used by the live pop-up).
const SoldCardExport = forwardRef(function SoldCardExport({ player, team, price }, ref) {
  if (!player) return null;

  const color = team?.color || '#10b981';

  return (
    <div
      ref={ref}
      style={{
        width: '420px',
        padding: '36px 34px 42px',
        background: `radial-gradient(circle at 50% 34%, ${color}66 0%, #0b1220 48%, #020617 80%)`,
      }}
    >
      <div style={{ position: 'relative' }}>
        {/* extruded edge — the same stacked layers as the live card, offset in 2D */}
        {[4, 3, 2, 1, 0].map((i) => (
          <div
            key={i}
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '1.5rem',
              transform: `translate(${(i + 1) * 3}px, ${(i + 1) * 3}px)`,
              background: `linear-gradient(165deg, ${color}, #0b1220 65%)`,
              opacity: 0.9 - i * 0.12,
              boxShadow: i === 4 ? `0 40px 80px -30px ${color}` : 'none',
            }}
          />
        ))}

        <div style={{ position: 'relative', borderRadius: '1.5rem', overflow: 'hidden' }}>
          <SoldCardFace player={player} team={team} price={price} />
          {/* sweeping shine */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(115deg, transparent 36%, rgba(255,255,255,0.16) 50%, transparent 64%)',
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default SoldCardExport;