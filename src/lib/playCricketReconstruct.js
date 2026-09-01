// Coarse ball-by-ball reconstruction from a summary scorecard.
// Produces one Delivery per legal ball: each batter's runs are spread across
// the balls they faced (4s, 6s, then singles/twos), each OUT batter's wicket
// falls on their final faced ball, strike rotates on odd runs and at over
// ends, and bowlers are round-robined across overs. No shot coordinates are
// produced, so heatmaps/wagon-wheel stay empty for reconstructed innings.

const mapDismissalToDelivery = (dt) => {
  const m = {
    bowled: "bowled",
    caught: "caught",
    lbw: "lbw",
    run_out: "run_out",
    stumped: "stumped",
    hit_wicket: "hit_wicket",
    retired_hurt: "retired_hurt",
    retired_out: "retired_out",
  };
  return m[dt] || "bowled";
};

const distributeBatterRuns = (runs, balls, fours, sixes) => {
  const seq = new Array(balls).fill(0);
  if (balls === 0) return seq;
  const boundaries = [];
  for (let i = 0; i < (fours || 0); i++) boundaries.push(4);
  for (let i = 0; i < (sixes || 0); i++) boundaries.push(6);
  boundaries.forEach((val, idx) => {
    const pos = Math.floor(((idx + 0.5) / Math.max(boundaries.length, 1)) * balls);
    let p = ((pos % balls) + balls) % balls;
    while (seq[p] !== 0) p = (p + 1) % balls;
    seq[p] = val;
  });
  let remaining = Math.max(0, (runs || 0) - 4 * (fours || 0) - 6 * (sixes || 0));
  for (let i = 0; i < balls && remaining > 0; i++) {
    if (seq[i] === 0) {
      const v = remaining >= 2 && i % 3 === 0 ? 2 : 1;
      seq[i] = Math.min(v, remaining);
      remaining -= seq[i];
    }
  }
  return seq;
};

// batters: [{ player_id, runs, balls, fours, sixes, is_out, dismissal_type }]
// bowlers: [{ player_id, overs }]  (overs decimal, e.g. 8.3)
// returns delivery-shaped objects (no match_id/innings_id; caller adds them)
export function reconstructInningsDeliveries(batters, bowlers) {
  const faced = (batters || []).filter((b) => b && b.balls > 0 && b.player_id);
  if (faced.length === 0) return [];
  const state = faced.map((b) => ({
    player_id: b.player_id,
    balls: b.balls,
    is_out: b.is_out,
    dismissal_type: b.dismissal_type,
    seq: distributeBatterRuns(b.runs, b.balls, b.fours, b.sixes),
    consumed: 0,
  }));

  const totalBalls = state.reduce((s, b) => s + b.balls, 0);
  const overs = Math.ceil(totalBalls / 6);

  const bowlerBudgets = (bowlers || [])
    .filter((b) => b && b.player_id)
    .map((b) => ({ player_id: b.player_id, balls: Math.round((parseFloat(b.overs) || 0) * 6) }));
  const overBowler = [];
  let bi = 0;
  for (let o = 0; o < overs; o++) {
    let cand = bi % Math.max(bowlerBudgets.length, 1);
    let attempts = 0;
    while (bowlerBudgets.length > 0 && bowlerBudgets[cand].balls <= 0 && attempts < bowlerBudgets.length) {
      cand = (cand + 1) % bowlerBudgets.length;
      attempts++;
    }
    if (bowlerBudgets.length === 0 || bowlerBudgets[cand].balls <= 0) {
      overBowler.push(null);
    } else {
      overBowler.push(bowlerBudgets[cand].player_id);
      bowlerBudgets[cand].balls -= 6;
      bi = cand + 1;
    }
  }

  const deliveries = [];
  let striker = 0;
  let nonStriker = 1;
  let nextIn = 2;
  for (let i = 0; i < totalBalls; i++) {
    if (striker >= state.length) break;
    const overNumber = Math.floor(i / 6);
    const ballInOver = (i % 6) + 1;
    const bowlerId = overBowler[overNumber] || null;
    const sB = state[striker];
    const run = sB.seq[sB.consumed] ?? 0;
    sB.consumed++;
    const isLastFaced = sB.consumed >= sB.balls;
    const isWicket = sB.is_out && isLastFaced;

    deliveries.push({
      over_number: overNumber,
      ball_in_over: ballInOver,
      delivery_number: i + 1,
      striker_id: sB.player_id,
      non_striker_id: state[nonStriker]?.player_id || null,
      bowler_id: bowlerId,
      runs_bat: run,
      runs_total: run,
      is_legal_delivery: true,
      is_dot_ball: run === 0,
      is_boundary: run === 4,
      is_six: run === 6,
      is_wicket: isWicket,
      wicket_type: isWicket ? mapDismissalToDelivery(sB.dismissal_type) : undefined,
      player_out_id: isWicket ? sB.player_id : undefined,
      timestamp: new Date().toISOString(),
    });

    if (isWicket) {
      striker = nextIn;
      nextIn++;
    } else if (run % 2 === 1) {
      [striker, nonStriker] = [nonStriker, striker];
    }
    if (ballInOver === 6) {
      [striker, nonStriker] = [nonStriker, striker];
    }
  }
  return deliveries;
}