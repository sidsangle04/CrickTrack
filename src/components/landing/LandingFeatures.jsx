import React from 'react';
import {
  CircleDot,
  LineChart,
  Target,
  Users,
  Trophy,
  Upload,
} from 'lucide-react';
import Reveal from '@/components/landing/Reveal';

const FEATURES = [
  {
    Icon: CircleDot,
    title: 'Live ball-by-ball scoring',
    text: 'Log runs, wickets, extras and over limits in real time from any phone. Quick-scoring mode when you just want the numbers.',
  },
  {
    Icon: LineChart,
    title: 'Deep match analytics',
    text: 'Wagon wheels, pitch maps, worm graphs, partnerships and win probability generated as the match unfolds.',
  },
  {
    Icon: Target,
    title: 'Player profiles & career stats',
    text: 'Batting, bowling and fielding records accumulate over the season so form is always visible at a glance.',
  },
  {
    Icon: Users,
    title: 'Teams, squads & venues',
    text: 'Manage playing XIs, roles and bowling styles, and keep your grounds with their par scores and venue averages.',
  },
  {
    Icon: Trophy,
    title: 'Tournaments & leagues',
    text: 'Run knockouts or league-plus-playoffs with automatic standings, qualification and a live bracket.',
  },
  {
    Icon: Upload,
    title: 'Import existing scorecards',
    text: 'Bring Play-Cricket scorecards and ball-by-ball logs straight into CrickTrack and keep the history in one place.',
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-16 md:py-20">
      <Reveal className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Feature highlights
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Everything a club needs, nothing it does not
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          From the first ball of a friendly to the final of your league, the same tools stay with you.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ Icon, title, text }, index) => (
          <Reveal
            key={title}
            delay={(index % 3) * 0.09}
            className="group rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-slate-800/60">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 transition-colors group-hover:border-emerald-500/40">
              <Icon className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}