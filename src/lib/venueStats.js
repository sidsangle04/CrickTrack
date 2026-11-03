import { base44 } from '@/api/base44Client';

// Venue numbers from completed matches: the average first-innings score (which
// drives the par score), plus total runs scored at the ground and the best
// innings total there. Super Overs are excluded. A venue with no completed
// first innings is simply absent from the result — no fallback is invented.
export async function loadVenueAverages() {
  const matchPage = await base44.entities.Match.filter(
    { status: 'completed' },
    { fields: ['id', 'venue', 'venue_id'], limit: 500 }
  );
  const matches = matchPage.items || matchPage;
  const ids = matches.map((m) => m.id);
  if (!ids.length) return {};

  const inningsPage = await base44.entities.Innings.filter(
    { match_id: { $in: ids }, is_super_over: { $ne: true } },
    { fields: ['match_id', 'innings_number', 'total_runs'], limit: 500 }
  );
  const innings = inningsPage.items || inningsPage;

  // Per match: first-innings runs, all runs, best innings.
  const perMatch = {};
  innings.forEach((i) => {
    const runs = i.total_runs || 0;
    const m = (perMatch[i.match_id] = perMatch[i.match_id] || { first: undefined, total: 0, best: 0 });
    m.total += runs;
    if (runs > m.best) m.best = runs;
    if (i.innings_number === 1) m.first = (m.first || 0) + runs;
  });

  // A venue is keyed by its linked id and by its name, so older matches that
  // only carry the ground name still count.
  const acc = {};
  matches.forEach((m) => {
    const stats = perMatch[m.id];
    if (!stats || stats.first === undefined) return;
    [m.venue_id, m.venue].filter(Boolean).forEach((key) => {
      if (!acc[key]) acc[key] = { firstTotal: 0, count: 0, runs: 0, best: 0 };
      const a = acc[key];
      a.firstTotal += stats.first;
      a.count += 1;
      a.runs += stats.total;
      if (stats.best > a.best) a.best = stats.best;
    });
  });

  const out = {};
  Object.entries(acc).forEach(([key, v]) => {
    out[key] = {
      average: Math.round(v.firstTotal / v.count),
      count: v.count,
      runs: v.runs,
      best: v.best,
    };
  });
  return out;
}