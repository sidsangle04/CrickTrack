import React from 'react';
import { GitCompareArrows, Lightbulb, MapPinned } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import ComparisonPanel from '@/components/landing/panels/ComparisonPanel';
import InsightTagsPanel from '@/components/landing/panels/InsightTagsPanel';

const WAGON_WHEEL =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/b2d3159f4_Screenshot2026-10-17at160107.png';
const PITCH_MAP =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/4376bb8ec_Screenshot2026-10-17at160053.png';

const POINTS = [
  {
    Icon: GitCompareArrows,
    title: 'Compare any two players',
    text: 'Put two names side by side and see runs, strike rate, averages and head-to-head records in one view.',
  },
  {
    Icon: Lightbulb,
    title: 'Spot strengths and weaknesses',
    text: 'CrickTrack reads the detail behind the averages and points to what a player does well and what still needs work.',
  },
  {
    Icon: MapPinned,
    title: 'Read the ground and the pitch',
    text: 'Scoring areas and pitch maps show where the runs come from and where each delivery actually landed.',
  },
];

export default function LandingInsights() {
  return (
    <section className="py-16 md:py-20">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Player insight
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            More than a scorecard
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            A scorecard tells you how many. CrickTrack tells you how, and where. Compare players,
            find the patterns behind a season and see the game the way a coach would.
          </p>

          <div className="mt-8 space-y-5">
            {POINTS.map(({ Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.08} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <ComparisonPanel />
        </Reveal>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {[
          {
            src: WAGON_WHEEL,
            title: 'Scoring areas',
            text: 'Every run plotted by zone, so a batter can see where they score.',
          },
          {
            src: PITCH_MAP,
            title: 'Pitch map',
            text: 'Where each delivery landed, and what the bowler was trying.',
          },
        ].map(({ src, title, text }, index) => (
          <Reveal
            key={title}
            delay={index * 0.1}
            className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40">
            <img
              src={src}
              alt={`CrickTrack ${title.toLowerCase()} view`}
              loading="lazy"
              className="h-40 w-full bg-slate-950 object-contain"
            />
            <div className="border-t border-slate-700/50 p-5">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{text}</p>
            </div>
          </Reveal>
        ))}
        <Reveal delay={0.2}>
          <InsightTagsPanel />
        </Reveal>
      </div>
    </section>
  );
}