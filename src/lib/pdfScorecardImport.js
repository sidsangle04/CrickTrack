// Writes a scorecard imported from a PDF into the CrickTrack data model.
// The PDF carries innings totals and per-player figures but no ball-by-ball log,
// so Match, Innings, BatterInnings and BowlerInnings are created and no
// Delivery or Partnership rows are invented.

import { base44 } from "@/api/base44Client";
import { oversToBalls } from "./pdfScorecardNormalize";
import { ensureVenue } from "./ensureVenue";

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

export async function writePdfScorecardMatch(plan, mode, addLog = () => {}) {
  const { match: info, innings } = plan;
  if (!innings?.length) throw new Error("This import has no innings to save.");

  addLog("🔍 Setting up teams...");
  const allTeams = await base44.entities.Team.list();
  const modeTeams = allTeams.filter((t) => (t.ground_mode || "turf") === mode);

  const findOrCreateTeam = async (name) => {
    const existing = modeTeams.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      addLog(`  Team found: ${existing.name}`);
      return existing;
    }
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

  const namesByTeam = { team1: new Set(), team2: new Set() };
  innings.forEach((inn) => {
    const other = inn.battingTeam === "team1" ? "team2" : "team1";
    inn.batters.forEach((b) => b.name && namesByTeam[inn.battingTeam].add(b.name));
    inn.bowlers.forEach((b) => b.name && namesByTeam[other].add(b.name));
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
    for (const name of namesByTeam[side]) await findOrCreatePlayer(name, side);
  }
  addLog(
    `  ${Object.keys(playerId.team1).length + Object.keys(playerId.team2).length} players ready`
  );

  const sideOf = (inn, name) => (namesByTeam[inn.battingTeam].has(name) ? inn.battingTeam : inn.battingTeam === "team1" ? "team2" : "team1");
  const idIn = (inn, name) => (name ? playerId[sideOf(inn, name)][name] : null);

  let resultText = info.result || "";
  let winnerSide = "";
  const first = innings[0];
  const second = innings[1];
  if (!resultText && second) {
    if (second.runs > first.runs) {
      resultText = `${teamNames[second.battingTeam]} won`;
      winnerSide = second.battingTeam;
    } else if (second.runs < first.runs) {
      resultText = `${teamNames[first.battingTeam]} won by ${first.runs - second.runs} run${
        first.runs - second.runs === 1 ? "" : "s"
      }`;
      winnerSide = first.battingTeam;
    } else {
      resultText = "Match tied";
    }
  }
  if (!winnerSide && resultText) {
    const lower = resultText.toLowerCase();
    if (lower.includes("won")) {
      if (lower.includes(teamNames.team1.toLowerCase())) winnerSide = "team1";
      else if (lower.includes(teamNames.team2.toLowerCase())) winnerSide = "team2";
    }
  }

  const xiFor = (side) => Array.from(namesByTeam[side]).map((n) => playerId[side][n]).filter(Boolean);

  const venueId = await ensureVenue(info.venue, mode);
  if (venueId) addLog(`  Venue linked: ${info.venue}`);

  addLog("🏏 Creating match record...");
  const match = await base44.entities.Match.create({
    date: info.date,
    venue: info.venue || "Unknown",
    venue_id: venueId,
    team1_id: team1.id,
    team2_id: team2.id,
    team1_playing_xi: xiFor("team1"),
    team2_playing_xi: xiFor("team2"),
    overs_per_innings: info.oversPerInnings,
    players_per_team: 11,
    format: "limited",
    status: "completed",
    result: resultText,
    winner_id: winnerSide ? teamIds[winnerSide] : "",
    ground_mode: mode,
    batting_team_id: teamIds[first.battingTeam],
    bowling_team_id: teamIds[first.battingTeam === "team1" ? "team2" : "team1"],
    enable_visual_tagging: false,
  });
  addLog(`  Match created (ID: ${match.id})`);

  addLog("📊 Creating innings...");
  let runningTotal = 0;
  for (let i = 0; i < innings.length; i++) {
    const inn = innings[i];
    const other = inn.battingTeam === "team1" ? "team2" : "team1";
    const endReason =
      inn.wickets >= 10 ? "all_out" : i > 0 && inn.runs > runningTotal ? "target_reached" : "overs_complete";

    const inningsRecord = await base44.entities.Innings.create(clean({
      match_id: match.id,
      innings_number: inn.number,
      batting_team_id: teamIds[inn.battingTeam],
      bowling_team_id: teamIds[other],
      total_runs: inn.runs,
      total_wickets: inn.wickets,
      total_balls: inn.balls,
      total_overs: Math.floor(inn.balls / 6),
      extras_wide: inn.extras.wides,
      extras_no_ball: inn.extras.no_balls,
      extras_byes: inn.extras.byes,
      extras_leg_byes: inn.extras.leg_byes,
      target: i > 0 ? runningTotal + 1 : undefined,
      status: "completed",
      end_reason: endReason,
    }));
    addLog(`  Innings ${inn.number}: ${inn.runs}/${inn.wickets} (${inn.overs} ov)`);

    const batterRows = inn.batters
      .map((b, position) =>
        clean({
          match_id: match.id,
          innings_id: inningsRecord.id,
          player_id: playerId[inn.battingTeam][b.name],
          batting_position: position + 1,
          runs: b.runs,
          balls_faced: b.balls,
          fours: b.fours,
          sixes: b.sixes,
          strike_rate: b.balls > 0 ? (b.runs / b.balls) * 100 : 0,
          is_out: b.is_out,
          dismissal_type: b.is_out ? b.dismissal_type : undefined,
          dismissed_by_bowler_id: b.is_out ? idIn(inn, b.bowler) : undefined,
          dismissed_by_fielder_id: b.is_out ? idIn(inn, b.fielder) : undefined,
          status: b.status,
        })
      )
      .filter((r) => r.player_id);
    for (const batch of chunk(batterRows, 200)) await base44.entities.BatterInnings.bulkCreate(batch);

    const bowlerRows = inn.bowlers
      .map((b) =>
        clean({
          match_id: match.id,
          innings_id: inningsRecord.id,
          player_id: playerId[other][b.name],
          overs: Math.floor(oversToBalls(b.overs) / 6),
          balls: oversToBalls(b.overs),
          runs_conceded: b.runs,
          wickets: b.wickets,
          maidens: b.maidens,
          economy: oversToBalls(b.overs) > 0 ? (b.runs / oversToBalls(b.overs)) * 6 : 0,
          wides: b.wides,
          no_balls: b.no_balls,
        })
      )
      .filter((r) => r.player_id);
    for (const batch of chunk(bowlerRows, 200)) await base44.entities.BowlerInnings.bulkCreate(batch);

    addLog(`  ${batterRows.length} batting and ${bowlerRows.length} bowling figures saved`);
    runningTotal = inn.runs;
  }

  addLog("ℹ️ This PDF is a scorecard, so no ball-by-ball data was imported.");
  addLog("🎉 Import complete! The match is in Matches with its full scorecard.");
  return { matchId: match.id };
}