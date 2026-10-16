import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart3, Calendar, PlusCircle, Trophy, Upload, UserRound } from 'lucide-react';

const ACTIONS = [
  {
    page: 'MatchSetup',
    Icon: PlusCircle,
    title: 'New match',
    text: 'Set up a game and start scoring',
    accent: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
  },
  {
    page: 'Home',
    Icon: Calendar,
    title: 'Matches',
    text: 'Fixtures, results and scorecards',
    accent: 'border-sky-500/30 bg-sky-500/15 text-sky-400',
  },
  {
    page: 'Analytics',
    Icon: BarChart3,
    title: 'Analytics',
    text: 'Leaderboards and performance trends',
    accent: 'border-purple-500/30 bg-purple-500/15 text-purple-400',
  },
  {
    page: 'Players',
    Icon: UserRound,
    title: 'Players',
    text: 'Profiles and head-to-head records',
    accent: 'border-amber-500/30 bg-amber-500/15 text-amber-400',
  },
  {
    page: 'Tournaments',
    Icon: Trophy,
    title: 'Tournaments',
    text: 'Leagues, brackets and champions',
    accent: 'border-rose-500/30 bg-rose-500/15 text-rose-400',
  },
  {
    page: 'ImportMatch',
    Icon: Upload,
    title: 'Import',
    text: 'Bring in Play-Cricket scorecards',
    accent: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-400',
  },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Jump back in
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map(({ page, Icon, title, text, accent }) => (
          <Link
            key={title}
            to={createPageUrl(page)}
            className="group flex items-start gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 transition-all hover:border-slate-600 hover:bg-slate-800">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${accent}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">{title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{text}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}