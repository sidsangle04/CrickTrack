// Head-to-head maths for the Compare section.
// Builds the direct batter-vs-bowler record from ball-by-ball deliveries and
// each player's output in the matches they both appeared in.

// Dismissal types credited to the bowler (run outs / retirements don't count)
const BOWLER_CREDITED = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'];

// Runs the bowler is charged with (byes, leg byes and penalties are not his)
const concededOn = (d) =>
  (d.runs_total || 0) - (d.bye_runs || 0) - (d.leg_bye_runs || 0) - (d.penalty_runs || 0);

const matchIdsOf = (items) => new Set(items.map((i) => i.match_id));

// One batter's figures against one specific bowler.
function againstBowler(batterId, deliveries) {
  const d = deliveries.filter((x) => x.striker_id === batterId);
  const balls = d.filter((x) => !x.is_wide).length;
  const legalBalls = d.filter((x) => x.is_legal_delivery !== false).length;
  const runs = d.reduce((s, x) => s + (x.runs_bat || 0), 0);
  const fours = d.filter((x) => (x.runs_bat || 0) === 4).length;
  const sixes = d.filter((x) => (x.runs_bat || 0) === 6).length;
  const dots = d.filter((x) => (x.runs_total || 0) === 0 && !x.is_wicket).length;
  const conceded = d.reduce((s, x) => s + concededOn(x), 0);
  const outs = d.filter(
    (x) => x.is_wicket && x.player_out_id === batterId && BOWLER_CREDITED.includes(x.wicket_type)
  );

  return {
    deliveries: d.length,
    balls,
    runs,
    fours,
    sixes,
    dots,
    conceded,
    dismissals: outs.length,
    dismissalTypes: outs.map((x) => x.wicket_type),
    strikeRate: balls > 0 ? (runs / balls) * 100 : 0,
    economy: legalBalls > 0 ? (conceded / legalBalls) * 6 : 0,
    matches: matchIdsOf(d).size,
    // Points the batter earns in the duel, and the points his bowling earns him
    batPoints: runs + fours * 2 + sixes * 4,
    bowlPoints: outs.length * 25 + dots * 1.5,
  };
}

// A player's runs and wickets across a given set of matches.
function inMatches(playerId, matchIds, batterInnings, bowlerInnings) {
  const bat = batterInnings.filter((b) => b.player_id === playerId && matchIds.has(b.match_id));
  const bowl = bowlerInnings.filter((b) => b.player_id === playerId && matchIds.has(b.match_id));

  const runs = bat.reduce((s, b) => s + (b.runs || 0), 0);
  const balls = bat.reduce((s, b) => s + (b.balls_faced || 0), 0);
  const wickets = bowl.reduce((s, b) => s + (b.wickets || 0), 0);
  const bowlBalls = bowl.reduce((s, b) => s + (b.overs || 0) * 6 + (b.balls || 0), 0);
  const bowlRuns = bowl.reduce((s, b) => s + (b.runs_conceded || 0), 0);

  return {
    battingInnings: bat.length,
    runs,
    strikeRate: balls > 0 ? (runs / balls) * 100 : 0,
    bowlingInnings: bowl.length,
    wickets,
    economy: bowlBalls > 0 ? (bowlRuns / bowlBalls) * 6 : 0,
  };
}

export function buildHeadToHead({ playerA, playerB, deliveries, batterInnings, bowlerInnings, matches }) {
  // Who appeared in which match: playing XI, or an innings record for that game
  const appearances = new Map();
  const note = (matchId, playerId) => {
    if (!appearances.has(matchId)) appearances.set(matchId, new Set());
    appearances.get(matchId).add(playerId);
  };
  batterInnings.forEach((b) => note(b.match_id, b.player_id));
  bowlerInnings.forEach((b) => note(b.match_id, b.player_id));

  const played = (m, playerId) =>
    (m.team1_playing_xi || []).includes(playerId) ||
    (m.team2_playing_xi || []).includes(playerId) ||
    appearances.get(m.id)?.has(playerId) === true;

  const shared = matches.filter((m) => played(m, playerA.id) && played(m, playerB.id));
  const sharedIds = matchIdsOf(shared);
  const sharedDeliveries = deliveries.filter((d) => sharedIds.has(d.match_id));

  const aVsB = againstBowler(playerA.id, sharedDeliveries.filter((d) => d.bowler_id === playerB.id));
  const bVsA = againstBowler(playerB.id, sharedDeliveries.filter((d) => d.bowler_id === playerA.id));

  const duelDeliveries = sharedDeliveries.filter(
    (d) =>
      (d.striker_id === playerA.id && d.bowler_id === playerB.id) ||
      (d.striker_id === playerB.id && d.bowler_id === playerA.id)
  );

  const pointsA = aVsB.batPoints + bVsA.bowlPoints;
  const pointsB = bVsA.batPoints + aVsB.bowlPoints;
  const total = pointsA + pointsB;
  const duelShareA = total > 0 ? (pointsA / total) * 100 : 50;

  return {
    sharedCount: shared.length,
    withBallByBall: matchIdsOf(sharedDeliveries).size,
    duelMatches: matchIdsOf(duelDeliveries).size,
    hasDuel: aVsB.deliveries > 0 || bVsA.deliveries > 0,
    aVsB,
    bVsA,
    duelShareA,
    // A gap of five points or less means neither player holds a real upper hand
    duelEven: Math.abs(duelShareA - 50) <= 5,
    sharedA: inMatches(playerA.id, sharedIds, batterInnings, bowlerInnings),
    sharedB: inMatches(playerB.id, sharedIds, batterInnings, bowlerInnings),
  };
}