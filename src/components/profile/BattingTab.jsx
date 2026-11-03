import React, { useMemo, useState } from 'react';
import { Zap, TrendingUp, AlertTriangle, ShieldAlert } from 'lucide-react';
import GroundMapWithHeatmap from '@/components/analytics/GroundMapWithHeatmap';
import PitchHeatmap from '@/components/analytics/PitchHeatmap';
import { StatCard, InsightCard } from '@/components/analytics/StatCards';
import { getZone, zonesFor } from '@/lib/groundShape';
import {
  LENGTH_ZONES_ORDER, LENGTH_NORMALIZE, LENGTH_LABEL,
  DISMISSAL_LABEL, DISMISSAL_COLOR, RUN_FILTERS, hasBatted,
} from '@/lib/analyticsShared';

const SHOT_TYPES = [
  ['drive', 'Drive'], ['cut', 'Cut'], ['pull', 'Pull'], ['hook', 'Hook'],
  ['sweep', 'Sweep'], ['reverse_sweep', 'Reverse Sweep'], ['flick', 'Flick'],
  ['glance', 'Glance'], ['defence', 'Defence'], ['leave', 'Leave'],
  ['edge', 'Edge'], ['miscue', 'Miscue'], ['other', 'Other'],
];

// Full batting insight tab: zones, wagon wheel, heatmap, pitch map, shot types, dismissals.
export default function BattingTab({ strikerDeliveries, batterInnings, groundShape }) {
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const ZONES = zonesFor(groundShape);

  const statsDeliveries = useMemo(
    () => strikerDeliveries.filter(d => !d.is_voided && d.is_legal_delivery !== false),
    [strikerDeliveries]
  );
  // The innings rows are the scorecard, so they carry the totals — including for
  // imported scorecards that have no ball-by-ball log. Deliveries only refine the
  // dot count when a match was actually scored ball by ball.
  const batting = useMemo(() => {
    let runs = 0, balls = 0, fours = 0, sixes = 0, dots = 0;
    batterInnings.forEach(b => {
      if (!hasBatted(b)) return;
      runs += b.runs || 0;
      balls += b.balls_faced || 0;
      fours += b.fours || 0;
      sixes += b.sixes || 0;
      dots += b.dots || 0;
    });
    return {
      runs,
      balls,
      fours,
      sixes,
      strikeRate: balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0',
      dots: statsDeliveries.length > 0
        ? statsDeliveries.filter(d => (d.runs_bat || 0) === 0 && !d.is_wicket).length
        : dots || (balls > 0 ? '—' : 0),
    };
  }, [batterInnings, statsDeliveries]);

  const shotsWithZone = useMemo(
    () => strikerDeliveries.filter(d => d.shot_x != null && d.shot_y != null && !d.is_voided)
      .map(d => ({ ...d, zone: getZone(groundShape, d) })),
    [strikerDeliveries, groundShape]
  );

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

  const filteredDeliveries = useMemo(() => {
    if (activeFilters.includes('all')) return shotsWithZone;
    return shotsWithZone.filter(d =>
      activeFilters.some(f => f === 'W' ? d.is_wicket : (d.runs_bat || 0) === parseInt(f))
    );
  }, [shotsWithZone, activeFilters]);

  const shots = filteredDeliveries.map(d => ({ x: d.shot_x, y: d.shot_y, runs: d.runs_bat || 0, is_wicket: d.is_wicket }));

  // Zone performance: shots, runs, scoring rate
  const zoneStats = useMemo(() => {
    const counts = {};
    ZONES.forEach(z => { counts[z] = { shots: 0, runs: 0 }; });
    shotsWithZone.forEach(d => {
      if (counts[d.zone]) { counts[d.zone].shots++; counts[d.zone].runs += d.runs_bat || 0; }
    });
    return counts;
  }, [shotsWithZone, ZONES]);

  const zoneSR = (z) => { const { shots: s, runs: r } = zoneStats[z]; return s > 0 ? (r / s) * 100 : 0; };
  const strongZone = [...ZONES].filter(z => zoneStats[z].shots >= 3).sort((a, b) => zoneSR(b) - zoneSR(a))[0];
  const weakZone = [...ZONES].filter(z => zoneStats[z].shots >= 3).sort((a, b) => zoneSR(a) - zoneSR(b))[0];
  const mostRunsZone = [...ZONES].sort((a, b) => zoneStats[b].runs - zoneStats[a].runs)[0];

  const wicketZoneCounts = {};
  shotsWithZone.filter(d => d.is_wicket).forEach(d => { wicketZoneCounts[d.zone] = (wicketZoneCounts[d.zone] || 0) + 1; });
  const wicketZone = Object.entries(wicketZoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Length stats (as batter)
  const pitchLengthStats = useMemo(() => {
    const stats = {};
    LENGTH_ZONES_ORDER.forEach(l => { stats[l] = { balls: 0, runs: 0, wickets: 0 }; });
    statsDeliveries.filter(d => d.length).forEach(d => {
      const key = LENGTH_NORMALIZE[d.length] || d.length;
      if (stats[key]) {
        stats[key].balls++;
        stats[key].runs += d.runs_bat || 0;
        if (d.is_wicket) stats[key].wickets++;
      }
    });
    return stats;
  }, [statsDeliveries]);

  const weakLengths = LENGTH_ZONES_ORDER.filter(l => {
    const { balls, runs } = pitchLengthStats[l];
    return balls >= 3 && (runs / balls) * 100 < 100;
  });
  const strongLengths = LENGTH_ZONES_ORDER.filter(l => {
    const { balls, runs } = pitchLengthStats[l];
    return balls >= 3 && (runs / balls) * 100 > 150;
  });
  const mostDismissalLength = LENGTH_ZONES_ORDER
    .filter(l => pitchLengthStats[l].wickets > 0)
    .sort((a, b) => pitchLengthStats[b].wickets - pitchLengthStats[a].wickets)[0];
  const hasPitchData = statsDeliveries.some(d => d.length);

  // Shot type breakdown
  const shotTypeStats = useMemo(() => {
    const stats = {};
    statsDeliveries.filter(d => d.shot_type).forEach(d => {
      const label = (SHOT_TYPES.find(([k]) => k === d.shot_type) || [, d.shot_type])[1];
      if (!stats[label]) stats[label] = { balls: 0, runs: 0 };
      stats[label].balls++;
      stats[label].runs += d.runs_bat || 0;
    });
    return stats;
  }, [statsDeliveries]);
  const maxShotBalls = Math.max(...Object.values(shotTypeStats).map(s => s.balls), 1);

  // Dismissals
  const dismissalCounts = {};
  batterInnings.filter(b => b.is_out && b.dismissal_type).forEach(b => {
    dismissalCounts[b.dismissal_type] = (dismissalCounts[b.dismissal_type] || 0) + 1;
  });
  const totalDismissals = Object.values(dismissalCounts).reduce((s, v) => s + v, 0);

  const sectionLabel = 'text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide';

  return (
    <div className="space-y-6">
      <div>
        <p className={sectionLabel}>Batting</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          <StatCard label="Runs" value={batting.runs} color="text-emerald-400" />
          <StatCard label="Balls" value={batting.balls} />
          <StatCard label="Strike Rate" value={batting.strikeRate} color="text-amber-400" />
          <StatCard label="4s" value={batting.fours} color="text-emerald-400" />
          <StatCard label="6s" value={batting.sixes} color="text-amber-400" />
          <StatCard label="Dots" value={batting.dots} />
        </div>
      </div>

      {/* Wagon wheel / heatmap */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={sectionLabel + ' mb-0'}>Wagon Wheel</p>
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
            <GroundMapWithHeatmap shots={shots} deliveries={filteredDeliveries} showHeatmap={showHeatmap} size={300} shape={groundShape} />
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

      {/* Quick insights */}
      {shotsWithZone.length > 0 && (
        <div>
          <p className={sectionLabel}>Quick Insights</p>
          <div className="grid gap-2 md:grid-cols-2">
            {strongZone && <InsightCard icon={Zap} title="Strong Zone" value={`${strongZone} (${zoneSR(strongZone).toFixed(0)} SR)`} color="bg-emerald-500/20 text-emerald-400" />}
            {weakZone && <InsightCard icon={AlertTriangle} title="Weak Zone" value={`${weakZone} (${zoneSR(weakZone).toFixed(0)} SR)`} color="bg-red-500/20 text-red-400" />}
            {mostRunsZone && zoneStats[mostRunsZone].runs > 0 && <InsightCard icon={TrendingUp} title="Most Runs Zone" value={`${mostRunsZone} (${zoneStats[mostRunsZone].runs} runs)`} color="bg-blue-500/20 text-blue-400" />}
            {wicketZone && <InsightCard icon={ShieldAlert} title="Wicket Zone" value={wicketZone} color="bg-red-500/20 text-red-400" />}
          </div>
        </div>
      )}

      {/* Zone breakdown */}
      {shotsWithZone.length > 0 && (
        <div>
          <p className={sectionLabel}>Zone Breakdown</p>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left p-3 text-slate-400 text-xs">Zone</th>
                    <th className="text-right p-3 text-slate-400 text-xs">Shots</th>
                    <th className="text-right p-3 text-slate-400 text-xs">Runs</th>
                    <th className="text-right p-3 text-slate-400 text-xs">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {ZONES.map(zone => {
                    const { shots: s, runs: r } = zoneStats[zone];
                    return (
                      <tr key={zone} className="border-b border-slate-700/30 last:border-0">
                        <td className="p-3 text-white font-medium">{zone}</td>
                        <td className="p-3 text-right text-slate-300">{s}</td>
                        <td className="p-3 text-right text-emerald-400 font-semibold">{r}</td>
                        <td className="p-3 text-right text-slate-400">{s > 0 ? ((r / s) * 100).toFixed(0) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pitch map (faced deliveries) */}
      <div>
        <p className={sectionLabel}>Pitch Map — Deliveries Faced</p>
        <PitchHeatmap deliveries={statsDeliveries} title="" />
      </div>

      {/* Length performance */}
      {hasPitchData && (
        <div>
          <p className={sectionLabel}>Length Performance</p>
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
                  return (
                    <tr key={l} className={`border-b border-slate-700/30 last:border-0 ${isMostDismissals ? 'bg-red-500/10 border-l-2 border-red-500/60' : ''}`}>
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
                  <div className="text-sm font-semibold text-orange-400 mb-0.5">Weakness Lengths</div>
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
        </div>
      )}

      {/* Shot type breakdown */}
      {Object.keys(shotTypeStats).length > 0 && (
        <div>
          <p className={sectionLabel}>Shot Types</p>
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-3 space-y-2">
            {Object.entries(shotTypeStats).sort((a, b) => b[1].balls - a[1].balls).map(([label, s]) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-300 font-medium">{label}</span>
                  <span className="text-slate-400">{s.balls} balls · <span className="text-emerald-400">{s.runs} runs</span></span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(s.balls / maxShotBalls) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dismissals */}
      <div>
        <p className={sectionLabel}>How They Got Out</p>
        {totalDismissals === 0 ? (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">No dismissal data</div>
        ) : (
          <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 divide-y divide-slate-700/30">
            {Object.entries(dismissalCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
              const pct = Math.round((count / totalDismissals) * 100);
              return (
                <div key={type} className="px-3 py-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium ${DISMISSAL_COLOR[type] || 'text-slate-300'}`}>{DISMISSAL_LABEL[type] || type}</span>
                    <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}