// Bidding rules for the auction. Everything is driven by the saved settings so
// the organiser can change the ladder before the auction starts.

export const DEFAULT_STARTING_BID = 50;

// 50 → 60 → ... → 190 → 200 (still +10) → 220 → 240 (+20 from 200)
export const DEFAULT_TIERS = [
  { from: 50, increment: 10 },
  { from: 200, increment: 20 }
];

export const DEFAULT_SETTINGS = {
  required_squad_size: 8,
  purse: 2000,
  starting_bid: DEFAULT_STARTING_BID,
  tiers: DEFAULT_TIERS
};

export function sortedTiers(tiers) {
  const list = (Array.isArray(tiers) && tiers.length ? tiers : DEFAULT_TIERS)
    .filter((t) => t && Number(t.increment) > 0)
    .map((t) => ({ from: Number(t.from) || 0, increment: Number(t.increment) }))
    .sort((a, b) => a.from - b.from);
  return list.length ? list : DEFAULT_TIERS;
}

// The increment that applies to a bid already standing at `amount`.
export function incrementFor(amount, tiers) {
  const list = sortedTiers(tiers);
  let increment = list[0].increment;
  list.forEach((t) => {
    if (amount >= t.from) increment = t.increment;
  });
  return increment;
}

// Next permitted bid, given what the bid currently stands at (0 = no bids yet).
export function nextBidAmount(currentBid, settings = {}) {
  const start = Number(settings.starting_bid) || DEFAULT_STARTING_BID;
  const bid = Number(currentBid) || 0;
  if (bid < start) return start;
  return bid + incrementFor(bid, settings.tiers);
}

// Preview of the ladder for the settings screen.
export function bidLadder(settings = {}, count = 10) {
  const out = [];
  let bid = 0;
  for (let i = 0; i < count; i++) {
    bid = nextBidAmount(bid, settings);
    out.push(bid);
  }
  return out;
}

export function tiersAreValid(tiers) {
  const list = sortedTiers(tiers);
  return list.length > 0 && list.every((t) => t.increment > 0 && t.from >= 0);
}