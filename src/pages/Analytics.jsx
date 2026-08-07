import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ArrowLeft, Zap, TrendingUp, AlertTriangle, Users,
  ShieldAlert, BarChart2, Trophy, ChevronDown, ChevronRight
} from 'lucide-react';
import GroundMap from '../components/scoring/GroundMap';
import PartnershipCard from '../components/analytics/PartnershipCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Helpers ───────────────────────────────────────────────────────────────
function getTurfZone(x, y) {
  // Top of ground (y >= 0, wicket-keeper end) = Back (two halves); bottom (bowler end) = Front (three thirds)
  if (y >= 0) return x < 0 ? 'Back Left' : 'Back Right';
  if (x < -0.3) return 'Front Left';
  if (x > 0.3) return 'Front Right';
  return 'Front Center';
}

const TURF_ZONES = ['Front Left', 'Front Center', 'Front Right', 'Back Left', 'Back Right'];
const LENGTH_ZONES_ORDER = ['full_toss', 'yorker', 'full', 'good_length', 'good', 'back_of_length', 'short', 'bouncer'];
// Normalize legacy human-readable length values to enum format
const LENGTH_NORMALIZE = {
  'Full Toss': 'full_toss', 'Yorker': 'yorker', 'Full': 'full',
  'Good Length': 'good_length', 'Good': 'good', 'Back of Length': 'back_of_length',
  'Short': 'short', 'Bouncer': 'bouncer'
};
const LENGTH_LABEL = {
  full_toss: 'Full Toss', yorker: 'Yorker', full: 'Full', good_length: 'Good Length',
  good: 'Good', back_of_length: 'Back of Length', short: 'Short', bouncer: 'Bouncer'
};
const DISMISSAL_LABEL = {
  bowled: 'Bowled', caught: 'Caught', lbw: 'LBW', run_out: 'Run Out',
  stumped: 'Stumped', hit_wicket: 'Hit Wicket', retired_hurt: 'Retired Hurt',
  retired_out: 'Retired Out', obstructing_field: 'Obstructing', handled_ball: 'Handled Ball'
};
const DISMISSAL_COLOR = {
  bowled: 'text-red-400', caught: 'text-orange-400', lbw: 'text-amber-400',
  run_out: 'text-purple-400', stumped: 'text-pink-400',
};

const RUN_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '0', label: '0' }, { key: '1', label: '1' },
  { key: '2', label: '2' }, { key: '3', label: '3' },
  { key: '4', label: '4' }, { key: '6', label: '6' },
  { key: 'W', label: 'W' },
];

// ── Small UI pieces ───────────────────────────────────────────────────────
function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

function InsightCard({ icon: Icon, title, value, color }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xs text-slate-400">{title}</div>
        <div className="text-sm font-semibold text-white">{value || '—'}</div>
      </div>
    </div>
  );
}

// ── Heatmap overlay ───────────────────────────────────────────────────────
function HeatmapOverlay({ deliveries, groundW, groundH }) {
  const zoneCounts = {};
  TURF_ZONES.forEach(z => { zoneCounts[z] = 0; });
  deliveries.forEach(d => {
    if (d.shot_x == null || d.shot_y == null) return;
    const zone = getTurfZone(d.shot_x, d.shot_y);
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });
  const max = Math.max(...Object.values(zoneCounts), 1);
  const zoneRects = {
    'Back Left':    { x: 0,    y: 0,   w: 0.5,  h: 0.5 },
    'Back Right':   { x: 0.5,  y: 0,   w: 0.5,  h: 0.5 },
    'Front Left':   { x: 0,    y: 0.5, w: 0.34, h: 0.5 },
    'Front Center': { x: 0.34, y: 0.5, w: 0.32, h: 0.5 },
    'Front Right':  { x: 0.66, y: 0.5, w: 0.34, h: 0.5 },
  };
  const getHeatColor = (norm) => {
    if (norm < 0.001) return 'rgba(59,130,246,0.05)';
    if (norm < 0.25) return `rgba(59,130,246,${0.15 + norm * 0.6})`;
    if (norm < 0.6) return `rgba(234,179,8,${0.3 + norm * 0.4})`;
    return `rgba(239,68,68,${0.4 + norm * 0.5})`;
  };
  const pad = 12;
  return (
    <>
      {TURF_ZONES.map(zone => {
        const r = zoneRects[zone];
        return (
          <rect key={zone} x={pad + r.x * groundW} y={pad + r.y * groundH}
            width={r.w * groundW} height={r.h * groundH}
            fill={getHeatColor(zoneCounts[zone] / max)} rx="2" />
        );
      })}
      {TURF_ZONES.map(zone => {
        const r = zoneRects[zone];
        const lx = pad + (r.x + r.w / 2) * groundW;
        const ly = pad + (r.y + r.h / 2) * groundH;
        return (
          <g key={`l-${zone}`}>
            <text x={lx} y={ly - 7} textAnchor="middle" fill="white" fontSize="8" opacity="0.8">{zone}</text>
            <text x={lx} y={ly + 7} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity="0.95">{zoneCounts[zone]}</text>
          </g>
        );
      })}
    </>
  );
}

function GroundMapWithHeatmap({ shots, deliveries, showHeatmap, size }) {
  const W = Math.round(size * 0.72), H = size, pad = 12;
  const gW = W - pad * 2, gH = H - pad * 2;
  const cx = W / 2, cy = H / 2;
  const pitchW = gW * 0.13, pitchH = gH * 0.44;
  const pitchX = cx - pitchW / 2, pitchY = cy - pitchH / 2;
  const so = [-pitchW * 0.32, 0, pitchW * 0.32];

  if (!showHeatmap) return <GroundMap shots={shots} size={size} />;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="select-none">
      <rect x={0} y={0} width={W} height={H} fill="#0d1f0d" rx="6" />
      <rect x={pad} y={pad} width={gW} height={gH} fill="#15803d" rx="3" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={pad} y={pad + i * gH / 8} width={gW} height={gH / 8}
          fill={i % 2 === 0 ? '#166534' : '#15803d'} opacity="0.5" />
      ))}
      <HeatmapOverlay deliveries={deliveries} groundW={gW} groundH={gH} />
      <rect x={pad + 3} y={pad + 3} width={gW - 6} height={gH - 6} fill="none" stroke="white" strokeWidth="1.8" rx="2" />
      <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH} fill="#78350f" stroke="#d97706" strokeWidth="1" rx="2" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.1} x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.1} stroke="white" strokeWidth="1" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.9} x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.9} stroke="white" strokeWidth="1" />
      {so.map((off, i) => (
        <g key={i}>
          <line x1={cx + off} y1={pitchY + pitchH * 0.08} x2={cx + off} y2={pitchY - pitchH * 0.06} stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
          <line x1={cx + off} y1={pitchY + pitchH * 0.92} x2={cx + off} y2={pitchY + pitchH * 1.06} stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LEADERBOARDS TAB
// ══════════════════════════════════════════════════════════════════════════
function LeaderboardsTab({ allPlayers, teams, allBatterInnings, allBowlerInnings, allPartnerships }) {
  const playersMap = useMemo(() => allPlayers.reduce((a, p) => ({ ...a, [p.id]: p }), {}), [allPlayers]);
  const teamsMap = useMemo(() => teams.reduce((a, t) => ({ ...a, [t.id]: t }), {}), [teams]);

  // Batting leaderboard
  const battingStats = useMemo(() => {
    const map = {};
    allBatterInnings.forEach(b => {
      if (!map[b.player_id]) map[b.player_id] = { runs: 0, balls: 0, fours: 0, sixes: 0, innings: 0, outs: 0 };
      map[b.player_id].runs += b.runs || 0;
      map[b.player_id].balls += b.balls_faced || 0;
      map[b.player_id].fours += b.fours || 0;
      map[b.player_id].sixes += b.sixes || 0;
      if (b.status !== 'yet_to_bat') map[b.player_id].innings++;
      if (b.is_out) map[b.player_id].outs++;
    });
    return Object.entries(map)
      .map(([pid, s]) => ({ pid, ...s, avg: s.outs > 0 ? (s.runs / s.outs).toFixed(1) : s.runs > 0 ? '∞' : '0.0', sr: s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(1) : '0.0' }))
      .sort((a, b) => b.runs - a.runs);
  }, [allBatterInnings]);

  // Bowling leaderboard
  const bowlingStats = useMemo(() => {
    const map = {};
    allBowlerInnings.forEach(b => {
      if (!map[b.player_id]) map[b.player_id] = { wickets: 0, runs: 0, balls: 0, maidens: 0 };
      map[b.player_id].wickets += b.wickets || 0;
      map[b.player_id].runs += b.runs_conceded || 0;
      map[b.player_id].balls += b.balls || 0;
      map[b.player_id].maidens += b.maidens || 0;
    });
    return Object.entries(map)
      .map(([pid, s]) => {
        const oversNum = Math.floor(s.balls / 6);
        const ballsRem = s.balls % 6;
        const oversDisplay = `${oversNum}.${ballsRem}`;
        const economy = s.balls > 0 ? (s.runs / (s.balls / 6)).toFixed(2) : '0.00';
        return { pid, ...s, overs: oversDisplay, economy };
      })
      .sort((a, b) => b.wickets - a.wickets || parseFloat(a.economy) - parseFloat(b.economy));
  }, [allBowlerInnings]);

  // Top partnerships
  const topPartnerships = useMemo(() =>
    [...allPartnerships].sort((a, b) => b.runs - a.runs).slice(0, 5),
    [allPartnerships]
  );

  return (
    <div className="space-y-6">
      {/* Batting Leaderboard */}
      <div>
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Batting Leaderboard
        </p>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-2.5 text-slate-400">#</th>
                  <th className="text-left p-2.5 text-slate-400">Player</th>
                  <th className="text-right p-2.5 text-slate-400">Inn</th>
                  <th className="text-right p-2.5 text-slate-400">Runs</th>
                  <th className="text-right p-2.5 text-slate-400">Avg</th>
                  <th className="text-right p-2.5 text-slate-400">SR</th>
                  <th className="text-right p-2.5 text-slate-400">4s</th>
                  <th className="text-right p-2.5 text-slate-400">6s</th>
                </tr>
              </thead>
              <tbody>
                {battingStats.length === 0 ? (
                  <tr><td colSpan={8} className="p-4 text-center text-slate-500">No data</td></tr>
                ) : battingStats.map((s, i) => {
                  const player = playersMap[s.pid];
                  const team = teamsMap[player?.team_id];
                  return (
                    <tr key={s.pid} className="border-b border-slate-700/30 last:border-0">
                      <td className="p-2.5 text-slate-500">{i + 1}</td>
                      <td className="p-2.5">
                        <div className="text-white font-medium">{player?.name || 'Unknown'}</div>
                        {team && <div className="text-slate-500" style={{ color: team.primary_color || undefined }}>{team.short_name}</div>}
                      </td>
                      <td className="p-2.5 text-right text-slate-400">{s.innings}</td>
                      <td className="p-2.5 text-right text-emerald-400 font-bold">{s.runs}</td>
                      <td className="p-2.5 text-right text-slate-300">{s.avg}</td>
                      <td className="p-2.5 text-right text-amber-400">{s.sr}</td>
                      <td className="p-2.5 text-right text-slate-400">{s.fours}</td>
                      <td className="p-2.5 text-right text-slate-400">{s.sixes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bowling Leaderboard */}
      <div>
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-blue-400" /> Bowling Leaderboard
        </p>
        <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-2.5 text-slate-400">#</th>
                  <th className="text-left p-2.5 text-slate-400">Player</th>
                  <th className="text-right p-2.5 text-slate-400">Ov</th>
                  <th className="text-right p-2.5 text-slate-400">W</th>
                  <th className="text-right p-2.5 text-slate-400">Runs</th>
                  <th className="text-right p-2.5 text-slate-400">Econ</th>
                  <th className="text-right p-2.5 text-slate-400">M</th>
                </tr>
              </thead>
              <tbody>
                {bowlingStats.length === 0 ? (
                  <tr><td colSpan={7} className="p-4 text-center text-slate-500">No data</td></tr>
                ) : bowlingStats.map((s, i) => {
                  const player = playersMap[s.pid];
                  const team = teamsMap[player?.team_id];
                  return (
                    <tr key={s.pid} className="border-b border-slate-700/30 last:border-0">
                      <td className="p-2.5 text-slate-500">{i + 1}</td>
                      <td className="p-2.5">
                        <div className="text-white font-medium">{player?.name || 'Unknown'}</div>
                        {team && <div className="text-slate-500">{team.short_name}</div>}
                      </td>
                      <td className="p-2.5 text-right text-slate-400">{s.overs}</td>
                      <td className="p-2.5 text-right text-red-400 font-bold">{s.wickets}</td>
                      <td className="p-2.5 text-right text-slate-300">{s.runs}</td>
                      <td className="p-2.5 text-right text-amber-400">{s.economy}</td>
                      <td className="p-2.5 text-right text-slate-400">{s.maidens}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Partnerships */}
      <div>
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-emerald-400" /> Top Partnerships
        </p>
        {topPartnerships.length === 0 ? (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">No data</div>
        ) : (
          <div className="space-y-2">
            {topPartnerships.map((p, i) => (
              <PartnershipCard key={p.id} partnership={p} playersMap={playersMap} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PLAYER ANALYSIS TAB
// ══════════════════════════════════════════════════════════════════════════
function PlayerAnalysisTab({ allPlayers, teams, playersMap, teamsMap }) {
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [teamExpanded, setTeamExpanded] = useState({});

  // Players sorted by team
  const playersByTeam = useMemo(() => {
    const map = {};
    teams.forEach(t => { map[t.id] = []; });
    allPlayers.forEach(p => {
      if (map[p.team_id]) map[p.team_id].push(p);
    });
    return map;
  }, [allPlayers, teams]);

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['deliveries-analysis', selectedPlayerId],
    queryFn: () => selectedPlayerId
      ? base44.entities.Delivery.filter({ striker_id: selectedPlayerId })
      : base44.entities.Delivery.list('-created_date', 500),
  });

  const { data: bowlerDeliveries = [] } = useQuery({
    queryKey: ['bowler-deliveries-analysis', selectedPlayerId],
    queryFn: () => base44.entities.Delivery.filter({ bowler_id: selectedPlayerId }),
    enabled: !!selectedPlayerId,
  });

  const { data: allBatterInnings = [] } = useQuery({
    queryKey: ['batter-innings-analysis', selectedPlayerId],
    queryFn: () => selectedPlayerId
      ? base44.entities.BatterInnings.filter({ player_id: selectedPlayerId })
      : base44.entities.BatterInnings.list(),
  });

  const { data: allBowlerInningsPlayer = [] } = useQuery({
    queryKey: ['bowler-innings-analysis', selectedPlayerId],
    queryFn: () => selectedPlayerId
      ? base44.entities.BowlerInnings.filter({ player_id: selectedPlayerId })
      : base44.entities.BowlerInnings.list(),
  });

  const { data: allCatchDropDeliveries = [] } = useQuery({
    queryKey: ['catch-drops-analysis'],
    queryFn: () => base44.entities.Delivery.filter({ is_catch_drop: true }),
  });

  const { data: matchesForDrops = [] } = useQuery({
    queryKey: ['matches-catchdrops'],
    queryFn: () => base44.entities.Match.list(),
  });
  const matchesMap = useMemo(() => matchesForDrops.reduce((a, m) => ({ ...a, [m.id]: m }), {}), [matchesForDrops]);

  const { data: playerPartnerships = [] } = useQuery({
    queryKey: ['partnerships-analysis', selectedPlayerId],
    queryFn: () => selectedPlayerId
      ? base44.entities.Partnership.list()
      : base44.entities.Partnership.list(),
  });

  const toggleFilter = (key) => {
    if (key === 'all') { setActiveFilters(['all']); return; }
    setActiveFilters(prev => {
      const without = prev.filter(f => f !== 'all');
      if (without.includes(key)) {
        const next = without.filter(f => f !== key);
        return next.length === 0 ? ['all'] : next;
      }
      return [...without, key];
    });
  };

  const shotsWithZone = useMemo(() =>
    allDeliveries.filter(d => d.shot_x != null && d.shot_y != null)
      .map(d => ({ ...d, turf_zone: getTurfZone(d.shot_x, d.shot_y) })),
    [allDeliveries]
  );

  const filteredDeliveries = useMemo(() => {
    if (activeFilters.includes('all')) return shotsWithZone;
    return shotsWithZone.filter(d =>
      activeFilters.some(f => f === 'W' ? d.is_wicket : (d.runs_bat || 0) === parseInt(f))
    );
  }, [shotsWithZone, activeFilters]);

  const shots = filteredDeliveries.map(d => ({ x: d.shot_x, y: d.shot_y, runs: d.runs_bat || 0, is_wicket: d.is_wicket }));

  // Batting performance stats (NO wickets — that's bowling)
  const statsDeliveries = useMemo(() =>
    allDeliveries.filter(d => !d.is_voided && d.is_legal_delivery !== false), [allDeliveries]);

  const totalRuns = statsDeliveries.reduce((s, d) => s + (d.runs_bat || 0), 0);
  const ballsFaced = statsDeliveries.length;
  const strikeRate = ballsFaced > 0 ? ((totalRuns / ballsFaced) * 100).toFixed(1) : '0.0';
  const fours = statsDeliveries.filter(d => (d.runs_bat || 0) === 4).length;
  const sixes = statsDeliveries.filter(d => (d.runs_bat || 0) === 6).length;
  const timesOut = allBatterInnings.filter(b => b.is_out).length;
  const totalInnings = allBatterInnings.filter(b => b.status !== 'yet_to_bat').length;
  const average = timesOut > 0 ? (totalRuns / timesOut).toFixed(1) : totalRuns > 0 ? '∞' : '0.0';

  // Bowling performance stats
  const bowlingTotals = useMemo(() => {
    let wickets = 0, runs = 0, balls = 0, maidens = 0, dots = 0;
    allBowlerInningsPlayer.forEach(b => {
      wickets += b.wickets || 0;
      runs += b.runs_conceded || 0;
      balls += b.balls || 0;
    });
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    const oversDisplay = `${overs}.${remainingBalls}`;
    const economy = balls > 0 ? (runs / (balls / 6)).toFixed(2) : '0.00';
    const avg = wickets > 0 ? (runs / wickets).toFixed(1) : '—';
    return { wickets, runs, balls, maidens, dots, oversDisplay, economy, avg };
  }, [allBowlerInningsPlayer]);

  // Zone analysis
  const zoneCounts = useMemo(() => {
    const counts = {};
    TURF_ZONES.forEach(z => { counts[z] = { shots: 0, runs: 0 }; });
    shotsWithZone.forEach(d => {
      const z = d.turf_zone;
      if (counts[z]) { counts[z].shots++; counts[z].runs += d.runs_bat || 0; }
    });
    return counts;
  }, [shotsWithZone]);

  const strongZone = TURF_ZONES.reduce((a, b) => zoneCounts[a].shots >= zoneCounts[b].shots ? a : b, TURF_ZONES[0]);
  const weakZone = TURF_ZONES.reduce((a, b) => zoneCounts[a].shots <= zoneCounts[b].shots ? a : b, TURF_ZONES[0]);
  const mostRunsZone = TURF_ZONES.reduce((a, b) => zoneCounts[a].runs >= zoneCounts[b].runs ? a : b, TURF_ZONES[0]);

  // Wicket zone
  const wicketDeliveries = shotsWithZone.filter(d => d.is_wicket);
  const wicketZoneCounts = {};
  wicketDeliveries.forEach(d => { wicketZoneCounts[d.turf_zone] = (wicketZoneCounts[d.turf_zone] || 0) + 1; });
  const mostDangerousZone = Object.entries(wicketZoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Catch drops — use dedicated query for all catch drop deliveries
  const catchDrops = allCatchDropDeliveries;
  const dropsByFielder = {};
  catchDrops.forEach(d => { if (d.dropped_by) dropsByFielder[d.dropped_by] = (dropsByFielder[d.dropped_by] || 0) + 1; });

  // Partnerships involving selected player
  const relevantPartnerships = useMemo(() => {
    if (!selectedPlayerId) return [];
    return playerPartnerships
      .filter(p => p.batter1_id === selectedPlayerId || p.batter2_id === selectedPlayerId)
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5);
  }, [playerPartnerships, selectedPlayerId]);

  // Dismissals (from BatterInnings — correct source)
  const dismissalCounts = useMemo(() => {
    const counts = {};
    allBatterInnings.filter(b => b.is_out && b.dismissal_type).forEach(b => {
      counts[b.dismissal_type] = (counts[b.dismissal_type] || 0) + 1;
    });
    return counts;
  }, [allBatterInnings]);
  const totalDismissals = Object.values(dismissalCounts).reduce((s, v) => s + v, 0);

  // Batter pitch length stats (as striker)
  const pitchLengthStats = useMemo(() => {
    const stats = {};
    LENGTH_ZONES_ORDER.forEach(l => { stats[l] = { balls: 0, runs: 0, wickets: 0 }; });
    allDeliveries.filter(d => d.length && !d.is_voided && d.is_legal_delivery !== false).forEach(d => {
      const key = LENGTH_NORMALIZE[d.length] || d.length;
      if (stats[key]) {
        stats[key].balls++;
        stats[key].runs += d.runs_bat || 0;
        if (d.is_wicket) stats[key].wickets++;
      }
    });
    return stats;
  }, [allDeliveries]);

  // Bowler pitch length stats (as bowler)
  const bowlerPitchLengthStats = useMemo(() => {
    const stats = {};
    LENGTH_ZONES_ORDER.forEach(l => { stats[l] = { balls: 0, runs: 0, wickets: 0 }; });
    bowlerDeliveries.filter(d => d.length && !d.is_voided && d.is_legal_delivery !== false).forEach(d => {
      const key = LENGTH_NORMALIZE[d.length] || d.length;
      if (stats[key]) {
        stats[key].balls++;
        stats[key].runs += d.runs_total || 0;
        if (d.is_wicket) stats[key].wickets++;
      }
    });
    return stats;
  }, [bowlerDeliveries]);

  const weakLengths = LENGTH_ZONES_ORDER.filter(l => {
    const { balls, runs } = pitchLengthStats[l];
    return balls >= 3 && (runs / balls) * 100 < 100;
  });
  const strongLengths = LENGTH_ZONES_ORDER.filter(l => {
    const { balls, runs } = pitchLengthStats[l];
    return balls >= 3 && (runs / balls) * 100 > 150;
  });

  // Most dismissals by length
  const mostDismissalLength = LENGTH_ZONES_ORDER
    .filter(l => pitchLengthStats[l].wickets > 0)
    .sort((a, b) => pitchLengthStats[b].wickets - pitchLengthStats[a].wickets)[0];

  // Bowler's worst length (highest economy)
  const bowlerWorstLength = LENGTH_ZONES_ORDER
    .filter(l => bowlerPitchLengthStats[l].balls >= 3)
    .sort((a, b) => {
      const econA = bowlerPitchLengthStats[a].runs / (bowlerPitchLengthStats[a].balls / 6);
      const econB = bowlerPitchLengthStats[b].runs / (bowlerPitchLengthStats[b].balls / 6);
      return econB - econA;
    })[0];

  const hasBowlerPitchData = bowlerDeliveries.some(d => d.length);
  const hasBatterPitchData = allDeliveries.some(d => d.length);

  const selectedPlayer = selectedPlayerId ? playersMap[selectedPlayerId] : null;

  return (
    <div>
      {/* Team → Player selector */}
      <div className="mb-5">
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Select Player</p>

        {/* All Players chip */}
        <button
          onClick={() => { setSelectedPlayerId(null); setSelectedTeamId(null); }}
          className={`mb-2 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
            !selectedPlayerId ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          All Players
        </button>

        {/* Teams accordion */}
        <div className="space-y-1.5">
          {teams.map(team => {
            const teamPlayers = playersByTeam[team.id] || [];
            const isOpen = teamExpanded[team.id];
            return (
              <div key={team.id} className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => setTeamExpanded(prev => ({ ...prev, [team.id]: !prev[team.id] }))}
                  className="w-full flex items-center justify-between px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: team.primary_color || '#374151' }}>
                      {team.short_name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-white">{team.name}</span>
                    <span className="text-xs text-slate-500">({teamPlayers.length})</span>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5 border-t border-slate-700/50 pt-2">
                    {teamPlayers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPlayerId(p.id === selectedPlayerId ? null : p.id); setSelectedTeamId(team.id); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          selectedPlayerId === p.id
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedPlayer && (
          <div className="mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-medium">
            Showing: {selectedPlayer.name}
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full bg-slate-800/50 p-1 rounded-xl mb-5">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs">
            <BarChart2 className="w-3.5 h-3.5 mr-1" />Overview
          </TabsTrigger>
          <TabsTrigger value="weaknesses" className="flex-1 data-[state=active]:bg-red-500 data-[state=active]:text-white text-xs">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />Weaknesses
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          {/* Batting Performance */}
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Batting Performance</p>
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Runs" value={totalRuns} color="text-emerald-400" />
              <StatCard label="Innings" value={totalInnings} />
              <StatCard label="Average" value={average} color="text-amber-400" />
              <StatCard label="Balls" value={ballsFaced} />
              <StatCard label="Strike Rate" value={strikeRate} color="text-amber-400" />
              <StatCard label="4s / 6s" value={`${fours}/${sixes}`} color="text-emerald-400" />
            </div>
          </div>

          {/* Bowling Performance */}
          {(bowlingTotals.balls > 0 || bowlingTotals.wickets > 0) && (
            <div className="mb-5">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Bowling Performance</p>
              <div className="grid grid-cols-3 gap-2">
                <StatCard label="Wickets" value={bowlingTotals.wickets} color="text-red-400" />
                <StatCard label="Overs" value={bowlingTotals.oversDisplay} />
                <StatCard label="Economy" value={bowlingTotals.economy} color="text-amber-400" />
                <StatCard label="Runs Conceded" value={bowlingTotals.runs} />
                <StatCard label="Avg" value={bowlingTotals.avg} color="text-blue-400" />
                <StatCard label="Maidens" value={bowlingTotals.maidens} color="text-emerald-400" />
              </div>
            </div>
          )}

          {/* Wagon Wheel */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Wagon Wheel</p>
              <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
                <button onClick={() => setShowHeatmap(false)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!showHeatmap ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}>Shots</button>
                <button onClick={() => setShowHeatmap(true)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${showHeatmap ? 'bg-amber-500 text-white' : 'text-slate-400'}`}>Heatmap</button>
              </div>
            </div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {RUN_FILTERS.map(f => (
                <button key={f.key} onClick={() => toggleFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    activeFilters.includes(f.key)
                      ? f.key === 'W' ? 'bg-red-500 border-red-500 text-white'
                        : f.key === '4' ? 'bg-emerald-500 border-emerald-500 text-white'
                        : f.key === '6' ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-slate-500 border-slate-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}>{f.label}</button>
              ))}
            </div>
            <div className="flex justify-center">
              {shotsWithZone.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No shot data</div>
              ) : (
                <GroundMapWithHeatmap shots={shots} deliveries={filteredDeliveries} showHeatmap={showHeatmap} size={300} />
              )}
            </div>
            {!showHeatmap ? (
              <div className="flex gap-3 justify-center mt-3 flex-wrap text-xs">
                {[['bg-slate-500','Dot'],['bg-blue-400','1-3'],['bg-emerald-400','4'],['bg-amber-400','6'],['bg-red-400','W']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-slate-400"><span className={`w-2.5 h-2.5 rounded-full ${c}`}/>{l}</span>
                ))}
              </div>
            ) : (
              <div className="flex gap-3 justify-center mt-3 flex-wrap text-xs">
                {[['bg-blue-500','Low'],['bg-yellow-500','Medium'],['bg-red-500','High']].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-slate-400"><span className={`w-2.5 h-2.5 rounded-full ${c}`}/>{l}</span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Insights */}
          {shotsWithZone.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Quick Insights</p>
              <div className="grid gap-2">
                <InsightCard icon={Zap} title="Strong Zone" value={`${strongZone} (${zoneCounts[strongZone].shots} shots)`} color="bg-emerald-500/20 text-emerald-400" />
                <InsightCard icon={AlertTriangle} title="Least Active Zone" value={`${weakZone} (${zoneCounts[weakZone].shots} shots)`} color="bg-amber-500/20 text-amber-400" />
                <InsightCard icon={TrendingUp} title="Most Runs Zone" value={`${mostRunsZone} (${zoneCounts[mostRunsZone].runs} runs)`} color="bg-blue-500/20 text-blue-400" />
                {mostDangerousZone && <InsightCard icon={ShieldAlert} title="Wicket Zone" value={mostDangerousZone} color="bg-red-500/20 text-red-400" />}
              </div>
            </div>
          )}

          {/* Zone breakdown */}
          {shotsWithZone.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Zone Breakdown</p>
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left p-3 text-slate-400 text-xs">Zone</th>
                      <th className="text-right p-3 text-slate-400 text-xs">Shots</th>
                      <th className="text-right p-3 text-slate-400 text-xs">Runs</th>
                      <th className="text-right p-3 text-slate-400 text-xs">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TURF_ZONES.map(zone => {
                      const { shots: s, runs: r } = zoneCounts[zone];
                      return (
                        <tr key={zone} className="border-b border-slate-700/30 last:border-0">
                          <td className="p-3 text-white font-medium">{zone}</td>
                          <td className="p-3 text-right text-slate-300">{s}</td>
                          <td className="p-3 text-right text-emerald-400 font-semibold">{r}</td>
                          <td className="p-3 text-right text-slate-400">{s > 0 ? (r / s).toFixed(1) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Partnerships */}
          {selectedPlayerId && (
            <div className="mb-5">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Partnerships</p>
              {relevantPartnerships.length === 0 ? (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">No partnership data</div>
              ) : (
                <div className="space-y-2">
                  {relevantPartnerships.map((p, i) => (
                    <PartnershipCard key={p.id} partnership={p} playersMap={playersMap} rank={i + 1} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Catch Drops */}
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Catch Drops (Past Matches)</p>
            {catchDrops.length === 0 ? (
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">No dropped catches</div>
            ) : (
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700/50">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-400">{catchDrops.length}</div>
                    <div className="text-xs text-slate-400">Total Drops across all matches</div>
                  </div>
                </div>

                {Object.keys(dropsByFielder).length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">By Fielder</p>
                    {Object.entries(dropsByFielder).sort((a, b) => b[1] - a[1]).map(([pid, count]) => (
                      <div key={pid} className="flex justify-between items-center text-sm">
                        <span className="text-slate-300">{playersMap[pid]?.name || 'Unknown'}</span>
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">{count} drop{count > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Dropped Catch Log</p>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {[...catchDrops].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(d => {
                    const m = matchesMap[d.match_id];
                    const t1 = m ? teamsMap[m.team1_id]?.short_name : null;
                    const t2 = m ? teamsMap[m.team2_id]?.short_name : null;
                    return (
                      <div key={d.id} className="flex items-center gap-2 text-xs bg-slate-900/40 rounded-lg p-2.5 border border-slate-700/40">
                        <div className="w-12 text-slate-500 flex-shrink-0">{d.over_number}.{d.ball_in_over || ''}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-300 truncate">
                            <span className="text-white font-medium">{playersMap[d.striker_id]?.name || 'Unknown'}</span>
                            <span className="text-slate-500"> vs </span>
                            <span className="text-white font-medium">{playersMap[d.bowler_id]?.name || 'Unknown'}</span>
                          </div>
                          <div className="text-slate-500">
                            Dropped by <span className="text-red-400">{playersMap[d.dropped_by]?.name || 'Unknown'}</span>
                            {t1 && t2 ? ` · ${t1} vs ${t2}` : ''}
                            {d.runs_bat ? ` · ${d.runs_bat} run${d.runs_bat > 1 ? 's' : ''}` : ''}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* WEAKNESSES */}
        <TabsContent value="weaknesses">
          {/* Dismissal breakdown */}
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">How {selectedPlayer ? selectedPlayer.name : 'Players'} Got Out</p>
            {totalDismissals === 0 ? (
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">No dismissal data</div>
            ) : (
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-semibold text-white">{totalDismissals} Dismissals</span>
                </div>
                <div className="divide-y divide-slate-700/30">
                  {Object.entries(dismissalCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const pct = Math.round((count / totalDismissals) * 100);
                    const color = DISMISSAL_COLOR[type] || 'text-slate-300';
                    return (
                      <div key={type} className="px-3 py-2.5">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-sm font-medium ${color}`}>{DISMISSAL_LABEL[type] || type}</span>
                          <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Batter Pitch Zone Performance */}
          <div className="mb-5">
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Batter — Pitch Zone Performance</p>
            <div className="text-xs text-slate-500 mb-3 flex gap-3 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Weak (&lt;100 SR)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Average (100-150)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Strong (&gt;150 SR)</span>
            </div>
            {!hasBatterPitchData ? (
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">No pitch data recorded</div>
            ) : (
              <>
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left p-2.5 text-slate-400">Length</th>
                        <th className="text-right p-2.5 text-slate-400">Balls</th>
                        <th className="text-right p-2.5 text-slate-400">Runs</th>
                        <th className="text-right p-2.5 text-slate-400">SR</th>
                        <th className="text-right p-2.5 text-slate-400">W</th>
                      </tr>
                    </thead>
                    <tbody>
                      {LENGTH_ZONES_ORDER.filter(l => pitchLengthStats[l].balls > 0).map(l => {
                        const { balls, runs, wickets } = pitchLengthStats[l];
                        const sr = ((runs / balls) * 100).toFixed(1);
                        const srNum = parseFloat(sr);
                        const srColor = srNum < 100 ? 'text-red-400' : srNum > 150 ? 'text-emerald-400' : 'text-amber-400';
                        const isMostDismissals = l === mostDismissalLength;
                        const bgColor = isMostDismissals ? 'bg-red-500/10 border-l-2 border-red-500/60' : srNum < 100 ? 'bg-red-500/5' : '';
                        return (
                          <tr key={l} className={`border-b border-slate-700/30 last:border-0 ${bgColor}`}>
                            <td className="p-2.5">
                              <span className="text-white font-medium">{LENGTH_LABEL[l]}</span>
                              {isMostDismissals && <span className="ml-1.5 text-red-400 text-xs">⚠ Most dismissals</span>}
                            </td>
                            <td className="p-2.5 text-right text-slate-400">{balls}</td>
                            <td className="p-2.5 text-right text-slate-300">{runs}</td>
                            <td className={`p-2.5 text-right font-bold ${srColor}`}>{sr}</td>
                            <td className="p-2.5 text-right text-red-400 font-bold">{wickets > 0 ? wickets : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-2">
                  {mostDismissalLength && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-red-400 mb-0.5">Most Dismissals</div>
                        <div className="text-xs text-slate-300">{LENGTH_LABEL[mostDismissalLength]} — {pitchLengthStats[mostDismissalLength].wickets} wicket{pitchLengthStats[mostDismissalLength].wickets > 1 ? 's' : ''} at this length</div>
                      </div>
                    </div>
                  )}
                  {weakLengths.length > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 flex items-start gap-3">
                      <ShieldAlert className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-orange-400 mb-0.5">Low Strike Rate Lengths</div>
                        <div className="text-xs text-slate-300">{weakLengths.map(l => LENGTH_LABEL[l]).join(', ')} — SR below 100</div>
                      </div>
                    </div>
                  )}
                  {strongLengths.length > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3">
                      <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-emerald-400 mb-0.5">Power Lengths</div>
                        <div className="text-xs text-slate-300">{strongLengths.map(l => LENGTH_LABEL[l]).join(', ')} — SR above 150</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Bowler Pitch Zone Performance — only when a specific player is selected */}
          {selectedPlayerId && (
            <div className="mb-5">
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Bowler — Pitch Zone Performance</p>
              <div className="text-xs text-slate-500 mb-3 flex gap-3 flex-wrap">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Expensive (&gt;10 Econ)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Average (7-10)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Good (&lt;7 Econ)</span>
              </div>
              {!hasBowlerPitchData ? (
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">No bowling pitch data recorded</div>
              ) : (
                <>
                  <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden mb-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left p-2.5 text-slate-400">Length</th>
                          <th className="text-right p-2.5 text-slate-400">Balls</th>
                          <th className="text-right p-2.5 text-slate-400">Runs</th>
                          <th className="text-right p-2.5 text-slate-400">Econ</th>
                          <th className="text-right p-2.5 text-slate-400">W</th>
                        </tr>
                      </thead>
                      <tbody>
                        {LENGTH_ZONES_ORDER.filter(l => bowlerPitchLengthStats[l].balls > 0).map(l => {
                          const { balls, runs, wickets } = bowlerPitchLengthStats[l];
                          const econ = (runs / (balls / 6)).toFixed(1);
                          const econNum = parseFloat(econ);
                          const econColor = econNum > 10 ? 'text-red-400' : econNum < 7 ? 'text-emerald-400' : 'text-amber-400';
                          const isWorst = l === bowlerWorstLength;
                          const bgColor = isWorst ? 'bg-red-500/10 border-l-2 border-red-500/60' : '';
                          return (
                            <tr key={l} className={`border-b border-slate-700/30 last:border-0 ${bgColor}`}>
                              <td className="p-2.5">
                                <span className="text-white font-medium">{LENGTH_LABEL[l]}</span>
                                {isWorst && <span className="ml-1.5 text-red-400 text-xs">⚠ Most expensive</span>}
                              </td>
                              <td className="p-2.5 text-right text-slate-400">{balls}</td>
                              <td className="p-2.5 text-right text-slate-300">{runs}</td>
                              <td className={`p-2.5 text-right font-bold ${econColor}`}>{econ}</td>
                              <td className="p-2.5 text-right text-emerald-400 font-bold">{wickets > 0 ? wickets : '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {bowlerWorstLength && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-red-400 mb-0.5">Most Expensive Length</div>
                        <div className="text-xs text-slate-300">{LENGTH_LABEL[bowlerWorstLength]} — {(bowlerPitchLengthStats[bowlerWorstLength].runs / (bowlerPitchLengthStats[bowlerWorstLength].balls / 6)).toFixed(1)} economy conceded at this length</div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
export default function Analytics() {
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players-analytics'],
    queryFn: () => base44.entities.Player.list(),
  });
  const { data: teams = [] } = useQuery({
    queryKey: ['teams-analytics'],
    queryFn: () => base44.entities.Team.list(),
  });
  const { data: allBatterInnings = [] } = useQuery({
    queryKey: ['all-batter-innings-lb'],
    queryFn: () => base44.entities.BatterInnings.list(),
  });
  const { data: allBowlerInnings = [] } = useQuery({
    queryKey: ['all-bowler-innings-lb'],
    queryFn: () => base44.entities.BowlerInnings.list(),
  });
  const { data: allPartnerships = [] } = useQuery({
    queryKey: ['all-partnerships-lb'],
    queryFn: () => base44.entities.Partnership.list(),
  });

  const playersMap = useMemo(() => allPlayers.reduce((a, p) => ({ ...a, [p.id]: p }), {}), [allPlayers]);
  const teamsMap = useMemo(() => teams.reduce((a, t) => ({ ...a, [t.id]: t }), {}), [teams]);

  return (
    <div className="pb-24 md:pb-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-xs">Stats, leaderboards & player insights</p>
        </div>
      </div>

      <Tabs defaultValue="leaderboards" className="w-full">
        <TabsList className="w-full bg-slate-800/50 p-1 rounded-xl mb-5">
          <TabsTrigger value="leaderboards" className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white text-xs">
            <Trophy className="w-3.5 h-3.5 mr-1" />Leaderboards
          </TabsTrigger>
          <TabsTrigger value="player" className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs">
            <BarChart2 className="w-3.5 h-3.5 mr-1" />Player Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboards">
          <LeaderboardsTab
            allPlayers={allPlayers}
            teams={teams}
            allBatterInnings={allBatterInnings}
            allBowlerInnings={allBowlerInnings}
            allPartnerships={allPartnerships}
          />
        </TabsContent>

        <TabsContent value="player">
          <PlayerAnalysisTab
            allPlayers={allPlayers}
            teams={teams}
            playersMap={playersMap}
            teamsMap={teamsMap}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}