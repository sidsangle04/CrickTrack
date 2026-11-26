import { base44 } from '@/api/base44Client';

// Swaps one squad member for another after the auction. Both sides are kept in
// step: the auction record (so team sheets and purses stay right) and the
// tournament player record (so the squad in the tournament changes too).
// The replacement takes over the outgoing player's price, so no purse moves.
export default async function swapSquadPlayer({ tournamentId, mode, team, outgoing, incoming }) {
  // Which auction team this tournament team stands for.
  let auctionTeamId = team?.auctionTeamId || '';
  if (!auctionTeamId && tournamentId && team?.id) {
    const rows = await base44.entities.AuctionTeam.filter({
      tournament_id: tournamentId,
      team_id: team.id
    });
    if (rows.length) auctionTeamId = rows[0].id;
  }

  // The auction record of the player leaving.
  let outAuction = null;
  if (outgoing?.auctionPlayerId) {
    outAuction = { id: outgoing.auctionPlayerId, sold_price: outgoing.sold_price, category: outgoing.category };
  } else if (outgoing?.playerId && tournamentId) {
    const rows = await base44.entities.AuctionPlayer.filter({
      tournament_id: tournamentId,
      player_id: outgoing.playerId
    });
    if (rows.length) outAuction = rows[0];
  }

  const price = Number(outAuction?.sold_price) || 0;
  const category = outAuction?.category || 'gold';

  // ---- the player leaving: back to the pool, out of the tournament squad ----
  if (outAuction) {
    await base44.entities.AuctionPlayer.update(outAuction.id, {
      status: 'available',
      sold_to_team_id: '',
      sold_price: 0,
      player_id: ''
    });
  }
  if (outgoing?.playerId) {
    await base44.entities.Player.update(outgoing.playerId, { team_id: '' });
  }

  // ---- the player joining ----
  const teamFields = { team_id: team?.id || '', ground_mode: mode, tournament_id: tournamentId };
  let player = null;
  if (incoming?.playerId) {
    player = await base44.entities.Player.update(incoming.playerId, teamFields);
  } else {
    player = await base44.entities.Player.create({
      name: incoming?.name || '',
      photo_url: incoming?.photo_url || '',
      role: incoming?.role || 'batsman',
      batting_style: incoming?.batting_style || 'right_hand',
      bowling_style: incoming?.bowling_style || 'none',
      is_wicket_keeper: incoming?.role === 'wicket_keeper',
      ...teamFields
    });
  }

  if (auctionTeamId) {
    const sale = {
      status: 'sold',
      sold_to_team_id: auctionTeamId,
      sold_price: price,
      player_id: player.id
    };
    if (incoming?.auctionPlayerId) {
      await base44.entities.AuctionPlayer.update(incoming.auctionPlayerId, sale);
    } else {
      await base44.entities.AuctionPlayer.create({
        tournament_id: tournamentId,
        name: player.name,
        photo_url: player.photo_url || '',
        primary_role: player.role,
        batting_style: player.batting_style,
        bowling_style: player.bowling_style,
        category,
        bowl: 'none',
        ...sale
      });
    }
  }

  return player;
}