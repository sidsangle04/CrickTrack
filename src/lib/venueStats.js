import { base44 } from '@/api/base44Client';

// One average first-innings score per venue, derived from completed matches.
// First innings only, and Super Overs excluded. Venues with no completed match
// data are simply absent from the result — no fallback is invented.
export async function loadVenueAverages() {
  const matches = await base44.entities.Match.filter(
    { status: 'completed' },
    { fields: ['id', 'venue', 'venue_id'], limit: 500 }
  );
  const ids = matches.items.map((m) => m.id);
  if (!ids.length) return {};

  const innings = await base44.entities.Innings.filter(
    {
      match_id: { $in: ids },
      innings_number: 1,
      is_super_over: { $ne: true }
    },
    { fields: ['match_id', 'total_runs'], limit: 500 }
  );

  const runsByMatch = {};
  innings.items.forEach((i) => {
    runsByMatch[i.match_id] = (runsByMatch[i.match_id] || 0) + (i.total_runs || 0);
  });

  const acc = {};
  matches.items.forEach((m) => {
    const runs = runsByMatch[m.id];
    if (runs === undefined) return;
    [m.venue_id, m.venue].filter(Boolean).forEach((key) => {
      if (!acc[key]) acc[key] = { total: 0, count: 0 };
      acc[key].total += runs;
      acc[key].count += 1;
    });
  });

  const out = {};
  Object.entries(acc).forEach(([key, v]) => {
    out[key] = { average: Math.round(v.total / v.count), count: v.count };
  });
  return out;
}