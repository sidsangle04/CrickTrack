import React, { useMemo } from 'react';
import { StatCard } from '@/components/analytics/StatCards';
import PartnershipCard from '@/components/analytics/PartnershipCard';

// Career overview: aggregate batting + bowling numbers, recent form, best partnerships.
export default function OverviewTab({ batterInnings, bowlerInnings, partnerships, playersMap }) {
  const batting = useMemo(() => {
    let runs = 0, balls = 0, outs = 0, inns = 0, fours = 0, sixes = 0, hs = 0;
    batterInnings.forEach(b => {
      if (b.status === 'yet_to_bat') return;
      inns++;
      runs += b.runs || 0;
      balls += b.balls_faced || 0;
      fours += b.fours || 0;
      sixes += b.sixes || 0;
      if (b.is_out) outs++;
      if ((b.runs || 0) > hs) hs = b.runs || 0;
    });
    return {
      runs, balls, outs, inns, fours, sixes, hs,
      avg: outs > 0 ? (runs / outs).toFixed(1) : runs > 0 ? '∞' : '0.0',
      sr: balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0',
    };
  }, [batterInnings]);

  const bowling = useMemo(() => {
    let w = 0, runs = 0, balls = 0, maidens = 0, best = null;
    bowlerInnings.forEach(b => {
      const bw = b.wickets || 0;
      const br = b.runs_conceded || 0;
      w += bw; runs += br; balls += b.balls || 0; maidens += b.maidens || 0;
      if (bw > 0 && (!best || bw > best.w || (bw === best.w && br < best.r))) best = { w: bw, r: br };
    });
    return {
      w, runs, balls, maidens,
      overs: `${Math.floor(balls / 6)}.${balls % 6}`,
      econ: balls > 0 ? (runs / (balls / 6)).toFixed(2) : '0.00',
      avg: w > 0 ? (runs / w).toFixed(1) : '—',
      best: best ? `${best.w}/${best.r}` : '—',
    };
  }, [bowlerInnings]);

  const recent = useMemo(
    () => [...batterInnings].filter(b => b.status !== 'yet_to_bat')
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5),
    [batterInnings]
  );

  const hasData = batting.inns > 0 || bowling.balls > 0;

  return (
    <div className="space-y-6">
      {!hasData ? (
        <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 text-center text-slate-500 text-sm">
          No match data recorded for this player yet.
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Batting</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <StatCard label="Runs" value={batting.runs} color="text-emerald-400" />
              <StatCard label="Innings" value={batting.inns} />
              <StatCard label="Highest" value={batting.hs} color="text-emerald-400" />
              <StatCard label="Average" value={batting.avg} color="text-amber-400" />
              <StatCard label="Strike Rate" value={batting.sr} color="text-amber-400" />
              <StatCard label="4s / 6s" value={`${batting.fours}/${batting.sixes}`} />
            </div>
          </div>

          {(bowling.balls > 0 || bowling.w > 0) && (
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Bowling</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <StatCard label="Wickets" value={bowling.w} color="text-red-400" />
                <StatCard label="Overs" value={bowling.overs} />
                <StatCard label="Best" value={bowling.best} color="text-emerald-400" />
                <StatCard label="Economy" value={bowling.econ} color="text-amber-400" />
                <StatCard label="Average" value={bowling.avg} />
                <StatCard label="Maidens" value={bowling.maidens} />
              </div>
            </div>
          )}

          {recent.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Recent Form</p>
              <div className="flex gap-2 flex-wrap">
                {recent.map(b => {
                  const runs = b.runs || 0;
                  const color = runs >= 50 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : runs >= 25 ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    : 'bg-slate-700/50 text-slate-300 border-slate-600';
                  return (
                    <div key={b.id} className={`px-3 py-1.5 rounded-xl border text-sm font-bold ${color}`}>
                      {runs}{b.is_out ? '' : '*'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {partnerships.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Best Partnerships</p>
              <div className="space-y-2">
                {partnerships.map((p, i) => (
                  <PartnershipCard key={p.id} partnership={p} playersMap={playersMap} rank={i + 1} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}