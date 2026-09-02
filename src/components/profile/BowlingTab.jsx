import React, { useMemo } from 'react';
import { Zap, AlertTriangle, Target } from 'lucide-react';
import PitchHeatmap from '@/components/analytics/PitchHeatmap';
import { StatCard, InsightCard } from '@/components/analytics/StatCards';
import { getZone, zonesFor } from '@/lib/groundShape';
import {
  LENGTH_ZONES_ORDER, LENGTH_NORMALIZE, LENGTH_LABEL,
  DISMISSAL_LABEL,
} from '@/lib/analyticsShared';

// Full bowling insight tab: totals, zone economy/wickets, bowling pitch map, length performance, dismissals caused.
export default function BowlingTab({ bowlerDeliveries, bowlerInnings, groundShape }) {
  const ZONES = zonesFor(groundShape);

  const deliveries = useMemo(() => bowlerDeliveries.filter(d => !d.is_voided), [bowlerDeliveries]);
  const legal = useMemo(() => deliveries.filter(d => d.is_legal_delivery !== false), [deliveries]);

  const totals = useMemo(() => {
    let w = 0, runs = 0, balls = 0, maidens = 0, best = null;
    bowlerInnings.forEach(b => {
      const bw = b.wickets || 0;
      const br = b.runs_conceded || 0;
      w += bw; runs += br; balls += b.balls || 0; maidens += b.maidens || 0;
      if (bw > 0 && (!best || bw > best.w || (bw === best.w && br < best.r))) best = { w: bw, r: br };
    });
    return {
      w, runs, balls, maidens, best,
      overs: `${Math.floor(balls / 6)}.${balls % 6}`,
      econ: balls > 0 ? (runs / (balls / 6)).toFixed(2) : '0.00',
      avg: w > 0 ? (runs / w).toFixed(1) : '—',
    };
  }, [bowlerInnings]);

  const dots = legal.filter(d => (d.runs_total || 0) === 0 && !d.is_wicket).length;

  // Zone economy & wickets (where the ball was hit off this bowler)
  const zoneStats = useMemo(() => {
    const counts = {};
    ZONES.forEach(z => { counts[z] = { balls: 0, runs: 0, wickets: 0 }; });
    legal.filter(d => d.shot_x != null && d.shot_y != null).forEach(d => {
      const z = getZone(groundShape, d);
      if (counts[z]) {
        counts[z].balls++;
        counts[z].runs += d.runs_total || 0;
        if (d.is_wicket) counts[z].wickets++;
      }
    });
    return counts;
  }, [legal, ZONES, groundShape]);

  const zoneEcon = (z) => {
    const s = zoneStats[z];
    return s.balls >= 6 ? s.runs / (s.balls / 6) : null;
  };
  const mostProductiveZone = [...ZONES].filter(z => zoneStats[z].wickets > 0)
    .sort((a, b) => zoneStats[b].wickets - zoneStats[a].wickets)[0];
  const mostExpensiveZone = [...ZONES].filter(z => zoneEcon(z) != null)
    .sort((a, b) => zoneEcon(b) - zoneEcon(a))[0];
  const hasZoneData = ZONES.some(z => zoneStats[z].balls > 0);

  // Length performance (as bowler)
  const pitchLengthStats = useMemo(() => {
    const stats = {};
    LENGTH_ZONES_ORDER.forEach(l => { stats[l] = { balls: 0, runs: 0, wickets: 0 }; });
    legal.filter(d => d.length).forEach(d => {
      const key = LENGTH_NORMALIZE[d.length] || d.length;
      if (stats[key]) {
        stats[key].balls++;
        stats[key].runs += d.runs_total || 0;
        if (d.is_wicket) stats[key].wickets++;
      }
    });
    return stats;
  }, [legal]);

  const hasPitchData = legal.some(d => d.length);
  const worstLength = LENGTH_ZONES_ORDER
    .filter(l => pitchLengthStats[l].balls >= 3)
    .sort((a, b) => (pitchLengthStats[b].runs / (pitchLengthStats[b].balls / 6)) - (pitchLengthStats[a].runs / (pitchLengthStats[a].balls / 6)))[0];
  const bestLength = LENGTH_ZONES_ORDER
    .filter(l => pitchLengthStats[l].balls >= 3)
    .sort((a, b) => (pitchLengthStats[a].runs / (pitchLengthStats[a].balls / 6)) - (pitchLengthStats[b].runs / (pitchLengthStats[b].balls / 6)))[0];
  const mostWicketLength = LENGTH_ZONES_ORDER
    .filter(l => pitchLengthStats[l].wickets > 0)
    .sort((a, b) => pitchLengthStats[b].wickets - pitchLengthStats[a].wickets)[0];

  // Wickets by type (dismissals caused)
  const wicketTypeCounts = {};
  deliveries.filter(d => d.is_wicket && d.wicket_type).forEach(d => {
    wicketTypeCounts[d.wicket_type] = (wicketTypeCounts[d.wicket_type] || 0) + 1;
  });
  const totalWicketsFromDeliveries = Object.values(wicketTypeCounts).reduce((s, v) => s + v, 0);

  const sectionLabel = 'text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide';
  const hasBowled = totals.balls > 0 || totals.w > 0;

  return (
    <div className="space-y-6">
      {!hasBowled && legal.length === 0 ? (
        <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 text-center text-slate-500 text-sm">
          No bowling data recorded for this player yet.
        </div>
      ) : (
        <>
          <div>
            <p className={sectionLabel}>Bowling</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <StatCard label="Wickets" value={totals.w} color="text-red-400" />
              <StatCard label="Overs" value={totals.overs} />
              <StatCard label="Economy" value={totals.econ} color="text-amber-400" />
              <StatCard label="Average" value={totals.avg} />
              <StatCard label="Best" value={totals.best ? `${totals.best.w}/${totals.best.r}` : '—'} color="text-emerald-400" />
              <StatCard label="Dots" value={dots} />
            </div>
          </div>

          {/* Zone analysis */}
          {hasZoneData && (
            <div>
              <p className={sectionLabel}>Zone Analysis</p>
              <div className="grid gap-2 md:grid-cols-2 mb-3">
                {mostProductiveZone && <InsightCard icon={Target} title="Most Productive Zone" value={`${mostProductiveZone} (${zoneStats[mostProductiveZone].wickets} wicket${zoneStats[mostProductiveZone].wickets > 1 ? 's' : ''})`} color="bg-emerald-500/20 text-emerald-400" />}
                {mostExpensiveZone && <InsightCard icon={AlertTriangle} title="Most Expensive Zone" value={`${mostExpensiveZone} (${zoneEcon(mostExpensiveZone).toFixed(1)} econ)`} color="bg-red-500/20 text-red-400" />}
              </div>
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left p-3 text-slate-400 text-xs">Zone</th>
                        <th className="text-right p-3 text-slate-400 text-xs">Balls</th>
                        <th className="text-right p-3 text-slate-400 text-xs">Runs</th>
                        <th className="text-right p-3 text-slate-400 text-xs">Econ</th>
                        <th className="text-right p-3 text-slate-400 text-xs">W</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ZONES.filter(z => zoneStats[z].balls > 0).map(zone => {
                        const { balls, runs, wickets } = zoneStats[zone];
                        const econ = (runs / (balls / 6)).toFixed(1);
                        const econNum = parseFloat(econ);
                        const econColor = econNum > 10 ? 'text-red-400' : econNum < 7 ? 'text-emerald-400' : 'text-amber-400';
                        return (
                          <tr key={zone} className="border-b border-slate-700/30 last:border-0">
                            <td className="p-3 text-white font-medium">{zone}</td>
                            <td className="p-3 text-right text-slate-300">{balls}</td>
                            <td className="p-3 text-right text-amber-400 font-semibold">{runs}</td>
                            <td className={`p-3 text-right font-bold ${econColor}`}>{econ}</td>
                            <td className="p-3 text-right text-emerald-400 font-bold">{wickets > 0 ? wickets : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Bowling pitch map */}
          <div>
            <p className={sectionLabel}>Bowling Pitch Map — Where They Land It</p>
            <PitchHeatmap deliveries={legal} title="" />
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
                      <th className="text-right p-2.5 text-slate-400">Econ</th>
                      <th className="text-right p-2.5 text-slate-400">W</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LENGTH_ZONES_ORDER.filter(l => pitchLengthStats[l].balls > 0).map(l => {
                      const { balls, runs, wickets } = pitchLengthStats[l];
                      const econ = (runs / (balls / 6)).toFixed(1);
                      const econNum = parseFloat(econ);
                      const econColor = econNum > 10 ? 'text-red-400' : econNum < 7 ? 'text-emerald-400' : 'text-amber-400';
                      const isWorst = l === worstLength;
                      return (
                        <tr key={l} className={`border-b border-slate-700/30 last:border-0 ${isWorst ? 'bg-red-500/10 border-l-2 border-red-500/60' : ''}`}>
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
              <div className="space-y-2">
                {worstLength && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-red-400 mb-0.5">Most Expensive Length</div>
                      <div className="text-xs text-slate-300">{LENGTH_LABEL[worstLength]} — {(pitchLengthStats[worstLength].runs / (pitchLengthStats[worstLength].balls / 6)).toFixed(1)} economy at this length</div>
                    </div>
                  </div>
                )}
                {bestLength && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-3">
                    <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-emerald-400 mb-0.5">Most Effective Length</div>
                      <div className="text-xs text-slate-300">{LENGTH_LABEL[bestLength]} — {(pitchLengthStats[bestLength].runs / (pitchLengthStats[bestLength].balls / 6)).toFixed(1)} economy at this length</div>
                    </div>
                  </div>
                )}
                {mostWicketLength && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-3">
                    <Target className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-blue-400 mb-0.5">Wicket-Taking Length</div>
                      <div className="text-xs text-slate-300">{LENGTH_LABEL[mostWicketLength]} — {pitchLengthStats[mostWicketLength].wickets} wicket{pitchLengthStats[mostWicketLength].wickets > 1 ? 's' : ''} at this length</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dismissals caused */}
          {totalWicketsFromDeliveries > 0 && (
            <div>
              <p className={sectionLabel}>Dismissals Caused</p>
              <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 divide-y divide-slate-700/30">
                {Object.entries(wicketTypeCounts).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                  const pct = Math.round((count / totalWicketsFromDeliveries) * 100);
                  return (
                    <div key={type} className="px-3 py-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-white">{DISMISSAL_LABEL[type] || type}</span>
                        <span className="text-xs text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}