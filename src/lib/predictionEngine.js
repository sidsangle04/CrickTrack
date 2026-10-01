// Win-probability engine. All maths runs client-side so the numbers can update
// on every ball with no latency and no integration cost.
import { getMaxWickets, isTestMatch } from './testCricket';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const logistic = (x) => 100 / (1 + Math.exp(-x));

// ---- Player ratings, built from aggregate rows ----
// Rows come from BatterInnings / BowlerInnings aggregates: { player_id, count, sum_* }

export function battingRating(row) {
  if (!row) return 35;
  const innings = Math.max(1, row.count || 0);
  const runs = row.sum_runs || 0;
  const balls = row.sum_balls_faced || 0;
  const average = runs / innings;
  const strikeRate = balls ? (runs / balls) * 100 : 0;
  return clamp(20 + average * 0.9 + (strikeRate - 100) * 0.25, 10, 95);
}

export function bowlingRating(row) {
  if (!row || !(row.sum_balls || 0)) return 40;
  const overs = row.sum_balls / 6;
  const wicketsPerOver = (row.sum_wickets || 0) / overs;
  const economy = (row.sum_runs_conceded || 0) / overs;
  return clamp(22 + wicketsPerOver * 90 + (8 - economy) * 4, 10, 95);
}

export function buildRatingMap({ bat = [], bowl = [] } = {}) {
  const batRows = {};
  const bowlRows = {};
  bat.forEach((r) => { batRows[r.player_id] = r; });
  bowl.forEach((r) => { bowlRows[r.player_id] = r; });
  const map = {};
  new Set([...Object.keys(batRows), ...Object.keys(bowlRows)]).forEach((id) => {
    map[id] = {
      batting: battingRating(batRows[id]),
      bowling: bowlingRating(bowlRows[id]),
      hasBatting: !!batRows[id],
      hasBowling: !!bowlRows[id]
    };
  });
  return map;
}

export function teamProfile(playerIds = [], ratingMap = {}) {
  const known = playerIds.map((id) => ratingMap[id]).filter(Boolean);
  if (!known.length) return { batting: 45, bowling: 45, overall: 45, known: 0 };
  const batting = known.reduce((s, p) => s + p.batting, 0) / known.length;
  const bowling = known.reduce((s, p) => s + p.bowling, 0) / known.length;
  return { batting, bowling, overall: (batting + bowling) / 2, known: known.length };
}

export function teamForm(matches = [], teamId, limit = 5) {
  const played = matches
    .filter((m) => m.team1_id === teamId || m.team2_id === teamId)
    .slice(0, limit);
  if (!played.length) return { wins: 0, played: 0, score: 0 };
  const wins = played.filter((m) => m.winner_id === teamId).length;
  return { wins, played: played.length, score: (wins / played.length - 0.5) * 100 };
}

// ---- Pre-match prediction ----
// Blends each side's player ratings, their players' record against this
// opposition, and both teams' recent form.
export function predictPreMatch({
  team1Id,
  team2Id,
  team1XI = [],
  team2XI = [],
  ratings = {},
  h2h1 = {},
  h2h2 = {},
  matches = []
}) {
  const t1 = teamProfile(team1XI, ratings);
  const t2 = teamProfile(team2XI, ratings);
  const opp1 = teamProfile(team1XI, h2h1);
  const opp2 = teamProfile(team2XI, h2h2);
  const form1 = teamForm(matches, team1Id);
  const form2 = teamForm(matches, team2Id);

  // Each side's batting measured against the other side's bowling.
  const edge = (t1.batting - t2.bowling) - (t2.batting - t1.bowling);
  const h2hKnown = opp1.known > 0 && opp2.known > 0;
  const h2hEdge = h2hKnown ? (opp1.overall - opp2.overall) * 0.5 : 0;
  const formKnown = form1.played > 0 && form2.played > 0;
  const formEdge = formKnown ? (form1.score - form2.score) * 0.35 : 0;

  const net = edge + h2hEdge + formEdge;
  const team1Pct = clamp(Math.round(logistic(net * 0.04)), 5, 95);

  return {
    team1Pct,
    team2Pct: 100 - team1Pct,
    drivers: {
      ratings1: Math.round(t1.overall),
      ratings2: Math.round(t2.overall),
      batting1: Math.round(t1.batting),
      bowling1: Math.round(t1.bowling),
      batting2: Math.round(t2.batting),
      bowling2: Math.round(t2.bowling),
      form1,
      form2,
      h2h1: h2hKnown ? Math.round(opp1.overall) : null,
      h2h2: h2hKnown ? Math.round(opp2.overall) : null,
      sample1: t1.known,
      sample2: t2.known
    }
  };
}

export function preMatchSummary(prediction) {
  if (!prediction) return '';
  const d = prediction.drivers;
  const bits = [`XI rating ${d.ratings1} v ${d.ratings2}`];
  if (d.form1.played || d.form2.played) {
    bits.push(`Form ${d.form1.wins}-${d.form1.played - d.form1.wins} v ${d.form2.wins}-${d.form2.played - d.form2.wins}`);
  }
  if (d.h2h1 !== null) bits.push(`Head-to-head ${d.h2h1} v ${d.h2h2}`);
  return bits.join(' · ');
}

// ---- Live prediction ----
// Recalculated from the situation (runs, wickets, balls left, required rate)
// blended with the pre-match prior and the players actually on the park.
export function predictLive({
  match,
  innings,
  allInnings = [],
  ratingMap = {},
  priorTeam1Pct = 50,
  parScore = null
}) {
  if (!match || !innings) return null;

  const battingIsTeam1 = innings.batting_team_id === match.team1_id;
  const prior = clamp(battingIsTeam1 ? (priorTeam1Pct ?? 50) : 100 - (priorTeam1Pct ?? 50), 5, 95);
  const test = isTestMatch(match);
  const maxWickets = innings.is_super_over ? 2 : getMaxWickets(match);
  const wicketsLeft = Math.max(0, maxWickets - (innings.total_wickets || 0));
  const runs = innings.total_runs || 0;
  const ballsBowled = (innings.current_over_number || 0) * 6 + (innings.current_ball_in_over || 0);

  // The batters at the crease against the bowler on now.
  const striker = (ratingMap[innings.current_striker_id] || {}).batting ?? 45;
  const nonStriker = (ratingMap[innings.current_non_striker_id] || {}).batting ?? 45;
  const bowler = (ratingMap[innings.current_bowler_id] || {}).bowling ?? 45;
  const strengthEdge = (((striker + nonStriker) / 2) - bowler) * 0.08;

  const settle = (battingPct, why) => ({
    battingPct,
    bowlingPct: 100 - battingPct,
    team1Pct: battingIsTeam1 ? battingPct : 100 - battingPct,
    team2Pct: battingIsTeam1 ? 100 - battingPct : battingPct,
    battingTeamId: innings.batting_team_id,
    bowlingTeamId: innings.bowling_team_id,
    why
  });

  // Test cricket: lead/trail carries the weight.
  if (test) {
    const totals = (teamId) => allInnings
      .filter((i) => i.batting_team_id === teamId)
      .reduce((s, i) => s + (i.total_runs || 0), 0);
    const lead = totals(innings.batting_team_id) - totals(innings.bowling_team_id);
    const situational = logistic((lead + strengthEdge * 2) / 55);
    const battingPct = clamp(Math.round(0.6 * situational + 0.4 * prior), 1, 99);
    return settle(battingPct, lead >= 0 ? `Lead by ${lead} run${lead === 1 ? '' : 's'}` : `Trail by ${-lead} runs`);
  }

  const maxOvers = innings.is_super_over ? 1 : (match.overs_per_innings || 20);
  const ballsLeft = Math.max(0, maxOvers * 6 - ballsBowled);
  const oversLeft = ballsLeft / 6;
  const target = innings.target;

  // Chasing.
  if (target) {
    const need = target - runs;
    if (need <= 0) return settle(100, 'Target achieved');
    if (!wicketsLeft) return settle(0, `All out — ${need} short`);
    if (!ballsLeft) return settle(0, `${need} short of the target`);
    const currentRate = ballsBowled ? runs / (ballsBowled / 6) : need / oversLeft;
    const capacity = 6.5 + 3.5 * (wicketsLeft / maxWickets) + (currentRate - 6.5) * 0.35;
    const projected = runs + capacity * oversLeft + strengthEdge;
    const situational = logistic((projected - target) / 10);
    const battingPct = clamp(Math.round(0.72 * situational + 0.28 * prior), 1, 99);
    return settle(battingPct, `Need ${need} off ${ballsLeft} ball${ballsLeft === 1 ? '' : 's'} · ${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'} in hand`);
  }

  // First innings: projected score against par.
  const par = parScore || maxOvers * 7;
  const currentRate = ballsBowled ? runs / (ballsBowled / 6) : 0;
  const capacity = ballsBowled
    ? 6.5 + 3.5 * (wicketsLeft / maxWickets) + (currentRate - 6.5) * 0.5
    : 7.2;
  const projected = runs + capacity * oversLeft + strengthEdge;
  const situational = logistic((projected - par) / 12);
  const battingPct = clamp(Math.round(0.6 * situational + 0.4 * prior), 1, 99);
  return settle(battingPct, `Projected ${Math.round(projected)} vs par ${Math.round(par)}`);
}