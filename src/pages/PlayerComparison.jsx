import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Users, TrendingUp, Target, Zap, Award, Shield, Loader2, ArrowLeftRight, Download } from 'lucide-react';
import { downloadHTML } from '../components/utils/htmlExport';
import { generateWagonWheelSVG, generatePitchMapSVG, wagonWheelLegend, pitchLegend } from '../components/utils/svgExport';
import { useGroundShape } from '@/lib/GroundShapeContext';

const PLAYER_A_COLOR = '#10b981';
const PLAYER_B_COLOR = '#f59e0b';

function StatBar({ label, valA, valB, higherIsBetter = true }) {
  const numA = parseFloat(valA) || 0;
  const numB = parseFloat(valB) || 0;
  const max = Math.max(numA, numB, 0.01);
  const widthA = (numA / max) * 100;
  const widthB = (numB / max) * 100;
  const aWins = higherIsBetter ? numA >= numB : numA <= numB;
  const bWins = higherIsBetter ? numB > numA : numB < numA;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-semibold ${aWins ? 'text-emerald-400' : 'text-slate-400'}`}>{valA}</span>
        <span className="text-xs text-slate-500 text-center px-2">{label}</span>
        <span className={`text-sm font-semibold ${bWins ? 'text-amber-400' : 'text-slate-400'}`}>{valB}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 flex justify-end">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${widthA}%`, backgroundColor: aWins ? PLAYER_A_COLOR : '#334155' }}
          />
        </div>
        <div className="w-px bg-slate-600" />
        <div className="flex-1">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${widthB}%`, backgroundColor: bWins ? PLAYER_B_COLOR : '#334155' }}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: IconComp, label, valA, valB, higherIsBetter = true, color }) {
  const Icon = IconComp;
  const numA = parseFloat(valA) || 0;
  const numB = parseFloat(valB) || 0;
  const aWins = higherIsBetter ? numA >= numB : numA <= numB;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="flex justify-between items-end">
        <div className="text-center">
          <div className={`text-xl font-bold ${aWins ? 'text-emerald-400' : 'text-slate-300'}`}>{valA}</div>
          {aWins && <div className="text-[10px] text-emerald-500 mt-0.5">▲ Better</div>}
        </div>
        <div className="text-slate-600 text-xs">vs</div>
        <div className="text-center">
          <div className={`text-xl font-bold ${!aWins ? 'text-amber-400' : 'text-slate-300'}`}>{valB}</div>
          {!aWins && <div className="text-[10px] text-amber-500 mt-0.5">▲ Better</div>}
        </div>
      </div>
    </div>
  );
}

export default function PlayerComparison() {
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');

  const { data: allPlayers = [], isLoading: playersLoading } = useQuery({
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

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});

  const { mode } = useGroundShape();
  const { data: allMatches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.list()
  });
  const modeMatchIds = useMemo(() => {
    const s = new Set();
    allMatches.forEach(m => { if ((m.ground_mode || 'turf') === mode) s.add(m.id); });
    return s;
  }, [allMatches, mode]);
  const modePlayers = useMemo(
    () => allPlayers.filter(p => (p.ground_mode || 'turf') === mode),
    [allPlayers, mode]
  );
  const modeBatterInnings = useMemo(
    () => allBatterInnings.filter(b => modeMatchIds.has(b.match_id)),
    [allBatterInnings, modeMatchIds]
  );
  const modeBowlerInnings = useMemo(
    () => allBowlerInnings.filter(b => modeMatchIds.has(b.match_id)),
    [allBowlerInnings, modeMatchIds]
  );
  const modeDeliveries = useMemo(
    () => allDeliveries.filter(d => modeMatchIds.has(d.match_id)),
    [allDeliveries, modeMatchIds]
  );

  const getPlayerStats = (playerId) => {
    if (!playerId) return null;

    const batting = modeBatterInnings.filter(b => b.player_id === playerId);
    const bowling = modeBowlerInnings.filter(b => b.player_id === playerId);

    const batRuns = batting.reduce((s, b) => s + (b.runs || 0), 0);
    const batBalls = batting.reduce((s, b) => s + (b.balls_faced || 0), 0);
    const batOuts = batting.reduce((s, b) => s + (b.is_out ? 1 : 0), 0);
    const batFours = batting.reduce((s, b) => s + (b.fours || 0), 0);
    const batSixes = batting.reduce((s, b) => s + (b.sixes || 0), 0);
    const batInnings = batting.length;
    const batDots = batting.reduce((s, b) => s + (b.dots || 0), 0);
    const highScore = batting.length > 0 ? Math.max(...batting.map(b => b.runs || 0)) : 0;
    const fifties = batting.filter(b => b.runs >= 50 && b.runs < 100).length;
    const hundreds = batting.filter(b => b.runs >= 100).length;

    const bowlWickets = bowling.reduce((s, b) => s + (b.wickets || 0), 0);
    const bowlRuns = bowling.reduce((s, b) => s + (b.runs_conceded || 0), 0);
    const bowlOvers = bowling.reduce((s, b) => s + (b.overs || 0) + (b.balls || 0) / 6, 0);
    const bowlDots = bowling.reduce((s, b) => s + (b.dots || 0), 0);
    const bowlMaidens = bowling.reduce((s, b) => s + (b.maidens || 0), 0);
    const fiveWickets = bowling.filter(b => b.wickets >= 5).length;

    return {
      batting: {
        innings: batInnings,
        runs: batRuns,
        average: batOuts > 0 ? (batRuns / batOuts).toFixed(1) : batRuns.toFixed(1),
        strikeRate: batBalls > 0 ? (batRuns / batBalls * 100).toFixed(1) : '0.0',
        highScore,
        fours: batFours,
        sixes: batSixes,
        fifties,
        hundreds,
        dots: batDots,
        dotPct: batBalls > 0 ? ((batDots / batBalls) * 100).toFixed(1) : '0.0',
      },
      bowling: {
        innings: bowling.length,
        wickets: bowlWickets,
        runs: bowlRuns,
        economy: bowlOvers > 0 ? (bowlRuns / bowlOvers).toFixed(2) : '0.00',
        average: bowlWickets > 0 ? (bowlRuns / bowlWickets).toFixed(1) : '-',
        strikeRate: bowlWickets > 0 ? ((bowlOvers * 6) / bowlWickets).toFixed(1) : '-',
        maidens: bowlMaidens,
        dots: bowlDots,
        fiveWickets,
      }
    };
  };

  const statsA = useMemo(() => getPlayerStats(playerAId), [playerAId, modeBatterInnings, modeBowlerInnings]);
  const statsB = useMemo(() => getPlayerStats(playerBId), [playerBId, modeBatterInnings, modeBowlerInnings]);

  const playerA = modePlayers.find(p => p.id === playerAId);
  const playerB = modePlayers.find(p => p.id === playerBId);

  const radarData = statsA && statsB ? [
    { stat: 'Runs', A: parseFloat(statsA.batting.runs) || 0, B: parseFloat(statsB.batting.runs) || 0 },
    { stat: 'Avg', A: parseFloat(statsA.batting.average) || 0, B: parseFloat(statsB.batting.average) || 0 },
    { stat: 'SR', A: parseFloat(statsA.batting.strikeRate) || 0, B: parseFloat(statsB.batting.strikeRate) || 0 },
    { stat: 'Wickets', A: parseFloat(statsA.bowling.wickets) || 0, B: parseFloat(statsB.bowling.wickets) || 0 },
    { stat: 'Econ', A: Math.max(0, 12 - parseFloat(statsA.bowling.economy)) || 0, B: Math.max(0, 12 - parseFloat(statsB.bowling.economy)) || 0 },
    { stat: '4s+6s', A: (statsA.batting.fours + statsA.batting.sixes) || 0, B: (statsB.batting.fours + statsB.batting.sixes) || 0 },
  ] : [];

  const barCompareData = statsA && statsB ? [
    { name: 'Runs', A: statsA.batting.runs, B: statsB.batting.runs },
    { name: 'Avg', A: parseFloat(statsA.batting.average), B: parseFloat(statsB.batting.average) },
    { name: 'SR', A: parseFloat(statsA.batting.strikeRate), B: parseFloat(statsB.batting.strikeRate) },
    { name: 'Wickets', A: statsA.bowling.wickets, B: statsB.bowling.wickets },
  ] : [];

  const exportHTML = () => {
    if (!statsA || !statsB || !playerA || !playerB) return;

    const batStats = [
      ['Runs', statsA.batting.runs, statsB.batting.runs],
      ['Average', statsA.batting.average, statsB.batting.average],
      ['Strike Rate', statsA.batting.strikeRate, statsB.batting.strikeRate],
      ['High Score', statsA.batting.highScore, statsB.batting.highScore],
      ['Innings', statsA.batting.innings, statsB.batting.innings],
      ['Fours', statsA.batting.fours, statsB.batting.fours],
      ['Sixes', statsA.batting.sixes, statsB.batting.sixes],
      ['50s', statsA.batting.fifties, statsB.batting.fifties],
      ['100s', statsA.batting.hundreds, statsB.batting.hundreds],
      ['Dot Ball %', statsA.batting.dotPct, statsB.batting.dotPct],
    ];
    const bowlStats = [
      ['Wickets', statsA.bowling.wickets, statsB.bowling.wickets],
      ['Economy', statsA.bowling.economy, statsB.bowling.economy],
      ['Average', statsA.bowling.average, statsB.bowling.average],
      ['Dot Balls', statsA.bowling.dots, statsB.bowling.dots],
      ['Maidens', statsA.bowling.maidens, statsB.bowling.maidens],
      ['5-Wicket Hauls', statsA.bowling.fiveWickets, statsB.bowling.fiveWickets],
    ];

    const compareRows = (rows) => rows.map(([label, a, b]) => `
      <div class="compare-row">
        <span class="compare-a">${a}</span>
        <span class="compare-lbl">${label}</span>
        <span class="compare-b">${b}</span>
      </div>`).join('');

    const verdictBetter = parseFloat(statsA.batting.average) >= parseFloat(statsB.batting.average) ? playerA.name : playerB.name;
    const verdictExplosive = parseFloat(statsA.batting.strikeRate) >= parseFloat(statsB.batting.strikeRate) ? playerA.name : playerB.name;
    const verdictBowler = statsA.bowling.wickets >= statsB.bowling.wickets ? playerA.name : playerB.name;
    const verdictEcon = (parseFloat(statsA.bowling.economy)||99) <= (parseFloat(statsB.bowling.economy)||99) ? playerA.name : playerB.name;

    // Per-player visual data
    const delivA = modeDeliveries.filter(d => d.striker_id === playerAId);
    const delivB = modeDeliveries.filter(d => d.striker_id === playerBId);
    const pitchA = modeDeliveries.filter(d => d.bowler_id === playerAId);
    const pitchB = modeDeliveries.filter(d => d.bowler_id === playerBId);

    const visualA = delivA.some(d => d.shot_x != null) ? `
      <div class="card" style="text-align:center">
        <h3 style="margin-bottom:8px;color:#10b981">${playerA.name} – Wagon Wheel</h3>
        ${generateWagonWheelSVG(delivA, 220)}
        ${wagonWheelLegend(delivA.filter(d => d.shot_x != null))}
      </div>` : '';

    const visualB = delivB.some(d => d.shot_x != null) ? `
      <div class="card" style="text-align:center">
        <h3 style="margin-bottom:8px;color:#f59e0b">${playerB.name} – Wagon Wheel</h3>
        ${generateWagonWheelSVG(delivB, 220)}
        ${wagonWheelLegend(delivB.filter(d => d.shot_x != null))}
      </div>` : '';

    const pitchMapA = pitchA.some(d => d.pitch_x != null) ? `
      <div class="card" style="text-align:center">
        <h3 style="margin-bottom:8px;color:#10b981">${playerA.name} – Pitch Map</h3>
        ${generatePitchMapSVG(pitchA, 120, 260)}
        ${pitchLegend()}
      </div>` : '';

    const pitchMapB = pitchB.some(d => d.pitch_x != null) ? `
      <div class="card" style="text-align:center">
        <h3 style="margin-bottom:8px;color:#f59e0b">${playerB.name} – Pitch Map</h3>
        ${generatePitchMapSVG(pitchB, 120, 260)}
        ${pitchLegend()}
      </div>` : '';

    const visualSection = (visualA || visualB || pitchMapA || pitchMapB) ? `
      <h2>🗺️ Visual Analytics</h2>
      ${(visualA || visualB) ? `<div class="grid2">${visualA}${visualB}</div>` : ''}
      ${(pitchMapA || pitchMapB) ? `<div class="grid2">${pitchMapA}${pitchMapB}</div>` : ''}
    ` : '';

    const html = `
      <h1>Player Comparison Report</h1>
      <p>Generated ${new Date().toLocaleDateString()}</p>
      <div class="grid2" style="margin-top:16px">
        <div class="player-header player-a">
          <div style="font-size:1.25rem;font-weight:800;color:#10b981">${playerA.name}</div>
          <div style="color:#64748b;font-size:0.8rem">${teamsMap[playerA.team_id]?.name || ''}</div>
          <div style="color:#475569;font-size:0.75rem;margin-top:2px">${playerA.role?.replace('_',' ') || ''}</div>
        </div>
        <div class="player-header player-b">
          <div style="font-size:1.25rem;font-weight:800;color:#f59e0b">${playerB.name}</div>
          <div style="color:#64748b;font-size:0.8rem">${teamsMap[playerB.team_id]?.name || ''}</div>
          <div style="color:#475569;font-size:0.75rem;margin-top:2px">${playerB.role?.replace('_',' ') || ''}</div>
        </div>
      </div>
      <h2>🏏 Batting Head-to-Head</h2>
      <div class="card">
        <div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid #334155;margin-bottom:4px">
          <span style="color:#10b981;font-weight:700">${playerA.name}</span>
          <span style="color:#64748b;font-size:0.75rem">Stat</span>
          <span style="color:#f59e0b;font-weight:700">${playerB.name}</span>
        </div>
        ${compareRows(batStats)}
      </div>
      <h2>🎯 Bowling Head-to-Head</h2>
      <div class="card">
        <div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid #334155;margin-bottom:4px">
          <span style="color:#10b981;font-weight:700">${playerA.name}</span>
          <span style="color:#64748b;font-size:0.75rem">Stat</span>
          <span style="color:#f59e0b;font-weight:700">${playerB.name}</span>
        </div>
        ${compareRows(bowlStats)}
      </div>
      ${visualSection}
      <h2>🏆 Quick Verdict</h2>
      <div class="card">
        <div class="verdict-grid">
          <div class="verdict-card ${verdictBetter===playerA.name?'verdict-a':'verdict-b'}">
            <div style="font-size:0.75rem;color:#64748b">Better Batter</div>
            <div style="font-weight:700;color:${verdictBetter===playerA.name?'#10b981':'#f59e0b'}">${verdictBetter}</div>
          </div>
          <div class="verdict-card ${verdictExplosive===playerA.name?'verdict-a':'verdict-b'}">
            <div style="font-size:0.75rem;color:#64748b">More Explosive</div>
            <div style="font-weight:700;color:${verdictExplosive===playerA.name?'#10b981':'#f59e0b'}">${verdictExplosive}</div>
          </div>
          <div class="verdict-card ${verdictBowler===playerA.name?'verdict-a':'verdict-b'}">
            <div style="font-size:0.75rem;color:#64748b">Better Bowler</div>
            <div style="font-weight:700;color:${verdictBowler===playerA.name?'#10b981':'#f59e0b'}">${verdictBowler}</div>
          </div>
          <div class="verdict-card ${verdictEcon===playerA.name?'verdict-a':'verdict-b'}">
            <div style="font-size:0.75rem;color:#64748b">More Economical</div>
            <div style="font-weight:700;color:${verdictEcon===playerA.name?'#10b981':'#f59e0b'}">${verdictEcon}</div>
          </div>
        </div>
      </div>
    `;
    downloadHTML(html, `comparison_${playerA.name}_vs_${playerB.name}`);
  };

  if (playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Player Comparison</h1>
          <p className="text-slate-400 text-sm">Head-to-head stats between two players</p>
        </div>
        {statsA && statsB && (
          <button
            onClick={exportHTML}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Export HTML
          </button>
        )}
      </div>

      {/* Player Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-400">Player A</span>
          </div>
          <Select value={playerAId} onValueChange={setPlayerAId}>
            <SelectTrigger className="bg-slate-800 border-emerald-500/40 text-white">
              <SelectValue placeholder="Select Player A" />
            </SelectTrigger>
            <SelectContent>
              {modePlayers.filter(p => p.id !== playerBId).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {teamsMap[p.team_id]?.short_name || '?'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-400">Player B</span>
          </div>
          <Select value={playerBId} onValueChange={setPlayerBId}>
            <SelectTrigger className="bg-slate-800 border-amber-500/40 text-white">
              <SelectValue placeholder="Select Player B" />
            </SelectTrigger>
            <SelectContent>
              {modePlayers.filter(p => p.id !== playerAId).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {teamsMap[p.team_id]?.short_name || '?'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(!playerAId || !playerBId) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <ArrowLeftRight className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Select Two Players</h3>
          <p className="text-slate-400 text-sm">Choose Player A and Player B above to compare their stats</p>
        </div>
      )}

      {statsA && statsB && playerA && playerB && (
        <>
          {/* Player Name Headers */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-emerald-400">{playerA.name}</div>
              <div className="text-xs text-slate-400">{teamsMap[playerA.team_id]?.name || 'Unknown Team'}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{playerA.role?.replace('_', ' ')}</div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-amber-400">{playerB.name}</div>
              <div className="text-xs text-slate-400">{teamsMap[playerB.team_id]?.name || 'Unknown Team'}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{playerB.role?.replace('_', ' ')}</div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Overall Comparison
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="stat" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Radar name={playerA.name} dataKey="A" stroke={PLAYER_A_COLOR} fill={PLAYER_A_COLOR} fillOpacity={0.2} />
                <Radar name={playerB.name} dataKey="B" stroke={PLAYER_B_COLOR} fill={PLAYER_B_COLOR} fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-emerald-400" /> {playerA.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-amber-400" /> {playerB.name}
              </div>
            </div>
          </div>

          {/* Bar Chart Side-by-Side */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-6">
            <h3 className="font-semibold text-white mb-4">Key Stats Bar Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barCompareData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                <Bar dataKey="A" name={playerA.name} fill={PLAYER_A_COLOR} radius={[4, 4, 0, 0]} />
                <Bar dataKey="B" name={playerB.name} fill={PLAYER_B_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Batting Comparison */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Batting Head-to-Head
            </h3>
            <StatBar label="Runs" valA={statsA.batting.runs} valB={statsB.batting.runs} />
            <StatBar label="Average" valA={statsA.batting.average} valB={statsB.batting.average} />
            <StatBar label="Strike Rate" valA={statsA.batting.strikeRate} valB={statsB.batting.strikeRate} />
            <StatBar label="High Score" valA={statsA.batting.highScore} valB={statsB.batting.highScore} />
            <StatBar label="Innings" valA={statsA.batting.innings} valB={statsB.batting.innings} />
            <StatBar label="Fours" valA={statsA.batting.fours} valB={statsB.batting.fours} />
            <StatBar label="Sixes" valA={statsA.batting.sixes} valB={statsB.batting.sixes} />
            <StatBar label="50s" valA={statsA.batting.fifties} valB={statsB.batting.fifties} />
            <StatBar label="100s" valA={statsA.batting.hundreds} valB={statsB.batting.hundreds} />
            <StatBar label="Dot Ball %" valA={statsA.batting.dotPct} valB={statsB.batting.dotPct} higherIsBetter={false} />
          </div>

          {/* Bowling Comparison */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-400" />
              Bowling Head-to-Head
            </h3>
            <StatBar label="Wickets" valA={statsA.bowling.wickets} valB={statsB.bowling.wickets} />
            <StatBar label="Economy" valA={statsA.bowling.economy} valB={statsB.bowling.economy} higherIsBetter={false} />
            <StatBar label="Average" valA={statsA.bowling.average === '-' ? 0 : statsA.bowling.average} valB={statsB.bowling.average === '-' ? 0 : statsB.bowling.average} higherIsBetter={false} />
            <StatBar label="Dot Balls" valA={statsA.bowling.dots} valB={statsB.bowling.dots} />
            <StatBar label="Maidens" valA={statsA.bowling.maidens} valB={statsB.bowling.maidens} />
            <StatBar label="5-Wicket Hauls" valA={statsA.bowling.fiveWickets} valB={statsB.bowling.fiveWickets} />
          </div>

          {/* Quick Verdict */}
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Quick Verdict
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Better Batter',
                  winner: parseFloat(statsA.batting.average) >= parseFloat(statsB.batting.average) ? playerA.name : playerB.name,
                  color: parseFloat(statsA.batting.average) >= parseFloat(statsB.batting.average) ? 'emerald' : 'amber',
                },
                {
                  label: 'More Explosive',
                  winner: parseFloat(statsA.batting.strikeRate) >= parseFloat(statsB.batting.strikeRate) ? playerA.name : playerB.name,
                  color: parseFloat(statsA.batting.strikeRate) >= parseFloat(statsB.batting.strikeRate) ? 'emerald' : 'amber',
                },
                {
                  label: 'Better Bowler',
                  winner: statsA.bowling.wickets >= statsB.bowling.wickets ? playerA.name : playerB.name,
                  color: statsA.bowling.wickets >= statsB.bowling.wickets ? 'emerald' : 'amber',
                },
                {
                  label: 'More Economical',
                  winner: (parseFloat(statsA.bowling.economy) || 99) <= (parseFloat(statsB.bowling.economy) || 99) ? playerA.name : playerB.name,
                  color: (parseFloat(statsA.bowling.economy) || 99) <= (parseFloat(statsB.bowling.economy) || 99) ? 'emerald' : 'amber',
                },
              ].map(({ label, winner, color }) => (
                <div key={label} className={`rounded-lg p-3 bg-${color}-500/10 border border-${color}-500/30`}>
                  <div className="text-xs text-slate-400 mb-1">{label}</div>
                  <div className={`font-semibold text-${color}-400 text-sm`}>{winner}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}