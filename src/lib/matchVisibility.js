// Per-match sharing. A match is private to its creator (and admins) unless its
// visibility is set to "shared" — and every record hanging off the match
// carries an `is_shared` flag so the same access rule applies to the scorecard,
// deliveries and partnerships.
import { base44 } from "@/api/base44Client";

const CHILD_ENTITIES = [
  "Innings",
  "BatterInnings",
  "BowlerInnings",
  "Delivery",
  "Partnership",
];

export function isShared(match) {
  return match?.visibility === "shared";
}

// Only the creator and admins may change a match's sharing.
export function canManageMatch(match, user) {
  if (!match || !user) return false;
  return user.role === "admin" || match.created_by_id === user.id;
}

// Keeps the child records in step with the match. Each pass only touches the
// records that still disagree, so a match with hundreds of deliveries syncs in
// a few calls instead of re-matching the same rows forever.
export async function syncMatchChildren(matchId, shared) {
  for (const name of CHILD_ENTITIES) {
    let hasMore = true;
    while (hasMore) {
      const res = await base44.entities[name].updateMany(
        { match_id: matchId, is_shared: shared ? { $ne: true } : true },
        { $set: { is_shared: shared } }
      );
      hasMore = Boolean(res?.has_more);
    }
  }
}

export async function setMatchVisibility(matchId, visibility) {
  const shared = visibility === "shared";
  await base44.entities.Match.update(matchId, { visibility });
  await syncMatchChildren(matchId, shared);
}