import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Full-bleed hero media: a looping cricket clip with the poster photograph
 * showing whenever the visitor has asked for reduced motion (or the clip is
 * still loading). The two gradients keep the headline legible over it.
 */
export default function HeroMedia({ videoUrl, posterUrl, light = false }) {
  const reduceMotion = useReducedMotion();
  const clipRef = useRef(null);

  // Embedded frames sometimes ignore the autoplay attribute, so start the
  // clip explicitly once it has mounted.
  useEffect(() => {
    const clip = clipRef.current;
    if (reduceMotion || !clip) return;
    const started = clip.play();
    if (started && typeof started.catch === 'function') started.catch(() => {});
  }, [reduceMotion, videoUrl]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <video
        ref={clipRef}
        className="h-full w-full object-cover"
        src={videoUrl}
        poster={posterUrl}
        autoPlay={!reduceMotion}
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
      />
      <div
        className={
          light
            ? 'absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/35 to-slate-950/10'
            : 'absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-950/45 to-slate-950/5'
        }
      />
      <div
        className={
          light
            ? 'absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/25'
            : 'absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30'
        }
      />
    </div>
  );
}