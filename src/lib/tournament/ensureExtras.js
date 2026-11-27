import { base44 } from '@/api/base44Client';

// Every backup (extra) player of an auction needs a squad profile the signed-in
// user can actually see. A profile saved under another account is invisible
// under the app's row rules, so the team would look one player short. This
// re-creates just the missing profiles, inside this tournament only, and links
// them back to the auction record so it happens once.
export async function ensureExtraProfiles(tournament) {
  const players = await base44.entities.Player.list('-created_date', 600);
  if (!tournament?.id) return players;

  const extras = await base44.entities.AuctionPlayer.filter({
    tournament_id: tournament.id,
    is_extra: true
  });
  const visible = new Set(players.map((p) => p.id));
  const missing = extras.filter((e) => e.sold_to_team_id && !visible.has(e.player_id));
  if (!missing.length) return players;

  const auctionTeams = await base44.entities.AuctionTeam.filter({ tournament_id: tournament.id });
  const created = [];

  for (const extra of missing) {
    const auctionTeam = auctionTeams.find((t) => t.id === extra.sold_to_team_id);
    if (!auctionTeam?.team_id) continue;

    const player = await base44.entities.Player.create({
      name: extra.name,
      photo_url: extra.photo_url || '',
      role: extra.primary_role || 'batsman',
      batting_style: extra.batting_style || 'right_hand',
      bowling_style: extra.bowling_style || 'none',
      is_wicket_keeper: extra.primary_role === 'wicket_keeper',
      team_id: auctionTeam.team_id,
      ground_mode: tournament.ground_mode || 'turf',
      tournament_id: tournament.id,
      is_extra: true
    });
    await base44.entities.AuctionPlayer.update(extra.id, { player_id: player.id });
    created.push(player);
  }

  return [...created, ...players];
}