// The saved auction record can land a moment after the bid that caused it, so a
// screen that refreshed in between shows the previous highest bidder. The newest
// bid for the live lot is therefore taken as the current bid whenever it is newer
// than the saved auction state.
export function liveLotState({ auction, bids }) {
  const saved = auction || {};
  const lotBids = (bids || [])
    .filter((b) => b.player_id && b.player_id === saved.current_player_id)
    .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

  const latest = lotBids[0];
  const savedAt = new Date(saved.updated_date || 0).getTime();
  const latestAt = latest ? new Date(latest.created_date || 0).getTime() : 0;
  const savedBid = Number(saved.current_bid) || 0;
  const latestAmount = latest ? Number(latest.amount) || 0 : 0;

  const ahead = !!latest && latestAt > savedAt && latestAmount > savedBid;

  return {
    currentBid: ahead ? latestAmount : savedBid,
    bidderTeamId: ahead ? latest.team_id || '' : saved.current_bidder_team_id || ''
  };
}