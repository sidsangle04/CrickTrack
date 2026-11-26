// Squad and purse maths. Icon players are free but still fill a squad slot.

import { DEFAULT_STARTING_BID } from './bidding';

export function squadOf(players, teamId) {
  if (!teamId) return [];
  return players.filter((p) => p.sold_to_team_id === teamId);
}

export function teamFinance({ teamId, players, settings = {} }) {
  const squad = squadOf(players, teamId);
  // Backup players added after the auction fill no slot and cost nothing.
  const counted = squad.filter((p) => !p.is_extra);
  const icons = counted.filter((p) => p.category === 'icon');
  const bought = counted.filter((p) => p.category !== 'icon');
  const spent = bought.reduce((sum, p) => sum + (Number(p.sold_price) || 0), 0);
  const purse = Number(settings.purse) || 2000;
  const purseLeft = purse - spent;
  const target = Number(settings.required_squad_size) || 8;
  const slotsLeft = Math.max(0, target - counted.length);
  const minBid = Number(settings.starting_bid) || DEFAULT_STARTING_BID;
  // Money that must stay behind for the other players still needed.
  const reserved = Math.max(0, slotsLeft - 1) * minBid;
  const maxBid = Math.max(0, purseLeft - reserved);

  return {
    squad,
    counted,
    icons,
    bought,
    spent,
    purse,
    purseLeft,
    target,
    slotsLeft,
    minBid,
    reserved,
    maxBid,
    complete: counted.length >= target
  };
}

// Why a team cannot bid a given amount ('' means the bid is allowed).
export function bidProblem({ amount, finance }) {
  if (!Number.isFinite(amount) || amount <= 0) return 'Invalid amount';
  if (finance.slotsLeft <= 0) return 'Squad already full';
  if (amount > finance.purseLeft) return 'Not enough purse';
  if (amount > finance.maxBid)
    return `Keep ${finance.minBid} for ${finance.slotsLeft - 1} more player${
      finance.slotsLeft - 1 === 1 ? '' : 's'
    }`;
  return '';
}

export function auctionTotals({ teams, players, settings }) {
  const rows = teams.map((team) => ({ team, finance: teamFinance({ teamId: team.id, players, settings }) }));
  const target = Number(settings.required_squad_size) || 8;
  return {
    rows,
    allComplete: rows.length > 0 && rows.every((r) => r.finance.counted.length >= target),
    shortfall: rows.filter((r) => r.finance.counted.length < target)
  };
}