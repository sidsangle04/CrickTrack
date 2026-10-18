import React from 'react';
import { CircleDot, BarChart3, Users } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import AccordionBlock from '@/components/landing/AccordionBlock';

const STEPS = [
  {
    key: 'score',
    Icon: CircleDot,
    title: '01 — Score the game',
    text: 'Pick your teams, choose the format and score from the boundary. Runs, wickets, extras, over limits and super overs are all handled.',
  },
  {
    key: 'numbers',
    Icon: BarChart3,
    title: '02 — Watch the numbers build',
    text: 'Every delivery feeds the scorecard, worm graph, win probability and shot maps. Nothing to export, nothing to re-type.',
  },
  {
    key: 'records',
    Icon: Users,
    title: '03 — Grow the records',
    text: 'Players carry their careers with them. Form, head-to-heads and leaderboards fill in match after match.',
  },
];

export default function LandingOverview() {
  return (
    <section id="overview" className="scroll-mt-24 py-12 md:py-16">
      <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            What CrickTrack does
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            One app for the whole cricket season
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400">
            Most clubs score on paper or in a spreadsheet, then lose the detail that makes the
            season interesting. CrickTrack keeps the detail: every ball is tagged once and reused
            everywhere, from the live scorecard on the day to the season stats at the end of it.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <AccordionBlock items={STEPS} />
        </Reveal>
      </div>
    </section>
  );
}