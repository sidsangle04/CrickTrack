import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const APP_URL = 'https://cricktrack.com';
const GREEN = '#10b981';
const BLACK = '#000000';
const MUTED = '#737373';
const BORDER = '#e5e5e5';

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toList = (res) => (Array.isArray(res) ? res : (res?.items ?? []));

const oversText = (balls) => `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;
const strikeRate = (runs, balls) => (balls ? ((runs / balls) * 100).toFixed(1) : '0.0');
const economy = (runs, balls) => (balls ? (runs / (balls / 6)).toFixed(2) : '0.00');

const th = (text) =>
  `<td style="padding:7px 6px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};font-weight:700;border-bottom:1px solid ${BORDER};">${esc(text)}</td>`;
const td = (text, align = 'left', bold = false) =>
  `<td align="${align}" style="padding:8px 6px;font-size:13px;color:${BLACK};border-bottom:1px solid #f0f0f0;${bold ? 'font-weight:700;' : ''}">${esc(text)}</td>`;

const battingTable = (rows, nameOf) => {
  if (!rows.length) return '';
  const body = rows
    .map(
      (b) =>
        `<tr>${td(nameOf(b.player_id), 'left', true)}${td(b.status === 'not_out' ? 'not out' : b.dismissal_type || '', 'left')}${td(b.runs ?? 0, 'right', true)}${td(b.balls_faced ?? 0, 'right')}${td(b.fours ?? 0, 'right')}${td(b.sixes ?? 0, 'right')}${td(strikeRate(b.runs ?? 0, b.balls_faced ?? 0), 'right')}</tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>${th('Batter')}${th('How out')}${th('R')}${th('B')}${th('4s')}${th('6s')}${th('SR')}</tr>${body}</table>`;
};

const bowlingTable = (rows, nameOf) => {
  if (!rows.length) return '';
  const body = rows
    .map((b) => {
      const balls = b.balls ?? Math.round((b.overs ?? 0) * 6);
      return `<tr>${td(nameOf(b.player_id), 'left', true)}${td(oversText(balls), 'right')}${td(b.maidens ?? 0, 'right')}${td(b.runs_conceded ?? 0, 'right')}${td(b.wickets ?? 0, 'right', true)}${td(economy(b.runs_conceded ?? 0, balls), 'right')}</tr>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>${th('Bowler')}${th('O')}${th('M')}${th('R')}${th('W')}${th('Econ')}</tr>${body}</table>`;
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

    const innings = toList(inningsRaw).sort((a, b) => (a.innings_number ?? 0) - (b.innings_number ?? 0));
    const batterInnings = toList(batterRaw);
    const bowlerInnings = toList(bowlerRaw);

    const teamIds = [...new Set([match.team1_id, match.team2_id, ...innings.flatMap((i) => [i.batting_team_id, i.bowling_team_id])].filter(Boolean))];
    const playerIds = [...new Set([...batterInnings, ...bowlerInnings].map((r) => r.player_id).filter(Boolean))];

    const [teamsRaw, playersRaw] = await Promise.all([
      teamIds.length ? service.entities.Team.filter({ id: { $in: teamIds } }, { limit: 20 }) : [],
      playerIds.length ? service.entities.Player.filter({ id: { $in: playerIds } }, { limit: 200 }) : [],
    ]);

    const teams = toList(teamsRaw);
    const players = toList(playersRaw);
    const teamName = (id) => teams.find((t) => t.id === id)?.name || 'Team';
    const playerName = (id) => players.find((p) => p.id === id)?.name || 'Player';

    // Innings summary lines
    const scoreLines = innings
      .filter((i) => !i.is_super_over)
      .map(
        (i) =>
          `<tr>
            <td style="padding:8px 0;font-size:15px;font-weight:700;color:${BLACK};">${esc(teamName(i.batting_team_id))}</td>
            <td align="right" style="padding:8px 0;font-size:15px;font-weight:700;color:${BLACK};">${esc(i.total_runs ?? 0)}/${esc(i.total_wickets ?? 0)}</td>
            <td align="right" style="padding:8px 0;font-size:13px;color:${MUTED};width:70px;">${esc(oversText(i.total_balls ?? 0))} ov</td>
          </tr>`
      )
      .join('');

    // Per-innings detail blocks
    const blocks = innings
      .filter((i) => !i.is_super_over)
      .map((i) => {
        const bats = batterInnings
          .filter((b) => b.innings_id === i.id && b.status !== 'yet_to_bat' && b.status !== 'did_not_bat')
          .sort((a, b) => (a.batting_position ?? 99) - (b.batting_position ?? 99));
        const bowls = bowlerInnings
          .filter((b) => b.innings_id === i.id && (b.balls > 0 || (b.overs ?? 0) > 0))
          .sort((a, b) => (b.wickets ?? 0) - (a.wickets ?? 0));
        const extras = (i.extras_wide ?? 0) + (i.extras_no_ball ?? 0) + (i.extras_byes ?? 0) + (i.extras_leg_byes ?? 0) + (i.extras_penalty ?? 0);
        return `
        <tr><td style="padding:26px 0 0;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${GREEN};">Innings ${esc(i.innings_number)}</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:${BLACK};">${esc(teamName(i.batting_team_id))} &nbsp;${esc(i.total_runs ?? 0)}/${esc(i.total_wickets ?? 0)} <span style="font-weight:400;font-size:13px;color:${MUTED};">(${esc(oversText(i.total_balls ?? 0))} ov, extras ${esc(extras)})</span></p>
          ${battingTable(bats, playerName)}
          <div style="height:18px;"></div>
          ${bowlingTable(bowls, playerName)}
        </td></tr>`;
      })
      .join('');

    // Standout performers
    const topScorer = [...batterInnings].sort((a, b) => (b.runs ?? 0) - (a.runs ?? 0))[0];
    const topBowler = [...bowlerInnings].sort((a, b) => (b.wickets ?? 0) - (a.wickets ?? 0) || (a.runs_conceded ?? 0) - (b.runs_conceded ?? 0))[0];
    const highlights = [
      topScorer && (topScorer.runs ?? 0) > 0
        ? `<td width="50%" style="padding:0 8px 0 0;vertical-align:top;"><div style="background-color:#f5f5f5;border-radius:8px;padding:16px 18px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${MUTED};">Top score</p>
            <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:${BLACK};">${esc(playerName(topScorer.player_id))}</p>
            <p style="margin:0;font-size:14px;color:${BLACK};">${esc(topScorer.runs ?? 0)} off ${esc(topScorer.balls_faced ?? 0)} balls</p>
          </div></td>`
        : '',
      topBowler && (topBowler.wickets ?? 0) > 0
        ? `<td width="50%" style="padding:0 0 0 8px;vertical-align:top;"><div style="background-color:#f5f5f5;border-radius:8px;padding:16px 18px;">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${MUTED};">Best bowling</p>
            <p style="margin:0 0 2px;font-size:16px;font-weight:700;color:${BLACK};">${esc(playerName(topBowler.player_id))}</p>
            <p style="margin:0;font-size:14px;color:${BLACK};">${esc(topBowler.wickets ?? 0)}/${esc(topBowler.runs_conceded ?? 0)}</p>
          </div></td>`
        : '',
    ]
      .filter(Boolean)
      .join('');

    const dateText = match.date ? new Date(`${match.date}T00:00:00`).toDateString() : '';
    const fixture = `${teamName(match.team1_id)} vs ${teamName(match.team2_id)}`;
    const subject = `Match report: ${fixture}${match.result ? ` - ${match.result}` : ''}`;

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="width:640px;max-width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;font-family:Arial, Helvetica, sans-serif;">
  <tr><td style="background-color:${GREEN};padding:22px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="left"><img src="https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/91aa093e5_CrickTracknewlogo.png" alt="CrickTrack" width="38" height="38" style="display:block;border:0;margin-bottom:8px;" />
        <span style="display:block;font-size:12px;letter-spacing:4px;text-transform:uppercase;font-weight:700;color:${BLACK};">CrickTrack</span></td>
      <td align="right" style="font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#065f46;">Match report</td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:32px 32px 0;">
    <p style="margin:0 0 10px;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;color:${GREEN};">${esc(dateText)}</p>
    <h1 style="margin:0 0 6px;font-size:26px;line-height:1.2;font-weight:700;color:${BLACK};">${esc(fixture)}</h1>
    <p style="margin:0;font-size:13px;color:${MUTED};">${esc(match.venue || '')}${match.overs_per_innings ? ` &middot; ${esc(match.overs_per_innings)} overs a side` : ''}</p>
  </td></tr>

  <tr><td style="padding:22px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BLACK};border-radius:8px;">
      <tr><td style="padding:20px 22px;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:${GREEN};">Result</p>
        <p style="margin:0;font-size:16px;line-height:1.45;font-weight:700;color:#ffffff;">${esc(match.result || 'Match completed')}</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:22px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${scoreLines}</table>
  </td></tr>

  ${highlights ? `<tr><td style="padding:22px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${highlights}</tr></table></td></tr>` : ''}

  <tr><td style="padding:0 32px;">${blocks}</td></tr>

  <tr><td style="padding:30px 32px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" style="background-color:${BLACK};border-radius:8px;">
        <a href="${APP_URL}/Scorecard?matchId=${esc(match.id)}" style="display:inline-block;padding:14px 30px;font-family:Arial, Helvetica, sans-serif;font-size:15px;font-weight:700;color:${GREEN};text-decoration:none;">Open the full scorecard</a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="padding:26px 32px 34px;">
    <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">This report was generated automatically when the match was marked complete. Full ball-by-ball detail, wagon wheels and partnerships are waiting in the app.</p>
    <p style="margin:18px 0 0;font-size:12px;color:${MUTED};">CrickTrack &middot; Tag | Analyse | Elevate</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

    await service.integrations.Core.SendEmail({ to, subject, html, category: 'transactional' });

    return Response.json({ sent: true, to, match_id, innings: innings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}