import React, { useState } from 'react';
import {
  CircleDot,
  GitCompareArrows,
  Lightbulb,
  LineChart,
  Target,
  Users,
  Trophy,
  Upload,
} from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import FeatureDetailDialog from '@/components/landing/FeatureDetailDialog';

// `teaser` is what shows on the tile; the full `text` opens in the pop-up.
const FEATURES = [
  {
    Icon: CircleDot,
    title: 'Live ball-by-ball scoring',
    teaser: 'Log every ball in real time from any phone.',
    text: 'Log runs, wickets, extras and over limits in real time from any phone. Quick-scoring mode when you just want the numbers.',
  },
  {
    Icon: LineChart,
    title: 'Deep match analytics',
    teaser: 'Wagon wheels, pitch maps and worm graphs.',
    text: 'Wagon wheels, pitch maps, worm graphs, partnerships and win probability generated as the match unfolds.',
  },
  {
    Icon: GitCompareArrows,
    title: 'Player comparison & head-to-head',
    teaser: 'Two players, side by side.',
    text: 'Pick any two players and compare runs, strike rate, averages and their record against each other.',
  },
  {
    Icon: Lightbulb,
    title: 'Strengths, weaknesses & insights',
    teaser: 'What a player does well, and what to work on.',
    text: 'Favourite scoring areas, strong match-ups and the weaknesses to work on, all drawn from the ball-by-ball detail.',
  },
  {
    Icon: Target,
    title: 'Player profiles & career stats',
    teaser: 'Careers that build across the season.',
    text: 'Batting, bowling and fielding records accumulate over the season so form is always visible at a glance.',
  },
  {
    Icon: Users,
    title: 'Teams, squads & venues',
    teaser: 'Squads, roles and your own grounds.',
    text: 'Manage playing XIs, roles and bowling styles, and keep your grounds with their par scores and venue averages.',
  },
  {
    Icon: Trophy,
    title: 'Tournaments & leagues',
    teaser: 'Standings, qualification and live brackets.',
    text: 'Run knockouts or league-plus-playoffs with automatic standings, qualification and a live bracket.',
  },
  {
    Icon: Upload,
    title: 'Import existing scorecards',
    teaser: 'Bring your Play-Cricket history across.',
    text: 'Bring Play-Cricket scorecards and ball-by-ball logs straight into CrickTrack and keep the history in one place.',
  },
];

export default function LandingFeatures() {
  const [active, setActive] = useState(null);

  return (
    <section id="features" className="scroll-mt-24 py-12 md:py-16">
      <Reveal className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Feature highlights
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          Everything a club needs, nothing it does not
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          From the first ball of a friendly to the final of your league, the same tools stay with
          you. Tap any feature for the detail.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={(index % 4) * 0.07}>
            <button
              type="button"
              onClick={() => setActive(feature)}
              className="group flex h-full w-full flex-col rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-slate-800/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 transition-colors group-hover:border-emerald-500/40">
                <feature.Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{feature.teaser}</p>
              <span className="mt-3 text-xs font-semibold text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                Learn more
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <FeatureDetailDialog
        feature={active}
        open={Boolean(active)}
        onOpenChange={(next) => !next && setActive(null)}
      />
    </section>
  );
}