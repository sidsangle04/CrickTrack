// Shared entity writer for imported Play-Cricket matches (used by both the
// URL path and the file-upload path). Finds-or-creates Team/Player by name,
// then creates Match, Innings, BatterInnings, BowlerInnings, and a
// reconstructed ball-by-ball Delivery set for each innings — all tagged with
// the active ground_mode so mode isolation holds.

import { base44 } from "@/api/base44Client";
import { reconstructInningsDeliveries } from "./playCricketReconstruct";
import { ensureVenue } from "./ensureVenue";

export async function writeImportedMatch(data, mode, addLog = () => {}) {
  addLog("🔍 Looking up teams...");
  const allTeams = await base44.entities.Team.list();

  const findOrCreateTeam = async (name) => {
    const existing = allTeams.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) { addLog(`  Team found: ${existing.name}`); return existing; }
    const created = await base44.entities.Team.create({
      name,
      short_name: (name.substring(0, 4) || "TEAM").toUpperCase(),
      ground_mode: mode,
    });
    addLog(`  Team created: ${name}`);
    return created;
  };

  const team1 = await findOrCreateTeam(data.team1Name);
  const team2 = await findOrCreateTeam(data.team2Name);

  addLog("👥 Setting up players...");
  const allPlayers = await base44.entities.Player.list();
  const findOrCreatePlayer = async (name, teamId) => {
    if (!name) return null;
    const existing = allPlayers.find((p) => p.name.toLowerCase() === name.toLowerCase() && p.team_id === teamId);
    if (existing) return existing;
    return await base44.entities.Player.create({ name, team_id: teamId, role: "all_rounder", ground_mode: mode });
  };

  const team1Players = {};
  const team2Players = {};
  for (const b of data.innings1.batters) {
    if (b.name && b.name !== "did not bat") team1Players[b.name] = await findOrCreatePlayer(b.name, team1.id);
  }
  for (const b of data.innings1.bowlers) {
    if (b.name) team2Players[b.name] = team2Players[b.name] || await findOrCreatePlayer(b.name, team2.id);
  }
  for (const b of data.innings2.batters) {
    if (b.name && b.name !== "did not bat") team2Players[b.name] = await findOrCreatePlayer(b.name, team2.id);
  }
  for (const b of data.innings2.bowlers) {
    if (b.name) team1Players[b.name] = team1Players[b.name] || await findOrCreatePlayer(b.name, team1.id);
  }
  addLog(`  ${Object.keys(team1Players).length + Object.keys(team2Players).length} players ready`);

  const venueId = await ensureVenue(data.ground, mode);
  if (venueId) addLog(`  Venue linked: ${data.ground}`);

  addLog("🏏 Creating match record...");
  const t1xi = data.innings1.batters.map((b) => team1Players[b.name]?.id).filter(Boolean);
  const t2xi = data.innings2.batters.map((b) => team2Players[b.name]?.id).filter(Boolean);
  const match = await base44.entities.Match.create({
    date: data.matchDate,
    venue: data.ground,
    venue_id: venueId,
    team1_id: team1.id,
    team2_id: team2.id,
    team1_playing_xi: t1xi,
    team2_playing_xi: t2xi,
    overs_per_innings: data.oversPerInnings || 50,
    status: "completed",
    result: data.result,
    ground_mode: mode,
    batting_team_id: team1.id,
    bowling_team_id: team2.id,
  });
  addLog(`  Match created (ID: ${match.id})`);

  addLog("📊 Creating innings...");
  const mkInnings = (num, batId, bowlId, inn) => ({
    match_id: match.id,
    innings_number: num,
    batting_team_id: batId,
    bowling_team_id: bowlId,
    total_runs: inn.runs,
    total_wickets: inn.wickets,
    total_balls: Math.round((inn.overs || 0) * 6),
    total_overs: Math.floor(inn.overs || 0),
    extras_byes: inn.extras?.byes || 0,
    extras_leg_byes: inn.extras?.leg_byes || 0,
    extras_wide: inn.extras?.wides || 0,
    extras_no_ball: inn.extras?.no_balls || 0,
    status: "completed",
    end_reason: inn.wickets >= 10 ? "all_out" : "overs_complete",
  });
  const inn1 = await base44.entities.Innings.create(mkInnings(1, team1.id, team2.id, data.innings1));
  const inn2 = await base44.entities.Innings.create(mkInnings(2, team2.id, team1.id, { ...data.innings2, ...(data.innings1.runs ? { target: data.innings1.runs + 1 } : {}) }));
  addLog(`  Innings 1: ${data.innings1.runs}/${data.innings1.wickets}`);
  addLog(`  Innings 2: ${data.innings2.runs}/${data.innings2.wickets}`);

  addLog("🏏 Saving batting scorecards...");
  const saveBatting = async (batters, players, bowlingPlayers, inningsId) => {
    for (let i = 0; i < batters.length; i++) {
      const b = batters[i];
      const player = players[b.name];
      if (!player) continue;
      const bowlerPlayer = b.bowler ? bowlingPlayers[b.bowler] : null;
      await base44.entities.BatterInnings.create({
        match_id: match.id,
        innings_id: inningsId,
        player_id: player.id,
        batting_position: i + 1,
        runs: b.runs,
        balls_faced: b.balls,
        fours: b.fours,
        sixes: b.sixes,
        is_out: b.is_out,
        dismissal_type: b.is_out ? b.dismissal_type : null,
        dismissed_by_bowler_id: b.is_out && b.dismissal_type !== "run_out" && bowlerPlayer ? bowlerPlayer.id : null,
        status: b.dismissal === "did not bat" ? "did_not_bat" : b.is_out ? "out" : "not_out",
        strike_rate: b.balls > 0 ? (b.runs / b.balls) * 100 : 0,
      });
    }
  };
  await saveBatting(data.innings1.batters, team1Players, team2Players, inn1.id);
  await saveBatting(data.innings2.batters, team2Players, team1Players, inn2.id);
  addLog("  Batting records saved");

  addLog("🎳 Saving bowling scorecards...");
  const saveBowling = async (bowlers, players, inningsId) => {
    for (const b of bowlers) {
      const player = players[b.name];
      if (!player) continue;
      const ov = parseFloat(b.overs) || 0;
      const totalBalls = Math.round(ov * 6);
      await base44.entities.BowlerInnings.create({
        match_id: match.id,
        innings_id: inningsId,
        player_id: player.id,
        overs: Math.floor(ov),
        balls: totalBalls,
        runs_conceded: b.runs,
        wickets: b.wickets,
        maidens: b.maidens,
        wides: b.wides || 0,
        no_balls: b.no_balls || 0,
        economy: ov > 0 ? b.runs / ov : 0,
      });
    }
  };
  await saveBowling(data.innings1.bowlers, team2Players, inn1.id);
  await saveBowling(data.innings2.bowlers, team1Players, inn2.id);
  addLog("  Bowling records saved");

  addLog("⚾ Reconstructing ball-by-ball...");
  const buildDeliveries = (batters, batterPlayers, bowlers, bowlerPlayers, inningsId) => {
    const bWithId = batters
      .filter((b) => batterPlayers[b.name])
      .map((b) => ({
        player_id: batterPlayers[b.name].id,
        runs: b.runs,
        balls: b.balls,
        fours: b.fours,
        sixes: b.sixes,
        is_out: b.is_out,
        dismissal_type: b.dismissal_type,
      }));
    const bwWithId = bowlers
      .filter((b) => bowlerPlayers[b.name])
      .map((b) => ({ player_id: bowlerPlayers[b.name].id, overs: b.overs }));
    return reconstructInningsDeliveries(bWithId, bwWithId).map((d) => ({
      ...d,
      match_id: match.id,
      innings_id: inningsId,
    }));
  };
  const d1 = buildDeliveries(data.innings1.batters, team1Players, data.innings1.bowlers, team2Players, inn1.id);
  const d2 = buildDeliveries(data.innings2.batters, team2Players, data.innings2.bowlers, team1Players, inn2.id);
  if (d1.length) await base44.entities.Delivery.bulkCreate(d1);
  if (d2.length) await base44.entities.Delivery.bulkCreate(d2);
  addLog(`  ${d1.length + d2.length} deliveries reconstructed and written`);

  addLog("🎉 Import complete! Match is now visible in Matches and Analytics.");
  return { matchId: match.id };
}