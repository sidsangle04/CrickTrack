// Derives innings totals, batting/bowling figures and partnerships from a
// normalized ball-by-ball log. Everything the scorecard, report and analytics
// views read is computed here, so an imported match is always internally
// consistent with its own deliveries.

const sum = (list, pick) => list.reduce((s, d) => s + (pick(d) || 0), 0);

const ensure = (map, id) => {
  if (!map.has(id)) {
    map.set(id, {
      player_id: id,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dots: 0,
      singles: 0,
      twos: 0,
      threes: 0,
      is_out: false,
      dismissal_type: null,
      dismissed_by_bowler_id: null,
      dismissed_by_fielder_id: null,
      status: "not_out",
      // bowling
      balls_bowled: 0,
      runs_conceded: 0,
      wickets: 0,
      wides: 0,
      no_balls: 0,
      dots_bowled: 0,
      fours_conceded: 0,
      sixes_conceded: 0,
      over_runs: {},
    });
  }
  return map.get(id);
};

export function summarizeInnings(deliveries) {
  const legal = deliveries.filter((d) => d.is_legal_delivery);
  const balls = legal.length;
  return {
    runs: sum(deliveries, (d) => d.runs_total),
    wickets: deliveries.filter((d) => d.is_wicket).length,
    balls,
    overs: Math.floor(balls / 6),
    extras: {
      wides: sum(deliveries, (d) => d.wide_runs),
      no_balls: sum(deliveries, (d) => d.no_ball_runs),
      byes: sum(deliveries, (d) => d.bye_runs),
      leg_byes: sum(deliveries, (d) => d.leg_bye_runs),
      penalty: sum(deliveries, (d) => d.penalty_runs),
    },
    fours: deliveries.filter((d) => d.runs_bat === 4).length,
    sixes: deliveries.filter((d) => d.runs_bat === 6).length,
  };
}

// One entry per player who batted or bowled, keyed by name (the writer maps
// names to player ids once the roster exists).
export function deriveFigures(deliveries) {
  const batters = new Map();
  const bowlers = new Map();
  const order = [];

  deliveries.forEach((d) => {
    if (d.striker && !order.includes(d.striker)) order.push(d.striker);
    if (d.non_striker && !order.includes(d.non_striker)) order.push(d.non_striker);

    if (d.striker) {
      const b = ensure(batters, d.striker);
      if (!d.is_wide) b.balls += 1;
      b.runs += d.runs_bat || 0;
      if (d.runs_bat === 4) b.fours += 1;
      if (d.runs_bat === 6) b.sixes += 1;
      if (d.is_dot_ball) b.dots += 1;
      if (d.runs_bat === 1) b.singles += 1;
      if (d.runs_bat === 2) b.twos += 1;
      if (d.runs_bat === 3) b.threes += 1;
    }
    if (d.non_striker) ensure(batters, d.non_striker);

    if (d.bowler) {
      const bw = ensure(bowlers, d.bowler);
      if (d.is_legal_delivery) bw.balls_bowled += 1;
      bw.runs_conceded += (d.runs_bat || 0) + (d.wide_runs || 0) + (d.no_ball_runs || 0);
      bw.wides += d.is_wide ? 1 : 0;
      bw.no_balls += d.is_no_ball ? 1 : 0;
      if (d.is_dot_ball) bw.dots_bowled += 1;
      if (d.runs_bat === 4) bw.fours_conceded += 1;
      if (d.runs_bat === 6) bw.sixes_conceded += 1;
      const key = d.over_number;
      bw.over_runs[key] = (bw.over_runs[key] || 0) + (d.runs_bat || 0) + (d.wide_runs || 0) + (d.no_ball_runs || 0);
    }

    if (d.is_wicket && d.player_out) {
      const b = ensure(batters, d.player_out);
      b.is_out = true;
      b.dismissal_type = d.wicket_type || null;
      b.status = d.wicket_type === "retired_hurt" ? "retired_hurt" : "out";
      b.dismissed_by_bowler_id = d.bowler || null;
      b.dismissed_by_fielder_id = d.fielder || null;
      if (d.bowler && !["run_out", "retired_hurt", "retired_out", "obstructing_field", "handled_ball", "timed_out"].includes(d.wicket_type)) {
        ensure(bowlers, d.bowler).wickets += 1;
      }
    }
  });

  const battingList = order
    .filter((name) => batters.has(name))
    .map((name, i) => ({ ...batters.get(name), batting_position: i + 1 }));

  const bowlingList = Array.from(bowlers.values()).map((b) => {
    const maidens = Object.values(b.over_runs).filter((r) => r === 0 && b.balls_bowled > 0).length;
    return {
      player_id: b.player_id,
      balls: b.balls_bowled,
      overs: Math.floor(b.balls_bowled / 6),
      runs_conceded: b.runs_conceded,
      wickets: b.wickets,
      maidens: Math.min(maidens, Math.floor(b.balls_bowled / 6)),
      wides: b.wides,
      no_balls: b.no_balls,
      dots: b.dots_bowled,
      fours_conceded: b.fours_conceded,
      sixes_conceded: b.sixes_conceded,
      economy: b.balls_bowled > 0 ? (b.runs_conceded / b.balls_bowled) * 6 : 0,
    };
  });

  return { batting: battingList, bowling: bowlingList };
}

export function derivePartnerships(deliveries) {
  const out = [];
  let current = null;
  let wicketNumber = 1;

  deliveries.forEach((d) => {
    const pair = [d.striker, d.non_striker].filter(Boolean).sort().join("|");
    if (!current || current.key !== pair) {
      if (current) out.push(current);
      current = {
        key: pair,
        wicket_number: wicketNumber,
        batter1_id: d.striker,
        batter2_id: d.non_striker,
        runs: 0,
        balls: 0,
        batter1_runs: 0,
        batter1_balls: 0,
        batter2_runs: 0,
        batter2_balls: 0,
        how_ended: "",
        is_active: false,
      };
    }
    current.runs += d.runs_total || 0;
    if (d.is_legal_delivery) current.balls += 1;
    if (d.striker === current.batter1_id) {
      current.batter1_runs += d.runs_bat || 0;
      if (!d.is_wide) current.batter1_balls += 1;
    } else if (d.striker === current.batter2_id) {
      current.batter2_runs += d.runs_bat || 0;
      if (!d.is_wide) current.batter2_balls += 1;
    }
    if (d.is_wicket) {
      current.how_ended = d.wicket_type || "";
      out.push(current);
      current = null;
      wicketNumber += 1;
    }
  });

  if (current) {
    current.is_active = true;
    out.push(current);
  }
  return out.map(({ key, ...p }) => p);
}