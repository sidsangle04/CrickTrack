import React from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Full-bleed hero media: a looping cricket clip with the poster photograph
 * showing whenever the visitor has asked for reduced motion (or the clip is
 * still loading). The two gradients keep the headline legible over it.
 */
export default function HeroMedia({ videoUrl, posterUrl }) {
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
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/60" />
    </div>
  );
}