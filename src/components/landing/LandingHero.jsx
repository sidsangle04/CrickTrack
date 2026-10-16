import React from 'react';
import { Compass, Radio } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import FieldSweep from '@/components/landing/FieldSweep';
import AuthButtons from '@/components/AuthButtons';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1400&q=80';

const STATS = [
  { value: 'Ball-by-ball', label: 'Live scoring' },
  { value: '2 modes', label: 'TURF & Standard' },
  { value: 'Play-Cricket', label: 'Scorecard import' },
];

export default function LandingHero({ onExplore }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-800/70 via-slate-900/60 to-slate-950">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative grid items-center gap-10 px-6 py-14 md:px-14 md:py-20 lg:grid-cols-2">
        <div>
          <Reveal delay={0.05}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Radio className="h-3.5 w-3.5" />
              Built for club cricket
            </span>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-5xl">
              Score every ball.
              <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                See the whole game.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mt-6 text-base leading-relaxed text-slate-300">
              CrickTrack is scoring and analytics software for the people who actually run cricket:
              club captains, league organisers and weekend teams. Tag each delivery as it happens and
              the scorecard, wagon wheels, pitch maps and player records build themselves.
            </p>
          </Reveal>

          <Reveal delay={0.28}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.03] hover:shadow-emerald-500/40">
                <Compass className="h-4 w-4" />
                Explore Features
              </button>
              <AuthButtons variant="hero" />
            </div>
          </Reveal>

          <Reveal delay={0.36}>
            <dl className="mt-12 grid grid-cols-1 gap-6 border-t border-slate-700/50 pt-8 sm:grid-cols-3">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="text-lg font-semibold text-white">{s.value}</dt>
                  <dd className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.22} className="relative">
          <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl shadow-black/40">
            <img
              src={HERO_IMAGE}
              alt="Cricket match in progress on a grass field"
              className="h-64 w-full object-cover md:h-80 lg:h-[26rem]"
            />
            <FieldSweep />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}