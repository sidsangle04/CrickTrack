import React from 'react';
import { CircleDot, BarChart3, Users } from 'lucide-react';

const TURF_IMAGE =
  'https://images.unsplash.com/photo-1776229705277-8d46c945ff1a?auto=format&fit=crop&w=1600&q=80';

const STEPS = [
  {
    Icon: CircleDot,
    step: '01',
    title: 'Score the game',
    text: 'Pick your teams, choose the format and score from the boundary. Runs, wickets, extras, over limits and super overs are all handled.',
  },
  {
    Icon: BarChart3,
    step: '02',
    title: 'Watch the numbers build',
    text: 'Every delivery feeds the scorecard, worm graph, win probability and shot maps. Nothing to export, nothing to re-type.',
  },
  {
    Icon: Users,
    step: '03',
    title: 'Grow the records',
    text: 'Players carry their careers with them. Form, head-to-heads and leaderboards fill in match after match.',
  },
];

export default function LandingOverview() {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          What CrickTrack does
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
          One app for the whole cricket season
        </h2>
        <p className="mt-4 text-base leading-relaxed text-slate-400">
          Most clubs score on paper or in a spreadsheet, then lose the detail that makes the season
          interesting. CrickTrack keeps the detail: every ball is tagged once and reused everywhere,
          from the live scorecard on the day to the season stats at the end of it.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ Icon, step, title, text }) => (
          <div
            key={step}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 transition-colors hover:border-slate-600/70">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold tracking-widest text-slate-600">{step}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      <figure className="mt-12 overflow-hidden rounded-2xl border border-slate-700/50 shadow-xl shadow-black/30">
        <img
          src={TURF_IMAGE}
          alt="Club cricketer batting on a turf wicket"
          loading="lazy"
          className="h-56 w-full object-cover md:h-72"
        />
        <figcaption className="border-t border-slate-700/50 bg-slate-900/60 px-5 py-3 text-xs text-slate-400">
          Grassroots cricket, recorded properly, from the first ball of the season.
        </figcaption>
      </figure>
    </section>
  );
}