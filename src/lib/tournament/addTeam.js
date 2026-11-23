import { base44 } from '@/api/base44Client';
import { generateTournamentFixtures } from '@/lib/bracket';

const shortNameFor = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

// A team added by hand after (or instead of) the auction. It lives inside this
// tournament only, and its squad is built from players copied out of the main
// roster plus any new names typed in, so nobody's existing team is disturbed.
export default async function addTournamentTeam({
  tournament,
  name,
  color,
  existingPlayers = [],
  newPlayers = []
}) {
  const mode = tournament.ground_mode || 'turf';

  const team = await base44.entities.Team.create({
    name: name.trim(),
    short_name: shortNameFor(name) || 'TEAM',
    primary_color: color || '#10b981',
    ground_mode: mode,
    tournament_id: tournament.id
  });

  const roster = [
    ...existingPlayers.map((p) => ({
      name: p.name,
      role: p.role || 'batsman',
      batting_style: p.batting_style || 'right_hand',
      bowling_style: p.bowling_style || 'none',
      is_wicket_keeper: !!p.is_wicket_keeper || p.role === 'wicket_keeper',
      jersey_number: p.jersey_number
    })),
    ...newPlayers
      .filter((p) => (p.name || '').trim())
      .map((p) => ({
        name: p.name.trim(),
        role: p.role || 'batsman',
        is_wicket_keeper: p.role === 'wicket_keeper'
      }))
  ];

  if (roster.length) {
    await base44.entities.Player.bulkCreate(
      roster.map((p) => ({
        ...p,
        team_id: team.id,
        ground_mode: mode,
        tournament_id: tournament.id
      }))
    );
  }

  const teamIds = [...(tournament.team_ids || []), team.id];
  await base44.entities.Tournament.update(tournament.id, {
    team_ids: teamIds,
    num_teams: teamIds.length
  });

  // Fixtures follow the field: an existing fixture list is rebuilt for the new
  // team, but never once a match has been played.
  let fixturesUpdated = false;
  const fixtures = await base44.entities.TournamentMatch.filter({
    tournament_id: tournament.id
  });
  const started = fixtures.some(
    (m) =>
      m.match_id ||
      m.winner_team_id ||
      m.status === 'in_progress' ||
      m.status === 'completed'
  );

  if (fixtures.length && !started) {
    const next = generateTournamentFixtures({ ...tournament, team_ids: teamIds });
    await base44.entities.TournamentMatch.deleteMany({ tournament_id: tournament.id });
    if (next.length) {
      await base44.entities.TournamentMatch.bulkCreate(next);
      fixturesUpdated = true;
    }
  }

  return { team, players: roster.length, fixturesUpdated };
}