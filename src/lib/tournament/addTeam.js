import { base44 } from '@/api/base44Client';
import { generateTournamentFixtures } from '@/lib/bracket';
import { normPlayerName } from '@/lib/playerLookup';

const shortNameFor = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

// A team added by hand after (or instead of) the auction. It lives inside this
// tournament only, and its squad is built from unsold auction players, players
// already in the app, and any new names typed in — so nobody's existing team is
// disturbed. Its players were never bid on, so they carry no winning bid.
export default async function addTournamentTeam({
  tournament,
  name,
  color,
  existingPlayers = [],
  unsoldPlayers = [],
  newPlayers = [],
  iconNames = [],
  iconName = ''
}) {
  const mode = tournament.ground_mode || 'turf';
  // Every squad member named as an icon (older callers may pass a single name).
  const iconKeys = new Set(
    (iconNames.length ? iconNames : [iconName]).filter(Boolean).map(normPlayerName)
  );

  const team = await base44.entities.Team.create({
    name: name.trim(),
    short_name: shortNameFor(name) || 'TEAM',
    primary_color: color || '#10b981',
    ground_mode: mode,
    tournament_id: tournament.id
  });

  const squad = [
    ...existingPlayers.map((p) => ({
      name: p.name,
      photo_url: p.photo_url || '',
      role: p.role || 'batsman',
      batting_style: p.batting_style || 'right_hand',
      bowling_style: p.bowling_style || 'none',
      is_wicket_keeper: !!p.is_wicket_keeper || p.role === 'wicket_keeper',
      jersey_number: p.jersey_number,
      auctionPlayerId: ''
    })),
    ...unsoldPlayers.map((p) => ({
      name: p.name,
      photo_url: p.photo_url || '',
      role: p.primary_role || 'batsman',
      is_wicket_keeper: p.primary_role === 'wicket_keeper',
      auctionPlayerId: p.id
    })),
    ...newPlayers
      .filter((p) => (p.name || '').trim())
      .map((p) => ({
        name: p.name.trim(),
        role: p.role || 'batsman',
        is_wicket_keeper: p.role === 'wicket_keeper',
        auctionPlayerId: ''
      }))
  ];

  let playerIds = [];
  if (squad.length) {
    const created = await base44.entities.Player.bulkCreate(
      squad.map(({ auctionPlayerId, ...p }) => ({
        ...p,
        team_id: team.id,
        ground_mode: mode,
        tournament_id: tournament.id
      }))
    );
    playerIds = (created || []).map((p) => p.id);
  }

  // The team also joins the auction's own team list, so it appears with the
  // other squads — flagged as added after the auction.
  const auctionTeams = await base44.entities.AuctionTeam.filter({
    tournament_id: tournament.id
  });
  const auctionTeam = await base44.entities.AuctionTeam.create({
    tournament_id: tournament.id,
    team_id: team.id,
    name: name.trim(),
    color: color || '#10b981',
    order_index: auctionTeams.length,
    post_auction: true
  });

  // Every squad member gets an auction record too, so the squad is shown like
  // any other. Unsold records are reused, never duplicated.
  const auctionPlayers = await base44.entities.AuctionPlayer.filter({
    tournament_id: tournament.id
  });
  const spare = new Map();
  auctionPlayers
    .filter((p) => !p.sold_to_team_id && p.status !== 'sold')
    .forEach((p) => {
      const k = normPlayerName(p.name);
      if (!spare.has(k)) spare.set(k, p);
    });

  const updates = [];
  const creates = [];
  squad.forEach((p, i) => {
    const isIcon = iconKeys.has(normPlayerName(p.name));
    const sale = {
      player_id: playerIds[i] || '',
      status: 'sold',
      sold_to_team_id: auctionTeam.id,
      sold_price: 0,
      is_extra: false,
      category: isIcon ? 'icon' : 'gold'
    };
    const match = p.auctionPlayerId
      ? auctionPlayers.find((a) => a.id === p.auctionPlayerId)
      : spare.get(normPlayerName(p.name));
    if (match) {
      updates.push({ id: match.id, ...sale });
    } else {
      creates.push({
        tournament_id: tournament.id,
        name: p.name,
        photo_url: p.photo_url || '',
        primary_role: p.role || 'batsman',
        bowl: 'none',
        ...sale
      });
    }
  });
  if (updates.length) await base44.entities.AuctionPlayer.bulkUpdate(updates);
  if (creates.length) await base44.entities.AuctionPlayer.bulkCreate(creates);

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

  return { team, auctionTeam, players: squad.length, fixturesUpdated };
}