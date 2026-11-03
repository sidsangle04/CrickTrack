import { base44 } from "@/api/base44Client";

// Find-or-create the Venue record for an imported match's ground, so the ground
// appears in the Venues section and the match links to it through venue_id.
// Matching is case-insensitive within the active ground_mode. A ground the
// source does not name is left unlinked rather than inventing a venue.
export async function ensureVenue(name, mode) {
  const clean = (name || "").trim();
  if (!clean || clean.toLowerCase() === "unknown") return "";

  const page = await base44.entities.Venue.filter({ ground_mode: mode }, { limit: 200 });
  const venues = page.items || page;
  const existing = venues.find(
    (v) => (v.name || "").trim().toLowerCase() === clean.toLowerCase()
  );
  if (existing) return existing.id;

  const created = await base44.entities.Venue.create({ name: clean, ground_mode: mode });
  return created.id;
}