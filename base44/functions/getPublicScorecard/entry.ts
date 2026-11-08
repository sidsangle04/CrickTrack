import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const toList = (res) => (Array.isArray(res) ? res : (res?.items ?? []));

// Drop the scoring account's identity from anything the public page receives.
const strip = (rows) =>
  rows.map(({ created_by, created_by_id, is_sample, ...rest }) => rest);

const slimMatch = (m) => ({
  id: m.id,
  date: m.date,
  venue: m.venue,
  result: m.result,
  status: m.status,
  team1_id: m.team1_id,
  team2_id: m.team2_id,
  overs_per_innings: m.overs_per_innings,
  format: m.format,
  ball_type: m.ball_type,
});

// Public, read-only scorecard for a completed match. No sign-in required:
// anyone holding the match link may view the final result and stats.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const { match_id } = await req.json().catch(() => ({}));
    if (!match_id) return Response.json({ error: 'match_id is required' }, { status: 400 });

    const service = base44.asServiceRole;
    const match = await service.entities.Match.get(match_id).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!match) return Response.json({ error: 'Scorecard not found' }, { status: 404 });
    if (match.status !== 'completed') {
      return Response.json({ error: 'This scorecard becomes public once the match is complete' }, { status: 403 });
    }

    const [inningsRaw, batterRaw, bowlerRaw, partnershipRaw] = await Promise.all([
      service.entities.Innings.filter({ match_id }, { limit: 20 }),
      service.entities.BatterInnings.filter({ match_id }, { limit: 200 }),
      service.entities.BowlerInnings.filter({ match_id }, { limit: 200 }),
      service.entities.Partnership.filter({ match_id }, { limit: 50 }),
    ]);

    const innings = toList(inningsRaw);
    const batterInnings = toList(batterRaw);
    const bowlerInnings = toList(bowlerRaw);
    const partnerships = toList(partnershipRaw);

    const teamIds = [...new Set([match.team1_id, match.team2_id, ...innings.map((i) => i.batting_team_id)].filter(Boolean))];
    const playerIds = [...new Set([...batterInnings, ...bowlerInnings].map((r) => r.player_id).filter(Boolean))];

    const [teamsRaw, playersRaw] = await Promise.all([
      teamIds.length ? service.entities.Team.filter({ id: { $in: teamIds } }, { limit: 20 }) : [],
      playerIds.length ? service.entities.Player.filter({ id: { $in: playerIds } }, { limit: 200 }) : [],
    ]);

    return Response.json({
      match: slimMatch(match),
      innings: innings.map((i) => ({
        id: i.id,
        innings_number: i.innings_number,
        batting_team_id: i.batting_team_id,
        is_super_over: i.is_super_over,
        super_over_number: i.super_over_number,
        total_runs: i.total_runs,
        total_wickets: i.total_wickets,
        total_balls: i.total_balls,
        extras_wide: i.extras_wide,
        extras_no_ball: i.extras_no_ball,
        extras_byes: i.extras_byes,
        extras_leg_byes: i.extras_leg_byes,
      })),
      batterInnings: strip(batterInnings),
      bowlerInnings: strip(bowlerInnings),
      partnerships: strip(partnerships),
      teams: toList(teamsRaw).map((t) => ({ id: t.id, name: t.name, short_name: t.short_name })),
      players: toList(playersRaw).map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}