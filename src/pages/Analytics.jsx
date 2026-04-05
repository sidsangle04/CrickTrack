import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Zap, Target, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import GroundMap from '../components/scoring/GroundMap';

// ── Turf zone from x,y ────────────────────────────────────────────────────
function getTurfZone(x, y) {
  // y > 0 = batter end (top), y < 0 = bowler end (bottom)
  // x < 0 = off side (left), x > 0 = leg side (right)
  if (y >= 0) {
    return x < 0 ? 'Front Left' : 'Front Right';
  } else {
    if (x < -0.3) return 'Back Left';
    if (x > 0.3) return 'Back Right';
    return 'Back Center';
  }
}

const TURF_ZONES = ['Front Left', 'Front Right', 'Back Left', 'Back Center', 'Back Right'];

const RUN_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '0', label: '0' },
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '4', label: '4' },
  { key: '6', label: '6' },
  { key: 'W', label: 'W' },
];

// ── Heatmap overlay for rectangular SVG ──────────────────────────────────
function HeatmapOverlay({ deliveries, groundW, groundH, cx, cy, rX, rY }) {
  const zoneCounts = {};
  TURF_ZONES.forEach(z => { zoneCounts[z] = 0; });

  deliveries.forEach(d => {
    if (d.shot_x == null || d.shot_y == null) return;
    const zone = d.turf_zone || getTurfZone(d.shot_x, d.shot_y);
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });

  const max = Math.max(...Object.values(zoneCounts), 1);

  // Zone rectangles mapped to ground coordinates
  // Ground: gX=12, gY=12, gW, gH; cx, cy center
  const zoneRects = {
    'Front Left':   { x: 0,      y: 0,      w: 0.5, h: 0.5 }, // top-left
    'Front Right':  { x: 0.5,    y: 0,      w: 0.5, h: 0.5 }, // top-right
    'Back Left':    { x: 0,      y: 0.5,    w: 0.34,h: 0.5 }, // bottom-left
    'Back Center':  { x: 0.34,   y: 0.5,    w: 0.32,h: 0.5 }, // bottom-center
    'Back Right':   { x: 0.66,   y: 0.5,    w: 0.34,h: 0.5 }, // bottom-right
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
        const norm = zoneCounts[zone] / max;
        const color = getHeatColor(norm);
        return (
          <rect
            key={zone}
            x={pad + r.x * groundW}
            y={pad + r.y * groundH}
            width={r.w * groundW}
            height={r.h * groundH}
            fill={color}
            rx="2"
          />
        );
      })}
      {TURF_ZONES.map(zone => {
        const r = zoneRects[zone];
        const norm = zoneCounts[zone] / max;
        const labelX = pad + (r.x + r.w / 2) * groundW;
        const labelY = pad + (r.y + r.h / 2) * groundH;
        return (
          <g key={`lbl-${zone}`}>
            <text x={labelX} y={labelY - 7} textAnchor="middle" fill="white" fontSize="8" opacity="0.8">
              {zone}
            </text>
            <text x={labelX} y={labelY + 7} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity="0.95">
              {zoneCounts[zone]}
            </text>
          </g>
        );
      })}
    </>
  );
}

// ── GroundMap with optional heatmap ──────────────────────────────────────
function GroundMapWithHeatmap({ shots, deliveries, showHeatmap, size }) {
  const W = Math.round(size * 0.72);
  const H = size;
  const pad = 12;
  const gW = W - pad * 2;
  const gH = H - pad * 2;
  const cx = W / 2;
  const cy = H / 2;
  const rX = gW / 2 * 0.87;
  const rY = gH / 2 * 0.87;

  if (!showHeatmap) {
    return <GroundMap shots={shots} size={size} />;
  }

  // Render the ground ourselves + heatmap overlay (no click)
  const pitchW = gW * 0.13;
  const pitchH = gH * 0.44;
  const pitchX = cx - pitchW / 2;
  const pitchY = cy - pitchH / 2;
  const so = [-pitchW * 0.32, 0, pitchW * 0.32];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="select-none">
      <rect x={0} y={0} width={W} height={H} fill="#0d1f0d" rx="6" />
      <rect x={pad} y={pad} width={gW} height={gH} fill="#15803d" rx="3" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={pad} y={pad + i * gH / 8} width={gW} height={gH / 8}
          fill={i % 2 === 0 ? '#166534' : '#15803d'} opacity="0.5" />
      ))}

      {/* Heatmap overlay */}
      <HeatmapOverlay deliveries={deliveries} groundW={gW} groundH={gH} cx={cx} cy={cy} rX={rX} rY={rY} />

      <rect x={pad + 3} y={pad + 3} width={gW - 6} height={gH - 6}
        fill="none" stroke="white" strokeWidth="1.8" rx="2" />

      {/* Pitch */}
      <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH}
        fill="#78350f" stroke="#d97706" strokeWidth="1" rx="2" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.1}
            x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.1} stroke="white" strokeWidth="1" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.9}
            x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.9} stroke="white" strokeWidth="1" />
      {so.map((off, i) => (
        <g key={i}>
          <line x1={cx + off} y1={pitchY + pitchH * 0.08} x2={cx + off} y2={pitchY - pitchH * 0.06}
            stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
          <line x1={cx + off} y1={pitchY + pitchH * 0.92} x2={cx + off} y2={pitchY + pitchH * 1.06}
            stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, color = 'text-white', sub }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Insight Card ─────────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────
export default function Analytics() {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const { data: players = [] } = useQuery({
    queryKey: ['all-players-analytics'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['deliveries-analytics', selectedPlayerId],
    queryFn: () => selectedPlayerId
      ? base44.entities.Delivery.filter({ striker_id: selectedPlayerId, is_voided: false })
      : base44.entities.Delivery.filter({ is_voided: false }),
    enabled: true,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const playersMap = useMemo(() =>
    allPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}), [allPlayers]);

  const toggleFilter = (key) => {
    if (key === 'all') {
      setActiveFilters(['all']);
      return;
    }
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
    allDeliveries
      .filter(d => d.shot_x != null && d.shot_y != null)
      .map(d => ({
        ...d,
        turf_zone: d.turf_zone || getTurfZone(d.shot_x, d.shot_y),
      })),
    [allDeliveries]
  );

  const filteredDeliveries = useMemo(() => {
    if (activeFilters.includes('all')) return shotsWithZone;
    return shotsWithZone.filter(d => {
      return activeFilters.some(f => {
        if (f === 'W') return d.is_wicket;
        return (d.runs_bat || 0) === parseInt(f);
      });
    });
  }, [shotsWithZone, activeFilters]);

  const shots = filteredDeliveries.map(d => ({
    x: d.shot_x,
    y: d.shot_y,
    runs: d.runs_bat || 0,
    is_wicket: d.is_wicket,
  }));

  // ── Performance stats (all deliveries for player, not just shots) ────
  const statsDeliveries = useMemo(() =>
    allDeliveries.filter(d => !d.is_voided && d.is_legal_delivery !== false),
    [allDeliveries]
  );

  const totalRuns = statsDeliveries.reduce((s, d) => s + (d.runs_bat || 0), 0);
  const ballsFaced = statsDeliveries.length;
  const strikeRate = ballsFaced > 0 ? ((totalRuns / ballsFaced) * 100).toFixed(1) : '0.0';
  const fours = statsDeliveries.filter(d => (d.runs_bat || 0) === 4).length;
  const sixes = statsDeliveries.filter(d => (d.runs_bat || 0) === 6).length;
  const wickets = statsDeliveries.filter(d => d.is_wicket).length;

  // ── Zone analysis ─────────────────────────────────────────────────────
  const zoneCounts = useMemo(() => {
    const counts = {};
    TURF_ZONES.forEach(z => { counts[z] = { shots: 0, runs: 0 }; });
    shotsWithZone.forEach(d => {
      const z = d.turf_zone;
      if (counts[z]) {
        counts[z].shots++;
        counts[z].runs += d.runs_bat || 0;
      }
    });
    return counts;
  }, [shotsWithZone]);

  const strongZone = TURF_ZONES.reduce((a, b) => zoneCounts[a].shots >= zoneCounts[b].shots ? a : b, TURF_ZONES[0]);
  const weakZone = TURF_ZONES.reduce((a, b) => zoneCounts[a].shots <= zoneCounts[b].shots ? a : b, TURF_ZONES[0]);
  const mostRunsZone = TURF_ZONES.reduce((a, b) => zoneCounts[a].runs >= zoneCounts[b].runs ? a : b, TURF_ZONES[0]);

  // ── Pitch / length analysis ───────────────────────────────────────────
  const lengthCounts = useMemo(() => {
    const counts = {};
    allDeliveries.forEach(d => {
      if (d.length) counts[d.length] = (counts[d.length] || 0) + 1;
    });
    return counts;
  }, [allDeliveries]);

  const bestLength = Object.entries(lengthCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // ── Wicket zone ───────────────────────────────────────────────────────
  const wicketDeliveries = shotsWithZone.filter(d => d.is_wicket);
  const wicketZoneCounts = {};
  wicketDeliveries.forEach(d => {
    wicketZoneCounts[d.turf_zone] = (wicketZoneCounts[d.turf_zone] || 0) + 1;
  });
  const mostDangerousZone = Object.entries(wicketZoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // ── Catch drops ───────────────────────────────────────────────────────
  const catchDrops = useMemo(() =>
    allDeliveries.filter(d => d.is_catch_drop),
    [allDeliveries]
  );

  const dropsByFielder = useMemo(() => {
    const counts = {};
    catchDrops.forEach(d => {
      if (d.dropped_by) counts[d.dropped_by] = (counts[d.dropped_by] || 0) + 1;
    });
    return counts;
  }, [catchDrops]);

  return (
    <div className="pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')} className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-xs">Player performance insights</p>
        </div>
      </div>

      {/* Player Selector */}
      <div className="mb-5">
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Select Player</p>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedPlayerId(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              !selectedPlayerId
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            All Players
          </button>
          {players.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPlayerId(p.id === selectedPlayerId ? null : p.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedPlayerId === p.id
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Stats */}
      <div className="mb-5">
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Performance</p>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Runs" value={totalRuns} color="text-emerald-400" />
          <StatCard label="Balls" value={ballsFaced} />
          <StatCard label="Strike Rate" value={strikeRate} color="text-amber-400" />
          <StatCard label="Fours" value={fours} color="text-emerald-400" />
          <StatCard label="Sixes" value={sixes} color="text-amber-400" />
          <StatCard label="Wickets" value={wickets} color="text-red-400" />
        </div>
      </div>

      {/* Wagon Wheel Section */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Wagon Wheel</p>
          {/* View toggle */}
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setShowHeatmap(false)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                !showHeatmap ? 'bg-emerald-500 text-white' : 'text-slate-400'
              }`}
            >
              Shots
            </button>
            <button
              onClick={() => setShowHeatmap(true)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                showHeatmap ? 'bg-amber-500 text-white' : 'text-slate-400'
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        {/* Run filters */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {RUN_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                activeFilters.includes(f.key)
                  ? f.key === 'W'
                    ? 'bg-red-500 border-red-500 text-white'
                    : f.key === '4'
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : f.key === '6'
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-slate-500 border-slate-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ground map */}
        <div className="flex justify-center">
          {shotsWithZone.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              No shot data available
            </div>
          ) : (
            <GroundMapWithHeatmap
              shots={shots}
              deliveries={filteredDeliveries}
              showHeatmap={showHeatmap}
              size={300}
            />
          )}
        </div>

        {/* Legend */}
        {!showHeatmap && (
          <div className="flex gap-3 justify-center mt-3 flex-wrap text-xs">
            {[
              { color: 'bg-slate-500', label: 'Dot' },
              { color: 'bg-blue-400', label: '1-3' },
              { color: 'bg-emerald-400', label: '4' },
              { color: 'bg-amber-400', label: '6' },
              { color: 'bg-red-400', label: 'W' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-slate-400">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        )}

        {showHeatmap && (
          <div className="flex gap-3 justify-center mt-3 flex-wrap text-xs">
            {[
              { color: 'bg-blue-500', label: 'Low' },
              { color: 'bg-yellow-500', label: 'Medium' },
              { color: 'bg-red-500', label: 'High' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-slate-400">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick Insights */}
      {shotsWithZone.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Quick Insights</p>
          <div className="grid grid-cols-1 gap-2">
            <InsightCard icon={Zap} title="Strong Zone" value={`${strongZone} (${zoneCounts[strongZone].shots} shots)`} color="bg-emerald-500/20 text-emerald-400" />
            <InsightCard icon={AlertTriangle} title="Weak Zone" value={`${weakZone} (${zoneCounts[weakZone].shots} shots)`} color="bg-amber-500/20 text-amber-400" />
            <InsightCard icon={TrendingUp} title="Most Runs Zone" value={`${mostRunsZone} (${zoneCounts[mostRunsZone].runs} runs)`} color="bg-blue-500/20 text-blue-400" />
          </div>
        </div>
      )}

      {/* Advanced Insights */}
      {allDeliveries.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Advanced Insights</p>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 space-y-3">
            {[
              { label: 'Most Used Zone', value: strongZone },
              { label: 'Least Used Zone', value: weakZone },
              { label: 'Strongest Length', value: bestLength ? bestLength.replace(/_/g, ' ') : '—' },
              { label: 'Most Dangerous Zone', value: mostDangerousZone || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center text-sm py-2 border-b border-slate-700/40 last:border-0 last:pb-0">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone Breakdown */}
      {shotsWithZone.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Zone Breakdown</p>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left p-3 text-slate-400 font-medium text-xs">Zone</th>
                  <th className="text-right p-3 text-slate-400 font-medium text-xs">Shots</th>
                  <th className="text-right p-3 text-slate-400 font-medium text-xs">Runs</th>
                  <th className="text-right p-3 text-slate-400 font-medium text-xs">Avg/Shot</th>
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

      {/* Catch Drops */}
      <div className="mb-5">
        <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Catch Drops</p>
        {catchDrops.length === 0 ? (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">
            No dropped catches recorded
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-700/50">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-xl font-bold text-red-400">{catchDrops.length}</div>
                <div className="text-xs text-slate-400">Total Drops</div>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(dropsByFielder).sort((a, b) => b[1] - a[1]).map(([pid, count]) => (
                <div key={pid} className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">{playersMap[pid]?.name || 'Unknown'}</span>
                  <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">
                    {count} drop{count > 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}