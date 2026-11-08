import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const APP_URL = 'https://cricktrack.com';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();

const toList = (res) => (Array.isArray(res) ? res : (res?.items ?? []));

const oversText = (balls) => `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

const dateText = (value) => {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return String(value);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const topBatter = (rows, nameOf) => {
  const played = rows.filter((b) => b.status !== 'yet_to_bat' && b.status !== 'did_not_bat');
  const best = [...played].sort((a, b) => (b.runs ?? 0) - (a.runs ?? 0))[0];
  if (!best || !(best.runs > 0)) return '';
  return `${nameOf(best.player_id)} &middot; ${best.runs} off ${best.balls_faced ?? 0} balls`;
};

const topBowler = (rows, nameOf) => {
  const bowled = rows.filter((b) => (b.balls ?? 0) > 0 || (b.overs ?? 0) > 0);
  if (!bowled.length) return '';
  const best = [...bowled].sort(
    (a, b) => (b.wickets ?? 0) - (a.wickets ?? 0) || (a.runs_conceded ?? 0) - (b.runs_conceded ?? 0)
  )[0];
  const balls = best.balls ?? Math.round((best.overs ?? 0) * 6);
  return `${nameOf(best.player_id)} &middot; ${best.wickets ?? 0}/${best.runs_conceded ?? 0} (${oversText(balls)} ov)`;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { match_id } = await req.json().catch(() => ({}));
    if (!match_id) return Response.json({ error: 'match_id is required' }, { status: 400 });

    const service = base44.asServiceRole;
    const match = await service.entities.Match.get(match_id).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });

    const owner = await service.entities.User.get(match.created_by_id).catch(() => null);
    const to = owner?.email || user.email;
    if (!to) return Response.json({ error: 'No recipient email on this match' }, { status: 400 });

    const [inningsRaw, batterRaw, bowlerRaw] = await Promise.all([
      service.entities.Innings.filter({ match_id }, { limit: 20 }),
      service.entities.BatterInnings.filter({ match_id }, { limit: 200 }),
      service.entities.BowlerInnings.filter({ match_id }, { limit: 200 }),
    ]);

    const innings = toList(inningsRaw)
      .filter((i) => !i.is_super_over)
      .sort((a, b) => (a.innings_number ?? 0) - (b.innings_number ?? 0));
    const batterInnings = toList(batterRaw);
    const bowlerInnings = toList(bowlerRaw);

    const teamIds = [
      ...new Set(
        [match.team1_id, match.team2_id, ...innings.flatMap((i) => [i.batting_team_id, i.bowling_team_id])].filter(Boolean)
      ),
    ];
    const playerIds = [...new Set([...batterInnings, ...bowlerInnings].map((r) => r.player_id).filter(Boolean))];

    const [teamsRaw, playersRaw] = await Promise.all([
      teamIds.length ? service.entities.Team.filter({ id: { $in: teamIds } }, { limit: 20 }) : [],
      playerIds.length ? service.entities.Player.filter({ id: { $in: playerIds } }, { limit: 200 }) : [],
    ]);

    const teams = toList(teamsRaw);
    const players = toList(playersRaw);
    const teamName = (id) => teams.find((t) => t.id === id)?.name || 'Team';
    const playerName = (id) => players.find((p) => p.id === id)?.name || 'Player';

    const summaryOf = (i) => {
      if (!i) return { team: '', score: '', overs: '', batter: '', bowler: '' };
      const bats = batterInnings.filter((b) => b.innings_id === i.id);
      const bowls = bowlerInnings.filter((b) => b.innings_id === i.id);
      return {
        team: clean(teamName(i.batting_team_id)),
        score: `${i.total_runs ?? 0}/${i.total_wickets ?? 0}`,
        overs: `${oversText(i.total_balls ?? 0)} overs`,
        batter: topBatter(bats, playerName) || 'No runs recorded',
        bowler: topBowler(bowls, playerName) || 'No bowling recorded',
      };
    };

    const first = summaryOf(innings[0]);
    const second = summaryOf(innings[1]);
    const firstName = clean(owner?.full_name).split(' ')[0] || clean(user.full_name).split(' ')[0] || 'there';

    const variables = {
      first_name: firstName,
      match_title: `${teamName(match.team1_id)} vs ${teamName(match.team2_id)}`,
      match_date: dateText(match.date),
      match_venue: match.venue || 'Venue not recorded',
      match_format: match.format === 'test' ? 'Test match' : `${match.overs_per_innings ?? 20} overs a side`,
      result: match.result || 'Match completed',
      innings_1_team: first.team,
      innings_1_score: first.score,
      innings_1_overs: first.overs,
      innings_1_top_batter: first.batter,
      innings_1_top_bowler: first.bowler,
      innings_2_team: second.team || 'Not played',
      innings_2_score: second.score,
      innings_2_overs: second.overs,
      innings_2_top_batter: second.batter,
      innings_2_top_bowler: second.bowler,
      scorecard_url: `${APP_URL}/Scorecard?matchId=${match.id}`,
    };

    await service.integrations.Core.SendEmail({
      to,
      template_name: 'MatchReport',
      variables,
      category: 'transactional',
    });

    return Response.json({ sent: true, to, match_id, innings: innings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}