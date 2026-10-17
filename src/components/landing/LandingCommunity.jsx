import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users, Trophy } from 'lucide-react';
import { createPageUrl } from '@/utils';
import Reveal from '@/components/landing/Reveal';
import HeroMedia from '@/components/landing/HeroMedia';

const COMMUNITY_VIDEO =
  'https://media.base44.com/videos/public/69cd6e7dda99287bd2ab65f2/e42ab9789_16254865_1920_1080_24fps.mp4';

const AUDIENCES = [
  {
    Icon: ShieldCheck,
    title: 'Club teams',
    text: 'Captains and scorers keep one shared record of the season instead of a stack of scorebooks.',
  },
  {
    Icon: Users,
    title: 'Weekend & casual cricket',
    text: 'Tape ball, tennis ball or a Sunday friendly: set your own overs, wide rules and squad size.',
  },
  {
    Icon: Trophy,
    title: 'Leagues & organisers',
    text: 'Fixtures, standings and knockouts stay in sync as results come in from the middle.',
  },
];

export default function LandingCommunity() {
  return (
    <section className="py-16 md:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-900">
        {/* The clip runs behind the whole section; the overlays keep the copy readable. */}
        <HeroMedia videoUrl={COMMUNITY_VIDEO} />

        <div className="relative p-8 md:p-12">
          <Reveal className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Made for the cricket community
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Every level of the game, on one platform
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              CrickTrack is used wherever cricket is played for the love of it, from a midweek
              tape-ball league to a full club season. Two separate scoring modes keep TURF and
              standard grounds apart, so each competition keeps its own teams, players and stats.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {AUDIENCES.map(({ Icon, title, text }, index) => (
              <Reveal
                key={title}
                delay={index * 0.1}
                className="rounded-2xl border border-slate-700/50 bg-slate-900/70 p-6 backdrop-blur-sm">
                <Icon className="h-5 w-5 text-emerald-400" />
                <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-slate-700/50 pt-8">
              <Link
                to={createPageUrl('Home')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.03] hover:shadow-emerald-500/40">
                Start scoring
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={createPageUrl('About')}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-6 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-slate-600 hover:text-white">
                About CrickTrack
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}