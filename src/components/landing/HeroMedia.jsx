import React from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Full-bleed hero media: a looping cricket clip with the poster photograph
 * showing whenever the visitor has asked for reduced motion (or the clip is
 * still loading). The two gradients keep the headline legible over it.
 */
export default function HeroMedia({ videoUrl, posterUrl, light = false }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <video
        className="h-full w-full object-cover"
        src={videoUrl}
        poster={posterUrl}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="metadata"
        tabIndex={-1}
      />
      <div
        className={
          light
            ? 'absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/35 to-slate-950/10'
            : 'absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30'
        }
      />
      <div
        className={
          light
            ? 'absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/25'
            : 'absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-slate-950/55'
        }
      />
    </div>
  );
}