import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { toList, slimMatch } from '../../shared/publicShare.ts';

// Public, read-only tournament statistics. No sign-in required: anyone holding
// the tournament link gets the same figures the owner sees, calculated from the
// same scoring records.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { tournament_id } = await req.json().catch(() => ({}));
    if (!tournament_id) {
      return Response.json({ error: 'tournament_id is required' }, { status: 400 });
    }

    const service = base44.asServiceRole;
    const tournament = await service.entities.Tournament.get(tournament_id).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

    const tournamentMatches = toList(
      await service.entities.TournamentMatch.filter({ tournament_id }, { limit: 200 })
    );

    const fixtureIds = tournamentMatches.map((tm) => tm.id);
    const directIds = tournamentMatches.map((tm) => tm.match_id).filter(Boolean);

    const [byFixture, byId] = await Promise.all([
      fixtureIds.length
        ? service.entities.Match.filter({ tournament_match_id: { $in: fixtureIds } }, { limit: 200 })
        : [],
      directIds.length
        ? service.entities.Match.filter({ id: { $in: directIds } }, { limit: 200 })
        : [],
    ]);

    const matchMap = new Map();
    [...toList(byFixture), ...toList(byId)].forEach((m) => matchMap.set(m.id, m));
    const matches = [...matchMap.values()];
    const matchIds = matches.map((m) => m.id);

    const [inningsRaw, batterRaw, bowlerRaw, partnershipRaw] = matchIds.length
      ? await Promise.all([
          service.entities.Innings.filter({ match_id: { $in: matchIds } }, { limit: 400 }),
          service.entities.BatterInnings.filter({ match_id: { $in: matchIds } }, { limit: 1000 }),
          service.entities.BowlerInnings.filter({ match_id: { $in: matchIds } }, { limit: 1000 }),
          service.entities.Partnership.filter({ match_id: { $in: matchIds } }, { limit: 400 }),
        ])
      : [[], [], [], []];

    // Only the fields the statistics need travel to the public page.
    const batterInnings = toList(batterRaw).map((b) => ({
      match_id: b.match_id,
      innings_id: b.innings_id,
      player_id: b.player_id,
      runs: b.runs,
      balls_faced: b.balls_faced,
      fours: b.fours,
      sixes: b.sixes,
      dots: b.dots,
      is_out: b.is_out,
      dismissal_type: b.dismissal_type,
      dismissed_by_fielder_id: b.dismissed_by_fielder_id,
      status: b.status,
    }));
    const bowlerInnings = toList(bowlerRaw).map((w) => ({
      match_id: w.match_id,
      innings_id: w.innings_id,
      player_id: w.player_id,
      balls: w.balls,
      overs: w.overs,
      runs_conceded: w.runs_conceded,
      wickets: w.wickets,
      maidens: w.maidens,
      dots: w.dots,
    }));

    const teamIds = [
      ...new Set([
        ...(tournament.team_ids || []),
        ...matches.flatMap((m) => [m.team1_id, m.team2_id]),
      ].filter(Boolean)),
    ];
    const playerIds = [
      ...new Set([...batterInnings, ...bowlerInnings].map((r) => r.player_id).filter(Boolean)),
    ];

    const [teamsRaw, playersRaw] = await Promise.all([
      teamIds.length
        ? service.entities.Team.filter({ id: { $in: teamIds } }, { limit: 100 })
        : [],
      playerIds.length
        ? service.entities.Player.filter({ id: { $in: playerIds } }, { limit: 500 })
        : [],
    ]);

    return Response.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        status: tournament.status,
        num_teams: tournament.num_teams,
        team_ids: tournament.team_ids || [],
        champion_team_id: tournament.champion_team_id || '',
        ground_mode: tournament.ground_mode,
      },
      tournamentMatches: tournamentMatches.map((tm) => ({
        id: tm.id,
        stage: tm.stage,
        round: tm.round,
        match_index: tm.match_index,
        match_id: tm.match_id || '',
      })),
      matches: matches.map(slimMatch),
      innings: toList(inningsRaw).map((i) => ({
        id: i.id,
        match_id: i.match_id,
        innings_number: i.innings_number,
        batting_team_id: i.batting_team_id,
        bowling_team_id: i.bowling_team_id,
        is_super_over: i.is_super_over,
        total_runs: i.total_runs,
        total_wickets: i.total_wickets,
        total_balls: i.total_balls,
        end_reason: i.end_reason,
      })),
      batterInnings,
      bowlerInnings,
      partnerships: toList(partnershipRaw).map((p) => ({
        match_id: p.match_id,
        innings_id: p.innings_id,
        wicket_number: p.wicket_number,
        batter1_id: p.batter1_id,
        batter2_id: p.batter2_id,
        runs: p.runs,
        balls: p.balls,
      })),
      teams: toList(teamsRaw).map((t) => ({
        id: t.id,
        name: t.name,
        short_name: t.short_name,
        logo_url: t.logo_url,
        primary_color: t.primary_color,
      })),
      players: toList(playersRaw).map((p) => ({ id: p.id, name: p.name, team_id: p.team_id })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}