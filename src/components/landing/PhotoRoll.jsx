import React, { useEffect, useRef } from 'react';
import { MoveHorizontal } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import Reveal from '@/components/landing/Reveal';
import PhotoRollCard from '@/components/landing/PhotoRollCard';
import { ROLL_CARDS } from '@/components/landing/rollCards';

// The card list is rendered twice so the continuous scroll can wrap around
// without a visible jump.
const LOOP = [...ROLL_CARDS, ...ROLL_CARDS];
const SPEED_PX_PER_SECOND = 26;

export default function PhotoRoll() {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const dragRef = useRef(null);
  const reduceMotion = useReducedMotion();

  // Drift the roll along on its own, unless the visitor asked for reduced
  // motion (then it only moves when they scroll or drag it).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || reduceMotion) return undefined;

    let frame;
    let previous = performance.now();

    const step = (now) => {
      const elapsed = now - previous;
      previous = now;

      if (!pausedRef.current && !dragRef.current) {
        const half = track.scrollWidth / 2;
        track.scrollLeft += (elapsed / 1000) * SPEED_PX_PER_SECOND;
        if (half > 0 && track.scrollLeft >= half) track.scrollLeft -= half;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  const pause = () => {
    pausedRef.current = true;
  };
  const resume = () => {
    pausedRef.current = false;
  };

  // Mouse dragging, for visitors without a touchscreen or trackpad swipe.
  const handlePointerDown = (event) => {
    const track = trackRef.current;
    pause();
    if (event.pointerType === 'mouse' && track) {
      dragRef.current = { x: event.clientX, left: track.scrollLeft };
      track.setPointerCapture?.(event.pointerId);
    }
  };

  const handlePointerMove = (event) => {
    const track = trackRef.current;
    if (!dragRef.current || !track) return;
    track.scrollLeft = dragRef.current.left - (event.clientX - dragRef.current.x);
  };

  const handlePointerUp = () => {
    dragRef.current = null;
    resume();
  };

  return (
    <section className="py-14 md:py-20">
      <Reveal className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Inside the app
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          The whole match on one screen
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          A rolling look at what you score with: the live scorecard, wagon wheels, pitch maps, run
          graphs and season leaderboards.
        </p>
      </Reveal>

      <div className="mt-8 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
        <MoveHorizontal className="h-4 w-4" />
        Drag to explore
      </div>

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onMouseEnter={pause}
        onMouseLeave={resume}
        className="-mx-4 mt-4 flex cursor-grab select-none gap-5 overflow-x-auto px-4 pb-4 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {LOOP.map((card, index) => (
          <PhotoRollCard key={`${card.key}-${index}`} {...card} />
        ))}
      </div>
    </section>
  );
}