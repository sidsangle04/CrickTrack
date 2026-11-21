import React from 'react';
import {
  Flag, TrendingUp, Target, Timer, Flame, Zap, Award, Trophy, Crosshair, BarChart3, Radio,
} from 'lucide-react';
import StatTile from './StatTile';
import {
  ChartCard, RunsByTeamChart, TopPlayersChart, WinsPieChart, BoundariesChart, RunsPerMatchChart,
} from './StatsCharts';

export default function StatsOverview({ stats, onSelectPlayer }) {
  const { overview, charts } = stats;

  return (
    <div className="space-y-5">
      {overview.live_matches > 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5">
          <Radio className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200">
            {overview.live_matches} {overview.live_matches === 1 ? 'match is' : 'matches are'} still being
            scored. Leaderboards below only count completed matches.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatTile icon={Flag} label="Matches played" value={overview.matches} accent="emerald" />
        <StatTile icon={TrendingUp} label="Runs scored" value={overview.runs} accent="cyan" />
        <StatTile icon={Target} label="Wickets taken" value={overview.wickets} accent="rose" />
        <StatTile icon={Timer} label="Overs bowled" value={overview.overs} accent="slate" />
        <StatTile icon={BarChart3} label="Avg runs / match" value={overview.average_per_match ?? '—'} accent="violet" />
        <StatTile icon={Flame} label="Sixes" value={overview.sixes} accent="amber" />
        <StatTile icon={Zap} label="Fours" value={overview.fours} accent="cyan" />
        <StatTile
          icon={Award}
          label="Highest team score"
          value={overview.highest_team_score?.value || '—'}
          sub={overview.highest_team_score?.team}
          accent="emerald"
        />
        <StatTile
          icon={Trophy}
          label="Highest individual"
          value={overview.highest_individual?.value || '—'}
          sub={overview.highest_individual?.name}
          accent="amber"
          onClick={overview.highest_individual ? () => onSelectPlayer(overview.highest_individual.player_id) : undefined}
        />
        <StatTile
          icon={Crosshair}
          label="Best bowling"
          value={overview.best_bowling?.value || '—'}
          sub={overview.best_bowling?.name}
          accent="rose"
          onClick={overview.best_bowling ? () => onSelectPlayer(overview.best_bowling.player_id) : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Runs scored by each team">
          <RunsByTeamChart data={charts.runs_by_team} />
        </ChartCard>
        <ChartCard title="Runs scored per match" hint="completed matches, in date order">
          <RunsPerMatchChart data={charts.runs_per_match} />
        </ChartCard>
        <ChartCard title="Top 5 run scorers">
          <TopPlayersChart data={charts.top_run_scorers} dataKey="runs" color="#10b981" unit="runs" />
        </ChartCard>
        <ChartCard title="Top 5 wicket takers">
          <TopPlayersChart data={charts.top_wicket_takers} dataKey="wickets" color="#f59e0b" unit="wkts" />
        </ChartCard>
        <ChartCard title="Team win distribution">
          <WinsPieChart data={charts.wins} />
        </ChartCard>
        <ChartCard title="Fours and sixes" hint="cyan = fours · amber = sixes">
          <BoundariesChart data={charts.boundaries} />
        </ChartCard>
      </div>
    </div>
  );
}