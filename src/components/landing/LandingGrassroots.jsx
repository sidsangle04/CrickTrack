import React from 'react';
import { Home, Users, Trophy } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import AccordionBlock from '@/components/landing/AccordionBlock';

const HUDDLE_IMAGE =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/67738f24f_generated_9d0d6dd6.png';

const PLACES = [
  {
    key: 'yards',
    Icon: Home,
    title: 'Yards, lanes and streets',
    text: 'A bat, a ball and a set of stumps is enough. Score it once and the numbers are yours to keep.',
  },
  {
    key: 'clubs',
    Icon: Users,
    title: 'Clubs and league sides',
    text: 'Full scorecards, over limits and seasons of records for the teams that play every weekend.',
  },
  {
    key: 'schools',
    Icon: Trophy,
    title: 'Schools and youth cricket',
    text: 'Every young player gets a name, a score and a reason to come back next week.',
  },
];

const STORY = [
  {
    key: 'who',
    title: 'Who it is for',
    text: "You don't need a stadium, a sponsor or a league to want your numbers kept. CrickTrack is for the kids playing in a yard, the girls in the park, the office team, the village club and the county side alike.",
  },
  {
    key: 'dream',
    title: 'The same dream, wherever you play',
    text: 'Because they all share the same dream, the one that starts the very first time someone picks up a bat: to see their name next to a score. A top score, a best spell, a season to look back on. That record shouldn\'t only exist for the players who reached the big grounds.',
  },
  {
    key: 'worth',
    title: 'Why it matters',
    text: 'Not everyone improves just by seeing the numbers. But everyone who starts on a road or in a yard deserves to see them.',
  },
];

export default function LandingGrassroots() {
  return (
    <section className="py-12 md:py-16">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal className="order-2 lg:order-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            For every kind of cricket
          </span>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl">
            It started in a yard.
            <span className="block text-emerald-400">The scorecard still counts.</span>
          </h2>

          <p className="mt-5 text-base leading-relaxed text-slate-400">
            You don't need a stadium, a sponsor or a league to want your numbers kept. CrickTrack is
            for the kids playing in a yard, the girls in the park, the office team, the village club
            and the county side alike.
          </p>

          <div className="mt-6">
            <AccordionBlock items={STORY} />
          </div>
        </Reveal>

        <Reveal delay={0.12} className="order-1 lg:order-2">
          <figure className="overflow-hidden rounded-2xl border border-slate-700/50 shadow-xl shadow-black/30">
            <img
              src={HUDDLE_IMAGE}
              alt="A grassroots girls' cricket team celebrating together in a huddle"
              loading="lazy"
              className="h-64 w-full object-cover object-center md:h-80"
            />
            <figcaption className="border-t border-slate-700/50 bg-slate-900/60 px-5 py-3 text-xs text-slate-400">
              The first scorecard is the one you remember.
            </figcaption>
          </figure>
        </Reveal>
      </div>

      <div className="mt-10">
        <AccordionBlock items={PLACES} />
      </div>
    </section>
  );
}