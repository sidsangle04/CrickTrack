import React from 'react';
import { Compass, Radio } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import HeroMedia from '@/components/landing/HeroMedia';
import AuthButtons from '@/components/AuthButtons';

const HERO_VIDEO =
  'https://media.base44.com/videos/public/69cd6e7dda99287bd2ab65f2/4eff0fc5b_6877250-hd_1920_1080_30fps.mp4';

const HERO_POSTER =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/fdf707174_generated_image.png';

const PHOTOS = [
  {
    src: 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/1fd179c36_pexels-case-originals-3718433.jpg',
    alt: 'Batter mid-swing as the ball travels past the stumps towards the wicket-keeper',
    tilt: '-rotate-3',
  },
  {
    src: 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/80292c44f_IndianTurfCricket.png',
    alt: 'Evening practice on an artificial turf pitch beside apartment blocks',
    tilt: 'rotate-2',
  },
  {
    src: 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/d2107d2f9_pexels-pixelcop-2799556.jpg',
    alt: 'Cricket stadium pavilion and scoreboard under a fiery sunset sky',
    tilt: '-rotate-1',
  },
];

const STATS = [
  { value: 'Ball-by-ball', label: 'Live scoring' },
  { value: '2 modes', label: 'TURF & Standard' },
  { value: 'Analysis', label: 'Player insight' },
];

export default function LandingHero({ onExplore }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900">
      <HeroMedia videoUrl={HERO_VIDEO} posterUrl={HERO_POSTER} />

      <div className="relative px-6 py-14 md:px-14 md:py-20">
        <div className="max-w-2xl">
          <Reveal delay={0.05}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur">
              <Radio className="h-3.5 w-3.5" />
              From backyard to boundary
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
              CrickTrack is scoring and analytics software for the people who actually runs the
              cricket: club analysts, coaches, league organisers and weekend teams. Tag each delivery
              as it happens and the scorecard, wagon wheels, pitch maps and player records build
              themselves.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <p className="mt-5 border-l-2 border-emerald-500/60 pl-4 text-sm leading-relaxed text-emerald-100/90">
              And it isn't only for the pros. If a game is happening in a backyard, a lane or a
              park, that game deserves a scorecard too. Every player, however they start, has the
              same quiet dream: to see their name beside a score.
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
        </div>

        <Reveal delay={0.36}>
          <div className="mt-14 flex items-end gap-3 sm:gap-4">
            {PHOTOS.map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className={`h-24 w-24 rounded-2xl border-2 border-slate-800/80 object-cover shadow-2xl shadow-black/50 sm:h-32 sm:w-32 ${photo.tilt}`}
              />
            ))}
            <p className="mb-1 hidden max-w-[11rem] text-[11px] uppercase leading-relaxed tracking-wider text-slate-400 sm:block">
              Every ball, every ground, every season
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.44}>
          <dl className="mt-10 grid max-w-2xl grid-cols-1 gap-6 border-t border-slate-700/50 pt-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="text-lg font-semibold text-white">{s.value}</dt>
                <dd className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">{s.label}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}