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

const BIDS = [
  { team: 'Riverside XI', color: '#10b981', amount: 420, leading: false },
  { team: 'North End CC', color: '#f59e0b', amount: 480, leading: true },
  { team: 'Old Mill Town', color: '#6366f1', amount: 460, leading: false },
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
            <figure className="mx-auto mb-5 max-w-[280px]">
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
            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Live bid · Gold tier
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  On the block
                </span>
              </div>

              <p className="mt-3 text-lg font-bold text-white">A. Whitfield</p>
              <p className="text-xs text-slate-400">All-rounder · right-hand bat · off spin</p>

              <div className="mt-5 space-y-2">
                {BIDS.map((bid) => (
                  <div
                    key={bid.team}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                      bid.leading
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-slate-700/60 bg-slate-800/40'
                    }`}>
                    <span className="flex items-center gap-2 text-xs font-medium text-slate-200">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: bid.color }}
                      />
                      {bid.team}
                    </span>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        bid.leading ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                      {bid.amount}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-700/60 pt-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Purse left · North End CC
                </span>
                <span className="text-sm font-bold text-white tabular-nums">1,520</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}