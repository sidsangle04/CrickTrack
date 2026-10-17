import React from 'react';
import Reveal from '@/components/landing/Reveal';

const YARD_VIDEO =
  'https://media.base44.com/videos/public/69cd6e7dda99287bd2ab65f2/e42ab9789_16254865_1920_1080_24fps.mp4';

export default function LandingYardPhoto() {
  return (
    <section className="py-16 md:py-20">
      <Reveal>
        <figure className="overflow-hidden rounded-2xl border border-slate-700/50 shadow-xl shadow-black/30">
          <video
            src={YARD_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            className="h-56 w-full object-cover object-center md:h-72"
          />
          <figcaption className="border-t border-slate-700/50 bg-slate-900/60 px-5 py-3 text-xs text-slate-400">
            Where it starts: no pads, no gear, just a bat and a ball.
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}