// Writes a parsed ball-by-ball import plan into the CrickTrack data model.
// Finds-or-creates Team and Player records (scoped to the active ground_mode),
// then creates the Match, Innings, BatterInnings, BowlerInnings, Partnership
// and Delivery records so the imported game behaves exactly like a scored one
// in the scorecard, match report and analytics views.

import { base44 } from "@/api/base44Client";
import { summarizeInnings, deriveFigures, derivePartnerships } from "./ballByBallDerive.js";

const chunk = (list, size) => {
  const out = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
};

const clean = (obj) => {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) out[k] = v;
  });
  return out;
};

export async function writeBallByBallMatch(plan, mode, addLog = () => {}) {
  const { match: info, innings } = plan;
  const playersPerTeam = 11;
  const maxWickets = playersPerTeam - 1;

  addLog("🔍 Setting up teams...");
  const allTeams = await base44.entities.Team.list();
  const modeTeams = allTeams.filter((t) => (t.ground_mode || "turf") === mode);

  const findOrCreateTeam = async (name) => {
    const existing = modeTeams.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) { addLog(`  Team found: ${existing.name}`); return existing; }
    const created = await base44.entities.Team.create({
      name,
      short_name: (name.substring(0, 4) || "TEAM").toUpperCase(),
      ground_mode: mode,
    });
    modeTeams.push(created);
    addLog(`  Team created: ${name}`);
    return created;
  };

  const team1 = await findOrCreateTeam(info.team1Name);
  const team2 = await findOrCreateTeam(info.team2Name);
  const teamIds = { team1: team1.id, team2: team2.id };
  const teamNames = { team1: team1.name, team2: team2.name };

  // Which names belong to which side, read straight off the ball-by-ball log.
  const namesByTeam = { team1: new Set(), team2: new Set() };
  innings.forEach((inn) => {
    const other = inn.battingTeam === "team1" ? "team2" : "team1";
    inn.deliveries.forEach((d) => {
      namesByTeam[inn.battingTeam].add(d.striker);
      namesByTeam[inn.battingTeam].add(d.non_striker);
      if (d.player_out) namesByTeam[inn.battingTeam].add(d.player_out);
      namesByTeam[other].add(d.bowler);
      if (d.fielder) namesByTeam[other].add(d.fielder);
      if (d.dropped_by) namesByTeam[other].add(d.dropped_by);
    });
  });

  addLog("👥 Setting up players...");
  const allPlayers = await base44.entities.Player.list();
  const modePlayers = allPlayers.filter((p) => (p.ground_mode || "turf") === mode);
  const playerId = { team1: {}, team2: {} };

  const findOrCreatePlayer = async (name, side) => {
    if (!name) return null;
    if (playerId[side][name]) return playerId[side][name];
    const teamId = teamIds[side];
    const existing = modePlayers.find(
      (p) => p.name.toLowerCase() === name.toLowerCase() && p.team_id === teamId
    );
    if (existing) {
      playerId[side][name] = existing.id;
      return existing.id;
    }
    const created = await base44.entities.Player.create({
      name,
      team_id: teamId,
      role: "all_rounder",
      ground_mode: mode,
    });
    modePlayers.push(created);
    playerId[side][name] = created.id;
    return created.id;
  };

  for (const side of ["team1", "team2"]) {
    for (const name of namesByTeam[side]) {
      await findOrCreatePlayer(name, side);
    }
  }
  addLog(`  ${Object.keys(playerId.team1).length + Object.keys(playerId.team2).length} players ready`);

  const summaries = innings.map((inn) => summarizeInnings(inn.deliveries));
  const first = summaries[0] || { runs: 0, wickets: 0 };
  const second = summaries[1];

  let resultText = info.result || "";
  let winnerSide = "";
  if (!resultText && second) {
    if (second.runs > first.runs) {
      const left = Math.max(maxWickets - second.wickets, 1);
      resultText = `${teamNames[innings[1].battingTeam]} won by ${left} wicket${left === 1 ? "" : "s"}`;
      winnerSide = innings[1].battingTeam;
    } else if (second.runs < first.runs) {
      const margin = first.runs - second.runs;
      resultText = `${teamNames[innings[0].battingTeam]} won by ${margin} run${margin === 1 ? "" : "s"}`;
      winnerSide = innings[0].battingTeam;
    } else {
      resultText = "Match tied";
    }
  }

  const xiFor = (side) => Array.from(namesByTeam[side]).map((n) => playerId[side][n]).filter(Boolean);

  addLog("🏏 Creating match record...");
  const match = await base44.entities.Match.create({
    date: info.date,
    venue: info.venue || "Unknown",
    team1_id: team1.id,
    team2_id: team2.id,
    team1_playing_xi: xiFor("team1"),
    team2_playing_xi: xiFor("team2"),
    overs_per_innings: info.oversPerInnings,
    players_per_team: playersPerTeam,
    ball_type: info.ballType,
    format: "limited",
    status: "completed",
    result: resultText,
    winner_id: winnerSide ? teamIds[winnerSide] : "",
    ground_mode: mode,
    batting_team_id: teamIds[innings[0].battingTeam],
    bowling_team_id: teamIds[innings[0].battingTeam === "team1" ? "team2" : "team1"],
    enable_visual_tagging: true,
  });
  addLog(`  Match created (ID: ${match.id})`);

  addLog("📊 Creating innings...");
  let runningTotal = 0;
  for (let i = 0; i < innings.length; i++) {
    const inn = innings[i];
    const other = inn.battingTeam === "team1" ? "team2" : "team1";
    const s = summaries[i];
    const endReason =
      s.wickets >= maxWickets ? "all_out" : i > 0 && s.runs > runningTotal ? "target_reached" : "overs_complete";

    const inningsRecord = await base44.entities.Innings.create(clean({
      match_id: match.id,
      innings_number: inn.number,
      batting_team_id: teamIds[inn.battingTeam],
      bowling_team_id: teamIds[other],
      total_runs: s.runs,
      total_wickets: s.wickets,
      total_balls: s.balls,
      total_overs: s.overs,
      extras_wide: s.extras.wides,
      extras_no_ball: s.extras.no_balls,
      extras_byes: s.extras.byes,
      extras_leg_byes: s.extras.leg_byes,
      extras_penalty: s.extras.penalty,
      target: i > 0 ? runningTotal + 1 : undefined,
      status: "completed",
      end_reason: endReason,
    }));
    addLog(`  Innings ${inn.number}: ${s.runs}/${s.wickets} (${s.overs} ov)`);

    const figures = deriveFigures(inn.deliveries);
    const sideOf = (name) =>
      namesByTeam[inn.battingTeam].has(name) ? inn.battingTeam : other;
    const idFor = (name) => (name ? playerId[sideOf(name)][name] : null);

    const batterRows = figures.batting.map((b) => clean({
      match_id: match.id,
      innings_id: inningsRecord.id,
      player_id: idFor(b.player_id),
      batting_position: b.batting_position,
      runs: b.runs,
      balls_faced: b.balls,
      fours: b.fours,
      sixes: b.sixes,
      dots: b.dots,
      singles: b.singles,
      twos: b.twos,
      threes: b.threes,
      strike_rate: b.balls > 0 ? (b.runs / b.balls) * 100 : 0,
      is_out: b.is_out,
      dismissal_type: b.is_out ? b.dismissal_type : undefined,
      dismissed_by_bowler_id: b.is_out ? idFor(b.dismissed_by_bowler_id) : undefined,
      dismissed_by_fielder_id: b.is_out ? idFor(b.dismissed_by_fielder_id) : undefined,
      status: b.status,
    })).filter((r) => r.player_id);
    for (const batch of chunk(batterRows, 200)) await base44.entities.BatterInnings.bulkCreate(batch);

    const bowlerRows = figures.bowling.map((b) => clean({
      match_id: match.id,
      innings_id: inningsRecord.id,
      player_id: idFor(b.player_id),
      overs: b.overs,
      balls: b.balls,
      runs_conceded: b.runs_conceded,
      wickets: b.wickets,
      maidens: b.maidens,
      economy: b.economy,
      wides: b.wides,
      no_balls: b.no_balls,
      dots: b.dots,
      fours_conceded: b.fours_conceded,
      sixes_conceded: b.sixes_conceded,
    })).filter((r) => r.player_id);
    for (const batch of chunk(bowlerRows, 200)) await base44.entities.BowlerInnings.bulkCreate(batch);

    const partnerRows = derivePartnerships(inn.deliveries).map((p) => clean({
      match_id: match.id,
      innings_id: inningsRecord.id,
      wicket_number: p.wicket_number,
      batter1_id: idFor(p.batter1_id),
      batter2_id: idFor(p.batter2_id),
      runs: p.runs,
      balls: p.balls,
      batter1_runs: p.batter1_runs,
      batter1_balls: p.batter1_balls,
      batter2_runs: p.batter2_runs,
      batter2_balls: p.batter2_balls,
      is_active: p.is_active,
      how_ended: p.how_ended || undefined,
    })).filter((r) => r.batter1_id && r.batter2_id);
    if (partnerRows.length) await base44.entities.Partnership.bulkCreate(partnerRows);

    const deliveryRows = inn.deliveries.map((d) => clean({
      match_id: match.id,
      innings_id: inningsRecord.id,
      over_number: d.over_number,
      ball_in_over: d.ball_in_over,
      delivery_number: d.delivery_number,
      striker_id: idFor(d.striker),
      non_striker_id: idFor(d.non_striker),
      bowler_id: idFor(d.bowler),
      runs_bat: d.runs_bat,
      runs_total: d.runs_total,
      is_wide: d.is_wide,
      wide_runs: d.wide_runs,
      is_no_ball: d.is_no_ball,
      no_ball_runs: d.no_ball_runs,
      is_bye: d.is_bye,
      bye_runs: d.bye_runs,
      is_leg_bye: d.is_leg_bye,
      leg_bye_runs: d.leg_bye_runs,
      penalty_runs: d.penalty_runs,
      is_legal_delivery: d.is_legal_delivery,
      is_boundary: d.is_boundary,
      is_six: d.is_six,
      is_dot_ball: d.is_dot_ball,
      is_wicket: d.is_wicket,
      wicket_type: d.wicket_type,
      player_out_id: d.player_out ? idFor(d.player_out) : undefined,
      fielder_id: d.fielder ? idFor(d.fielder) : undefined,
      shot_type: d.shot_type,
      line: d.line,
      length: d.length,
      delivery_variation: d.delivery_variation,
      wagon_wheel_zone: d.wagon_wheel_zone,
      shot_region: d.shot_region,
      shot_x: d.shot_x,
      shot_y: d.shot_y,
      pitch_x: d.pitch_x,
      pitch_y: d.pitch_y,
      turf_zone: d.turf_zone,
      shot_distance: d.shot_distance,
      is_catch_drop: d.is_catch_drop,
      dropped_by: d.dropped_by ? idFor(d.dropped_by) : undefined,
      timestamp: new Date().toISOString(),
    })).filter((r) => r.striker_id && r.non_striker_id && r.bowler_id);
    for (const batch of chunk(deliveryRows, 200)) await base44.entities.Delivery.bulkCreate(batch);

    runningTotal = s.runs;
  }

  addLog("🎉 Import complete! The match is in Matches, with its full scorecard and report.");
  return { matchId: match.id };
}