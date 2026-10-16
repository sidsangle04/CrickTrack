import React, { useMemo, useState } from 'react';
import { Trophy, Target, Flame, Percent, BarChart3, Activity } from 'lucide-react';
import DemoShell from '@/components/demo/DemoShell';
import WormGraph from '@/components/analytics/WormGraph';
import WagonWheel from '@/components/analytics/WagonWheel';
import PitchHeatmap from '@/components/analytics/PitchHeatmap';
import { StatCard } from '@/components/analytics/StatCards';
import {
  DEMO_PLAYERS_MAP,
  DEMO_TEAMS_MAP,
  DEMO_INNINGS,
  DEMO_DELIVERIES,
  DEMO_MATCHES,
  DEMO_RUNS_LEADERS,
  DEMO_WICKET_LEADERS,
  DEMO_STRIKE_LEADERS,
} from '@/lib/demoData';

function LeaderCard({ icon: Icon, title, subtitle, rows, valueLabel, accent }) {
  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${accent}`} />
        <div>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-1">
        {rows.map((row, i) => (
          <div
            key={row.id}
            className="flex items-center gap-3 py-2 border-b border-slate-700/40 last:border-0"
          >
            <span className="w-5 text-xs font-bold text-slate-500">{i + 1}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-white truncate">{row.name}</span>
              <span className="block text-[11px] text-slate-500 truncate">
                {DEMO_TEAMS_MAP[row.team_id]?.name}
              </span>
            </span>
            <span className="text-right shrink-0">
              <span className="block text-sm font-bold text-white">{row.value}</span>
              <span className="block text-[10px] text-slate-500">{valueLabel}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DemoAnalytics() {
  const [view, setView] = useState('leaders');

  const featured = DEMO_MATCHES[0];
  const featuredInnings = useMemo(
    () => DEMO_INNINGS.filter((i) => i.match_id === featured.id),
    [featured.id]
  );
  const featuredDeliveries = useMemo(
    () => DEMO_DELIVERIES.filter((d) => d.match_id === featured.id),
    [featured.id]
  );
  const firstInnings = featuredInnings[0];
  const firstInningsDeliveries = useMemo(
    () => featuredDeliveries.filter((d) => d.innings_id === firstInnings?.id),
    [featuredDeliveries, firstInnings]
  );

  const stats = useMemo(() => {
    const runs = featuredDeliveries.reduce((a, d) => a + (d.runs_total || 0), 0);
    const fours = featuredDeliveries.filter((d) => d.runs_bat === 4).length;
    const sixes = featuredDeliveries.filter((d) => d.runs_bat === 6).length;
    const dots = featuredDeliveries.filter((d) => d.is_dot_ball).length;
    const wickets = featuredDeliveries.filter((d) => d.is_wicket).length;
    const boundaryPct = featuredDeliveries.length
      ? Math.round(((fours + sixes) / featuredDeliveries.length) * 100)
      : 0;
    return { runs, fours, sixes, dots, wickets, boundaryPct };
  }, [featuredDeliveries]);

  const topBatters = useMemo(() => {
    const agg = {};
    featuredDeliveries.forEach((d) => {
      if (!d.striker_id) return;
      agg[d.striker_id] = agg[d.striker_id] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
      agg[d.striker_id].runs += d.runs_bat || 0;
      agg[d.striker_id].balls += 1;
      if (d.runs_bat === 4) agg[d.striker_id].fours += 1;
      if (d.runs_bat === 6) agg[d.striker_id].sixes += 1;
    });
    return Object.entries(agg)
      .map(([id, s]) => ({ id, ...s, name: DEMO_PLAYERS_MAP[id]?.name || 'Player' }))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 3);
  }, [featuredDeliveries]);

  const topBowlers = useMemo(() => {
    const agg = {};
    featuredDeliveries.forEach((d) => {
      if (!d.bowler_id) return;
      agg[d.bowler_id] = agg[d.bowler_id] || { runs: 0, balls: 0, wickets: 0 };
      agg[d.bowler_id].runs += d.runs_total || 0;
      agg[d.bowler_id].balls += 1;
      if (d.is_wicket) agg[d.bowler_id].wickets += 1;
    });
    return Object.entries(agg)
      .map(([id, s]) => ({ id, ...s, name: DEMO_PLAYERS_MAP[id]?.name || 'Player' }))
      .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)
      .slice(0, 3);
  }, [featuredDeliveries]);

  const runsRows = DEMO_RUNS_LEADERS.map((p) => ({ id: p.id, name: p.name, team_id: p.team_id, value: p.runs }));
  const wicketRows = DEMO_WICKET_LEADERS.map((p) => ({ id: p.id, name: p.name, team_id: p.team_id, value: p.wickets }));
  const strikeRows = DEMO_STRIKE_LEADERS.map((p) => ({ id: p.id, name: p.name, team_id: p.team_id, value: p.strike_rate }));

  return (
    <DemoShell
      title="Analytics"
      subtitle="Leaderboards, match reports, wagon wheels and pitch maps from every scored ball"
    >
      {/* View switch */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'leaders', label: 'Leaderboards' },
          { key: 'match', label: 'Match Analysis' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              view === t.key ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'leaders' ? (
        <div className="grid gap-4 md:grid-cols-3">
          <LeaderCard
            icon={Trophy}
            title="Most Runs"
            subtitle="Career runs, all competitions"
            rows={runsRows}
            valueLabel="runs"
            accent="text-emerald-400"
          />
          <LeaderCard
            icon={Target}
            title="Most Wickets"
            subtitle="Career wickets, all competitions"
            rows={wicketRows}
            valueLabel="wkts"
            accent="text-red-400"
          />
          <LeaderCard
            icon={Flame}
            title="Best Strike Rate"
            subtitle="Minimum 250 career runs"
            rows={strikeRows}
            valueLabel="SR"
            accent="text-amber-400"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Match summary */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 p-5">
            <p className="text-xs text-slate-500 mb-2">
              {featured.venue} · {featured.date}
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-slate-400 truncate">{DEMO_TEAMS_MAP[featured.team1_id]?.name}</p>
                <p className="text-2xl font-bold text-white">
                  {featuredInnings[0]?.total_runs}/{featuredInnings[0]?.total_wickets}
                </p>
                <p className="text-xs text-slate-500">{featuredInnings[0]?.total_overs}.0 overs</p>
              </div>
              <span className="text-slate-600 text-sm font-semibold">vs</span>
              <div className="min-w-0 text-right">
                <p className="text-sm text-slate-400 truncate">{DEMO_TEAMS_MAP[featured.team2_id]?.name}</p>
                <p className="text-2xl font-bold text-white">
                  {featuredInnings[1]?.total_runs}/{featuredInnings[1]?.total_wickets}
                </p>
                <p className="text-xs text-slate-500">{featuredInnings[1]?.total_overs}.0 overs</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-emerald-400">{featured.result}</p>
          </div>

          {/* Innings numbers */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <StatCard label="Runs" value={stats.runs} />
            <StatCard label="Wickets" value={stats.wickets} color="text-red-400" />
            <StatCard label="Fours" value={stats.fours} color="text-emerald-400" />
            <StatCard label="Sixes" value={stats.sixes} color="text-amber-400" />
            <StatCard label="Dots" value={stats.dots} color="text-slate-300" />
            <StatCard label="Boundary %" value={`${stats.boundaryPct}%`} color="text-sky-400" />
          </div>

          <WormGraph
            innings={featuredInnings}
            deliveries={featuredDeliveries}
            teamsMap={DEMO_TEAMS_MAP}
            maxOvers={20}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <WagonWheel
              deliveries={firstInningsDeliveries}
              title={`Wagon Wheel · ${DEMO_TEAMS_MAP[firstInnings?.batting_team_id]?.short_name || ''} 1st innings`}
            />
            <PitchHeatmap
              deliveries={firstInningsDeliveries}
              title="Pitch Map · 1st innings"
            />
          </div>

          {/* Top performers */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Top run scorers
              </h3>
              <div className="space-y-2">
                {topBatters.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 text-white truncate">{b.name}</span>
                    <span className="text-slate-400 text-xs">
                      {b.fours}×4 · {b.sixes}×6
                    </span>
                    <span className="font-bold text-white w-16 text-right">
                      {b.runs} ({b.balls})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-red-400" />
                Top wicket takers
              </h3>
              <div className="space-y-2">
                {topBowlers.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 text-white truncate">{b.name}</span>
                    <span className="text-slate-400 text-xs">
                      {b.balls ? (b.runs / (b.balls / 6)).toFixed(1) : '0.0'} econ
                    </span>
                    <span className="font-bold text-white w-16 text-right">
                      {b.wickets}/{b.runs}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 flex items-center gap-2">
            <Percent className="w-3.5 h-3.5" />
            Every chart is built from the ball-by-ball data captured while scoring.
          </p>
        </div>
      )}
    </DemoShell>
  );
}