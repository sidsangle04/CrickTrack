import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area } from
'recharts';
import {
  TrendingUp,
  Target,
  Zap,
  Award,
  Loader2,
  Users,
  Download,
  FileText } from
'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Analytics() {
  const [selectedMatch, setSelectedMatch] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.filter({ status: 'completed' })
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: allBatterInnings = [] } = useQuery({
    queryKey: ['all-batter-analytics'],
    queryFn: () => base44.entities.BatterInnings.list()
  });

  const { data: allBowlerInnings = [] } = useQuery({
    queryKey: ['all-bowler-analytics'],
    queryFn: () => base44.entities.BowlerInnings.list()
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['all-deliveries-analytics'],
    queryFn: () => base44.entities.Delivery.filter({ is_voided: false })
  });

  const { data: allPartnerships = [] } = useQuery({
    queryKey: ['all-partnerships'],
    queryFn: () => base44.entities.Partnership.list()
  });

  const { data: allInnings = [] } = useQuery({
    queryKey: ['all-innings-analytics'],
    queryFn: () => base44.entities.Innings.list()
  });

  const teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
  const playersMap = allPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

  const filteredBatterInnings = allBatterInnings.filter((b) => {
    if (selectedMatch !== 'all' && b.match_id !== selectedMatch) return false;
    if (selectedTeam !== 'all') {
      const player = playersMap[b.player_id];
      if (player?.team_id !== selectedTeam) return false;
    }
    return true;
  });

  const filteredBowlerInnings = allBowlerInnings.filter((b) => {
    if (selectedMatch !== 'all' && b.match_id !== selectedMatch) return false;
    if (selectedTeam !== 'all') {
      const player = playersMap[b.player_id];
      if (player?.team_id !== selectedTeam) return false;
    }
    return true;
  });

  const playerRuns = {};
  filteredBatterInnings.forEach((b) => {
    if (!playerRuns[b.player_id]) {
      playerRuns[b.player_id] = { runs: 0, balls: 0, innings: 0, outs: 0, fours: 0, sixes: 0 };
    }
    playerRuns[b.player_id].runs += b.runs || 0;
    playerRuns[b.player_id].balls += b.balls_faced || 0;
    playerRuns[b.player_id].innings += 1;
    playerRuns[b.player_id].outs += b.is_out ? 1 : 0;
    playerRuns[b.player_id].fours += b.fours || 0;
    playerRuns[b.player_id].sixes += b.sixes || 0;
  });

  const topBatters = Object.entries(playerRuns).
  map(([playerId, stats]) => ({
    name: playersMap[playerId]?.name || 'Unknown',
    ...stats,
    average: stats.outs > 0 ? (stats.runs / stats.outs).toFixed(1) : stats.runs.toFixed(1),
    strikeRate: stats.balls > 0 ? (stats.runs / stats.balls * 100).toFixed(1) : '0.0'
  })).
  sort((a, b) => b.runs - a.runs).
  slice(0, 10);

  const playerWickets = {};
  filteredBowlerInnings.forEach((b) => {
    if (!playerWickets[b.player_id]) {
      playerWickets[b.player_id] = { wickets: 0, runs: 0, overs: 0, balls: 0, dots: 0 };
    }
    playerWickets[b.player_id].wickets += b.wickets || 0;
    playerWickets[b.player_id].runs += b.runs_conceded || 0;
    playerWickets[b.player_id].overs += b.overs || 0;
    playerWickets[b.player_id].balls += b.balls || 0;
    playerWickets[b.player_id].dots += b.dots || 0;
  });

  const topBowlers = Object.entries(playerWickets).
  map(([playerId, stats]) => ({
    name: playersMap[playerId]?.name || 'Unknown',
    ...stats,
    economy: stats.overs + stats.balls / 6 > 0 ?
    (stats.runs / (stats.overs + stats.balls / 6)).toFixed(2) :
    '0.00'
  })).
  sort((a, b) => b.wickets - a.wickets).
  slice(0, 10);

  const dismissalTypes = {};
  filteredBatterInnings.forEach((b) => {
    if (b.is_out && b.dismissal_type) {
      dismissalTypes[b.dismissal_type] = (dismissalTypes[b.dismissal_type] || 0) + 1;
    }
  });

  const dismissalData = Object.entries(dismissalTypes).map(([type, count]) => ({
    name: type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1),
    value: count
  }));

  const filteredDeliveries = allDeliveries.filter((d) => {
    if (selectedMatch !== 'all' && d.match_id !== selectedMatch) return false;
    return true;
  });

  const overRuns = {};
  filteredDeliveries.forEach((d) => {
    const over = d.over_number;
    if (!overRuns[over]) {
      overRuns[over] = { runs: 0, wickets: 0, balls: 0 };
    }
    overRuns[over].runs += d.runs_total || 0;
    overRuns[over].wickets += d.is_wicket ? 1 : 0;
    overRuns[over].balls += d.is_legal_delivery ? 1 : 0;
  });

  const runRateData = Object.entries(overRuns).
  map(([over, stats]) => ({
    over: parseInt(over) + 1,
    runs: stats.runs,
    wickets: stats.wickets
  })).
  sort((a, b) => a.over - b.over).
  slice(0, 20);

  const boundaryData = [
  { name: 'Fours', value: Object.values(playerRuns).reduce((sum, p) => sum + p.fours, 0) },
  { name: 'Sixes', value: Object.values(playerRuns).reduce((sum, p) => sum + p.sixes, 0) }];


  // Compute partnerships from deliveries if no stored partnerships
  const computedPartnerships = [];
  if (allPartnerships.length === 0 && filteredDeliveries.length > 0) {
    const inningsGroups = {};
    filteredDeliveries.forEach((d) => {
      if (!inningsGroups[d.innings_id]) inningsGroups[d.innings_id] = [];
      inningsGroups[d.innings_id].push(d);
    });

    Object.entries(inningsGroups).forEach(([inningsId, deliveries]) => {
      const sorted = deliveries.sort((a, b) => {
        if (a.over_number !== b.over_number) return a.over_number - b.over_number;
        return (a.delivery_number || 0) - (b.delivery_number || 0);
      });

      let currentPartnership = null;
      sorted.forEach((d) => {
        const pairKey = [d.striker_id, d.non_striker_id].sort().join('-');

        if (!currentPartnership || currentPartnership.pairKey !== pairKey) {
          if (currentPartnership) computedPartnerships.push(currentPartnership);
          currentPartnership = {
            pairKey,
            innings_id: inningsId,
            match_id: d.match_id,
            batter1_id: d.striker_id,
            batter2_id: d.non_striker_id,
            runs: 0,
            balls: 0,
            batter1_runs: 0,
            batter2_runs: 0
          };
        }

        currentPartnership.runs += d.runs_total || 0;
        currentPartnership.balls += d.is_legal_delivery ? 1 : 0;
        if (d.striker_id === currentPartnership.batter1_id) {
          currentPartnership.batter1_runs += d.runs_bat || 0;
        } else {
          currentPartnership.batter2_runs += d.runs_bat || 0;
        }
      });
      if (currentPartnership) computedPartnerships.push(currentPartnership);
    });
  }

  const partnerships = allPartnerships.length > 0 ? allPartnerships : computedPartnerships;

  const filteredPartnerships = partnerships.filter((p) => {
    if (selectedMatch !== 'all' && p.match_id !== selectedMatch) return false;
    return true;
  });

  const topPartnerships = filteredPartnerships.
  map((p) => ({
    ...p,
    batter1Name: playersMap[p.batter1_id]?.name || 'Unknown',
    batter2Name: playersMap[p.batter2_id]?.name || 'Unknown',
    runRate: p.balls > 0 ? (p.runs / p.balls * 6).toFixed(2) : '0.00'
  })).
  sort((a, b) => b.runs - a.runs).
  slice(0, 10);

  const exportCSV = () => {
    let csv = 'CRICKET ANALYTICS REPORT\n\n';

    csv += 'BATTING LEADERBOARD\n';
    csv += '#,Player,Innings,Runs,Average,Strike Rate,4s,6s\n';
    topBatters.forEach((p, i) => {
      csv += `${i+1},${p.name},${p.innings},${p.runs},${p.average},${p.strikeRate},${p.fours},${p.sixes}\n`;
    });

    csv += '\nBOWLING LEADERBOARD\n';
    csv += '#,Player,Wickets,Runs,Economy,Dots\n';
    topBowlers.forEach((p, i) => {
      csv += `${i+1},${p.name},${p.wickets},${p.runs},${p.economy},${p.dots}\n`;
    });

    csv += '\nDISMISSAL TYPES\n';
    csv += 'Type,Count\n';
    dismissalData.forEach(d => { csv += `${d.name},${d.value}\n`; });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cricket_analytics.csv';
    a.click();
  };

  if (matchesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>);

  }

  return (
    <div className="bg-transparent text-slate-50 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-slate-400 text-sm">Performance insights and statistics</p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Select value={selectedMatch} onValueChange={setSelectedMatch}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
            <SelectValue placeholder="All Matches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matches</SelectItem>
            {matches.map((m) =>
            <SelectItem key={m.id} value={m.id}>
                {teamsMap[m.team1_id]?.short_name} vs {teamsMap[m.team2_id]?.short_name}
              </SelectItem>
            )}
          </SelectContent>
        </Select>

        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((t) =>
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Runs</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {Object.values(playerRuns).reduce((sum, p) => sum + p.runs, 0)}
          </span>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-slate-400 text-sm">Total Wickets</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {Object.values(playerWickets).reduce((sum, p) => sum + p.wickets, 0)}
          </span>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-slate-400 text-sm">Boundaries</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {boundaryData.reduce((sum, b) => sum + b.value, 0)}
          </span>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-slate-400 text-sm">Matches</span>
          </div>
          <span className="text-2xl font-bold text-white">
            {selectedMatch === 'all' ? matches.length : 1}
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="font-semibold text-white mb-4">Top Run Scorers</h3>
          {topBatters.length > 0 ?
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topBatters.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }} />

                <Bar dataKey="runs" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer> :

          <div className="h-64 flex items-center justify-center text-slate-500">No data available</div>
          }
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="font-semibold text-white mb-4">Top Wicket Takers</h3>
          {topBowlers.length > 0 ?
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topBowlers.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={100} tick={{ fontSize: 12 }} />
                <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }} />

                <Bar dataKey="wickets" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer> :

          <div className="h-64 flex items-center justify-center text-slate-500">No data available</div>
          }
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="font-semibold text-white mb-4">Runs per Over (Average)</h3>
          {runRateData.length > 0 ?
          <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={runRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="over" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }} />

                <Area type="monotone" dataKey="runs" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer> :

          <div className="h-64 flex items-center justify-center text-slate-500">No data available</div>
          }
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="font-semibold text-white mb-4">Dismissal Types</h3>
          {dismissalData.length > 0 ?
          <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                data={dismissalData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>

                  {dismissalData.map((entry, index) =>
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                )}
                </Pie>
                <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }} />

              </PieChart>
            </ResponsiveContainer> :

          <div className="h-64 flex items-center justify-center text-slate-500">No data available</div>
          }
        </div>
      </div>

      {/* Partnership Section */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-700/50 flex items-center gap-3">
          <Users className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Top Partnerships</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Partnership</th>
                <th className="text-right p-3">Runs</th>
                <th className="text-right p-3">Balls</th>
                <th className="text-right p-3">RR</th>
              </tr>
            </thead>
            <tbody>
              {topPartnerships.map((p, idx) =>
              <tr key={idx} className="border-b border-slate-700/30">
                  <td className="p-3 text-slate-500">{idx + 1}</td>
                  <td className="p-3">
                    <div className="font-medium text-white">{p.batter1Name} & {p.batter2Name}</div>
                    <div className="text-xs text-slate-500">
                      {p.batter1_runs || 0}* / {p.batter2_runs || 0}*
                    </div>
                  </td>
                  <td className="text-right p-3 font-semibold text-cyan-400">{p.runs}</td>
                  <td className="text-right p-3 text-slate-400">{p.balls}</td>
                  <td className="text-right p-3 text-slate-400">{p.runRate}</td>
                </tr>
              )}
              {topPartnerships.length === 0 &&
              <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No partnership data</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="font-semibold text-white">Batting Leaderboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Player</th>
                  <th className="text-right p-3">Runs</th>
                  <th className="text-right p-3">Avg</th>
                  <th className="text-right p-3">SR</th>
                </tr>
              </thead>
              <tbody>
                {topBatters.slice(0, 10).map((player, idx) =>
                <tr key={idx} className="border-b border-slate-700/30">
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium text-white">{player.name}</td>
                    <td className="text-right p-3 font-semibold text-emerald-400">{player.runs}</td>
                    <td className="text-right p-3 text-slate-400">{player.average}</td>
                    <td className="text-right p-3 text-slate-400">{player.strikeRate}</td>
                  </tr>
                )}
                {topBatters.length === 0 &&
                <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No batting data</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="font-semibold text-white">Bowling Leaderboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Player</th>
                  <th className="text-right p-3">Wkts</th>
                  <th className="text-right p-3">Runs</th>
                  <th className="text-right p-3">Econ</th>
                </tr>
              </thead>
              <tbody>
                {topBowlers.slice(0, 10).map((player, idx) =>
                <tr key={idx} className="border-b border-slate-700/30">
                    <td className="p-3 text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium text-white">{player.name}</td>
                    <td className="text-right p-3 font-semibold text-red-400">{player.wickets}</td>
                    <td className="text-right p-3 text-slate-400">{player.runs}</td>
                    <td className="text-right p-3 text-slate-400">{player.economy}</td>
                  </tr>
                )}
                {topBowlers.length === 0 &&
                <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No bowling data</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}