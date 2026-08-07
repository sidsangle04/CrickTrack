import React, { useMemo } from 'react';
import { Award, Crown } from 'lucide-react';

function ovStr(balls) { return `${Math.floor(balls / 6)}.${balls % 6}`; }

const WICKET_VALUE = 25;
const CATCH_POINTS = 8;
const STUMPING_POINTS = 8;
const RUN_OUT_POINTS = 12;

function computePlayerRatings({ innings, batterInnings, bowlerInnings, deliveries }) {
  const reg = innings.filter(i => !i.is_super_over).map(i => i.id);
  const validInn = (id) => reg.includes(id);

  const ratings = {};

  const ensure = (playerId, teamId) => {
    if (!ratings[playerId]) ratings[playerId] = { player_id: playerId, team_id: teamId, batting: 0, bowling: 0, fielding: 0, breakdown: {} };
    if (teamId && !ratings[playerId].team_id) ratings[playerId].team_id = teamId;
    return ratings[playerId];
  };

  // Batting
  batterInnings.filter(b => validInn(b.innings_id)).forEach(b => {
    const r = ensure(b.player_id);
    let pts = 0;
    const runs = b.runs || 0;
    const balls = b.balls_faced || 0;
    const fours = b.fours || 0;
    const sixes = b.sixes || 0;

    pts += runs; // base runs
    pts += fours * 1 + sixes * 2; // boundaries
    if (runs >= 100) pts += 10;
    else if (runs >= 50) pts += 5;
    if (balls > 0) {
      const sr = (runs / balls) * 100;
      if (sr > 130) pts += 0.5 * (sr - 130);
      else if (sr < 100) pts -= 0.5 * (100 - sr);
    }
    r.batting = pts;
    r.breakdown.batting = { runs, balls, fours, sixes, sr: balls > 0 ? (runs / balls) * 100 : 0, pts };
  });

  // Bowling
  bowlerInnings.filter(b => validInn(b.innings_id)).forEach(b => {
    const r = ensure(b.player_id);
    let pts = 0;
    const wickets = b.wickets || 0;
    const runsConceded = b.runs_conceded || 0;
    const balls = b.balls || 0;
    const dots = b.dots || 0;

    pts += wickets * WICKET_VALUE;
    pts += dots; // dot ball bonus
    if (balls > 0) {
      const econ = runsConceded / (balls / 6);
      if (econ < 6) pts += 3 * (6 - econ);
      else if (econ > 9) pts -= 3 * (econ - 9);
    }
    r.bowling = pts;
    r.breakdown.bowling = { wickets, runsConceded, balls, dots, econ: balls > 0 ? runsConceded / (balls / 6) : 0, pts };
  });

  // Fielding — from deliveries (catches, stumpings, run outs via fielder_id)
  deliveries.filter(d => !d.is_voided && validInn(d.innings_id) && d.is_wicket && d.fielder_id).forEach(d => {
    const r = ensure(d.fielder_id);
    if (d.wicket_type === 'caught') r.fielding += CATCH_POINTS;
    else if (d.wicket_type === 'stumped') r.fielding += STUMPING_POINTS;
    else if (d.wicket_type === 'run_out') r.fielding += RUN_OUT_POINTS;
    r.breakdown.fielding = r.breakdown.fielding || { catches: 0, stumpings: 0, runOuts: 0, pts: 0 };
    if (d.wicket_type === 'caught') r.breakdown.fielding.catches += 1;
    else if (d.wicket_type === 'stumped') r.breakdown.fielding.stumpings += 1;
    else if (d.wicket_type === 'run_out') r.breakdown.fielding.runOuts += 1;
  });
  Object.values(ratings).forEach(r => {
    if (r.breakdown.fielding) r.breakdown.fielding.pts = r.fielding;
  });

  const ranked = Object.values(ratings).map(r => ({ ...r, total: r.batting + r.bowling + r.fielding }))
    .filter(r => r.total !== 0)
    .sort((a, b) => b.total - a.total);

  return ranked;
}

export { computePlayerRatings };

export default function PlayerOfMatch({ innings, batterInnings, bowlerInnings, deliveries, playersMap, teamsMap }) {
  const ranked = useMemo(() => computePlayerRatings({ innings, batterInnings, bowlerInnings, deliveries }), [innings, batterInnings, bowlerInnings, deliveries]);

  if (ranked.length === 0) return null;

  const winner = ranked[0];
  const p = (id) => playersMap[id]?.name || 'Unknown';
  const t = (id) => teamsMap[id]?.name || 'Team';

  const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);

  return (
    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Player of the Match</h2>
      </div>

      {/* Winner card */}
      <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 rounded-xl p-4 border border-amber-500/40 mb-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-lg truncate">{p(winner.player_id)}</div>
          <div className="text-xs text-amber-300/80">{t(winner.team_id)}</div>
          <div className="text-xs text-slate-400 mt-1">
            Bat {fmt(winner.batting)} · Bowl {fmt(winner.bowling)} · Field {fmt(winner.fielding)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-3xl font-black text-amber-400 leading-none">{fmt(winner.total)}</div>
          <div className="text-[10px] text-amber-300/70 uppercase tracking-wider mt-1">Rating</div>
        </div>
      </div>

      {/* Ranked table */}
      <div className="space-y-1">
        {ranked.slice(0, 5).map((r, idx) => (
          <div key={r.player_id} className="flex items-center gap-3 text-xs py-1.5 px-2 rounded-lg hover:bg-slate-700/30">
            <span className={`w-5 text-center font-bold ${idx === 0 ? 'text-amber-400' : 'text-slate-500'}`}>{idx + 1}</span>
            <span className="flex-1 text-white font-medium truncate">{p(r.player_id)}</span>
            <span className="text-slate-400 w-14 text-right">{fmt(r.batting)}</span>
            <span className="text-slate-400 w-14 text-right">{fmt(r.bowling)}</span>
            <span className="text-slate-400 w-14 text-right">{fmt(r.fielding)}</span>
            <span className="text-white font-bold w-16 text-right">{fmt(r.total)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-2 px-2">
        <span className="w-5" />
        <span className="flex-1">Player</span>
        <span className="w-14 text-right">Bat</span>
        <span className="w-14 text-right">Bowl</span>
        <span className="w-14 text-right">Field</span>
        <span className="w-16 text-right">Total</span>
      </div>
    </div>
  );
}