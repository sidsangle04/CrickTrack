import { base44 } from '@/api/base44Client';

// When the auction closes, the squads become the tournament's real teams:
// every auction team is backed by a Team record for that tournament, and every
// sold player gets a Player record (in the main model, so their stats count)
// that belongs to that tournament only.
export default async function promoteAuctionSquads({ tournamentId, auctionTeams, auctionPlayers }) {
  if (!tournamentId) return { teams: 0, players: 0 };

  const tournament = await base44.entities.Tournament.get(tournamentId);
  const mode = tournament.ground_mode || 'turf';
  const palette = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const knownTeams = await base44.entities.Team.list();
  const knownIds = new Set(knownTeams.map((t) => t.id));

  const teamIdFor = {};
  const pending = [];

  auctionTeams.forEach((team) => {
    if (team.team_id && knownIds.has(team.team_id)) {
      teamIdFor[team.id] = team.team_id;
      return;
    }
    const sameName = knownTeams.find(
      (t) =>
        t.tournament_id === tournamentId &&
        (t.name || '').trim().toLowerCase() === (team.name || '').trim().toLowerCase()
    );
    if (sameName) {
      teamIdFor[team.id] = sameName.id;
      return;
    }
    pending.push(team);
  });

  if (pending.length) {
    const createdTeams = await base44.entities.Team.bulkCreate(
      pending.map((team, i) => ({
        name: team.name,
        short_name: (team.name || '').slice(0, 3).toUpperCase(),
        logo_url: team.logo_url || '',
        primary_color: team.color || palette[i % palette.length],
        ground_mode: mode,
        tournament_id: tournamentId
      }))
    );
    const relink = [];
    createdTeams.forEach((created, i) => {
      const source = pending[i];
      if (!source) return;
      teamIdFor[source.id] = created.id;
      relink.push({ id: source.id, team_id: created.id });
    });
    if (relink.length) await base44.entities.AuctionTeam.bulkUpdate(relink);
  }

  // Every auction team now has a tournament team — keep the tournament in step.
  const teamIds = auctionTeams.map((team) => teamIdFor[team.id]).filter(Boolean);
  if (teamIds.length) {
    await base44.entities.Tournament.update(tournamentId, {
      team_ids: teamIds,
      num_teams: teamIds.length
    });
  }

  // Anyone holding a team (auction buys and icon-draft picks) becomes a
  // tournament player, linked back so this can safely run twice.
  const sold = auctionPlayers.filter((p) => !p.player_id && teamIdFor[p.sold_to_team_id]);
  if (sold.length) {
    const createdPlayers = await base44.entities.Player.bulkCreate(
      sold.map((p) => ({
        name: p.name,
        team_id: teamIdFor[p.sold_to_team_id],
        ground_mode: mode,
        tournament_id: tournamentId,
        role: p.primary_role || 'batsman',
        batting_style: p.batting_style || 'right_hand',
        bowling_style: p.bowling_style || 'none',
        is_wicket_keeper: p.primary_role === 'wicket_keeper'
      }))
    );
    const links = [];
    createdPlayers.forEach((created, i) => {
      if (sold[i]) links.push({ id: sold[i].id, player_id: created.id });
    });
    if (links.length) await base44.entities.AuctionPlayer.bulkUpdate(links);
  }

  return { teams: teamIds.length, players: sold.length };
}