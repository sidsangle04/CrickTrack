import React, { useMemo, useState } from 'react';
import { User, Target, Flame, Activity, Percent } from 'lucide-react';
import DemoShell from '@/components/demo/DemoShell';
import DemoLockedAction from '@/components/demo/DemoLockedAction';
import WagonWheel from '@/components/analytics/WagonWheel';
import PitchHeatmap from '@/components/analytics/PitchHeatmap';
import { StatCard } from '@/components/analytics/StatCards';
import { DEMO_PLAYERS, DEMO_PLAYERS_MAP, DEMO_TEAMS_MAP, DEMO_DELIVERIES } from '@/lib/demoData';

const ROLE_LABEL = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  all_rounder: 'All-Rounder',
  wicket_keeper: 'Wicket Keeper',
};

const STYLE_LABEL = {
  right_hand: 'Right-hand bat',
  left_hand: 'Left-hand bat',
  none: '',
  right_arm_fast: 'Right-arm fast',
  right_arm_medium: 'Right-arm medium',
  right_arm_off_spin: 'Right-arm off spin',
  right_arm_leg_spin: 'Right-arm leg spin',
  left_arm_fast: 'Left-arm fast',
  left_arm_medium: 'Left-arm medium',
  left_arm_orthodox: 'Left-arm orthodox',
};

export default function DemoPlayerProfile() {
  const [tab, setTab] = useState('overview');

  const playerId = new URLSearchParams(window.location.search).get('playerId');
  const player = DEMO_PLAYERS_MAP[playerId] || DEMO_PLAYERS[0];
  const team = DEMO_TEAMS_MAP[player.team_id];

  const shots = useMemo(
    () => DEMO_DELIVERIES.filter((d) => d.striker_id === player.id),
    [player.id]
  );
  const bowled = useMemo(
    () => DEMO_DELIVERIES.filter((d) => d.bowler_id === player.id),
    [player.id]
  );

  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const battingStyle = STYLE_LABEL[player.batting_style];
  const bowlingStyle = STYLE_LABEL[player.bowling_style];

  return (
    <DemoShell
      title={player.name}
      subtitle={`${team?.name || ''} · ${ROLE_LABEL[player.role] || player.role}`}
      action={<DemoLockedAction label="Add to match" variant="ghost" className="!px-3 !py-2 shrink-0" />}
    >
      {/* Identity */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-5 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center text-xl font-bold text-emerald-400 shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-white truncate">{player.name}</h2>
          <p className="text-sm text-slate-400 truncate">
            {team?.name}
            {player.jersey_number ? ` · #${player.jersey_number}` : ''}
          </p>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[11px]">
              {ROLE_LABEL[player.role]}
            </span>
            {battingStyle && (
              <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[11px]">
                {battingStyle}
              </span>
            )}
            {bowlingStyle && (
              <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 text-[11px]">
                {bowlingStyle}
              </span>
            )}
            {player.is_captain && (
              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[11px] font-semibold">
                Captain
              </span>
            )}
            {player.is_wicket_keeper && (
              <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 text-[11px] font-semibold">
                Keeper
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'batting', label: 'Batting' },
          { key: 'bowling', label: 'Bowling' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === t.key ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <StatCard label="Matches" value={player.matches} />
            <StatCard label="Runs" value={player.runs} color="text-emerald-400" />
            <StatCard label="Average" value={player.average} />
            <StatCard label="Strike Rate" value={player.strike_rate} color="text-sky-400" />
            <StatCard label="Wickets" value={player.wickets} color="text-red-400" />
            <StatCard label="Economy" value={player.economy || '—'} color="text-amber-400" />
          </div>
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 space-y-2">
            {[
              { icon: User, label: 'Innings batted', value: player.innings },
              { icon: Flame, label: 'Highest score', value: player.hs },
              { icon: Target, label: 'Fifties / Hundreds', value: `${player.fifties} / ${player.hundreds}` },
              { icon: Activity, label: 'Best bowling', value: player.best },
              { icon: Percent, label: 'Overs bowled', value: player.overs_bowled },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-2 border-b border-slate-700/40 last:border-0">
                <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="flex-1 text-sm text-slate-400">{label}</span>
                <span className="text-sm font-semibold text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'batting' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <StatCard label="Runs" value={player.runs} color="text-emerald-400" />
            <StatCard label="Balls" value={player.balls} />
            <StatCard label="Fours" value={player.fours} color="text-sky-400" />
            <StatCard label="Sixes" value={player.sixes} color="text-amber-400" />
            <StatCard label="50s" value={player.fifties} />
            <StatCard label="100s" value={player.hundreds} />
          </div>
          <WagonWheel deliveries={shots} title="Wagon Wheel · shots in the demo match" />
        </div>
      )}

      {tab === 'bowling' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            <StatCard label="Wickets" value={player.wickets} color="text-red-400" />
            <StatCard label="Overs" value={player.overs_bowled} />
            <StatCard label="Economy" value={player.economy || '—'} color="text-amber-400" />
            <StatCard label="Runs conceded" value={player.runs_conceded} />
            <StatCard label="Best" value={player.best} color="text-emerald-400" />
          </div>
          {bowled.length > 0 ? (
            <PitchHeatmap deliveries={bowled} title="Pitch Map · deliveries in the demo match" />
          ) : (
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-6 text-center text-slate-500 text-sm">
              No bowling in the demo match
            </div>
          )}
        </div>
      )}
    </DemoShell>
  );
}