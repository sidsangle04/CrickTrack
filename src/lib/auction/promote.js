import { base44 } from '@/api/base44Client';
import { normPlayerName } from '@/lib/playerLookup';

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
  const sync = [];

  auctionTeams.forEach((team) => {
    if (team.team_id && knownIds.has(team.team_id)) {
      teamIdFor[team.id] = team.team_id;
      // A team edited in the auction keeps its name, colour and logo there, so
      // the tournament's own record is brought back in step with it.
      const linked = knownTeams.find((t) => t.id === team.team_id);
      if (
        linked &&
        ((team.logo_url && linked.logo_url !== team.logo_url) ||
          (team.color && linked.primary_color !== team.color))
      ) {
        sync.push({
          id: linked.id,
          logo_url: team.logo_url || linked.logo_url || '',
          primary_color: team.color || linked.primary_color || ''
        });
      }
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

  if (sync.length) await base44.entities.Team.bulkUpdate(sync);

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
    // This tournament's players by name — someone already registered here is
    // reused instead of saved as a second copy of the same person.
    const existing = await base44.entities.Player.filter({ tournament_id: tournamentId });
    const byName = new Map();
    (Array.isArray(existing) ? existing : []).forEach((p) => {
      const key = normPlayerName(p.name);
      if (key && !byName.has(key)) byName.set(key, p);
    });

    const links = [];
    const teamless = [];
    const toCreate = [];

    sold.forEach((p) => {
      const teamId = teamIdFor[p.sold_to_team_id];
      const match = byName.get(normPlayerName(p.name));
      if (match && (!match.team_id || match.team_id === teamId)) {
        links.push({ id: p.id, player_id: match.id });
        if (!match.team_id) teamless.push({ id: match.id, team_id: teamId });
        return;
      }
      toCreate.push(p);
    });

    if (teamless.length) await base44.entities.Player.bulkUpdate(teamless);

    if (toCreate.length) {
      const createdPlayers = await base44.entities.Player.bulkCreate(
        toCreate.map((p) => ({
          name: p.name,
          photo_url: p.photo_url || '',
          team_id: teamIdFor[p.sold_to_team_id],
          ground_mode: mode,
          tournament_id: tournamentId,
          role: p.primary_role || 'batsman',
          batting_style: p.batting_style || 'right_hand',
          bowling_style: p.bowling_style || 'none',
          is_wicket_keeper: p.primary_role === 'wicket_keeper'
        }))
      );
      createdPlayers.forEach((created, i) => {
        if (toCreate[i]) links.push({ id: toCreate[i].id, player_id: created.id });
      });
    }

    if (links.length) await base44.entities.AuctionPlayer.bulkUpdate(links);
  }

  return { teams: teamIds.length, players: sold.length };
}