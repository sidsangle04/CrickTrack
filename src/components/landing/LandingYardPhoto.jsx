import React from 'react';
import Reveal from '@/components/landing/Reveal';

const YARD_IMAGE =
  'https://images.pexels.com/photos/9067719/pexels-photo-9067719.jpeg?auto=compress&cs=tinysrgb&w=1600';

export default function LandingYardPhoto() {
  return (
    <section className="py-16 md:py-20">
      <Reveal>
        <figure className="overflow-hidden rounded-2xl border border-slate-700/50 shadow-xl shadow-black/30">
          <img
            src={YARD_IMAGE}
            alt="Kids playing cricket barefoot with a makeshift bat"
            loading="lazy"
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