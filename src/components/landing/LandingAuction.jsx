import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Dices, Gavel, Trophy, Users } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';

const STEPS = [
  {
    Icon: Dices,
    title: 'Draw the icon players',
    text: 'Spin the wheel to hand each team its icon names before the bidding opens.',
  },
  {
    Icon: Gavel,
    title: 'Bid live, ball by ball',
    text: 'Purses, bid tiers and jump bids run on screen, with the squad limit enforced for you.',
  },
  {
    Icon: Users,
    title: 'Squads become fixtures',
    text: 'Sold players become real profiles, and adding a team later rebuilds the fixture list.',
  },
];

export default function LandingAuction() {
  return (
    <section id="auction" className="scroll-mt-24 py-12 md:py-16">
      <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-800/70 via-slate-900/60 to-slate-800/40">
        <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
              <Trophy className="h-3 w-3" />
              New · Tournament auction
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Pick the teams, run the auction, fill the squads
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              A full auction room built into CrickTrack: icon draws, live bidding, purse tracking and
              squad sheets that turn straight into tournament fixtures.
            </p>

            <ul className="mt-8 space-y-5">
              {STEPS.map((step) => (
                <li key={step.title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60">
                    <step.Icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{step.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              to="/Tournaments"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-emerald-400">
              Explore tournament auction
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <figure className="mx-auto max-w-[340px]">
              <img
                src="https://base44.app/api/apps/69cd6e7dda99287bd2ab65f2/files/mp/public/69cd6e7dda99287bd2ab65f2/181d20c3009de8be53bb82817cc9a55c_cricktrack-sold-card.png"
                alt="CrickTrack sold player card showing the winning team and price"
                className="w-full rounded-2xl border border-emerald-500/25 shadow-2xl"
                loading="lazy"
              />
              <figcaption className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Sold cards, ready to share
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}