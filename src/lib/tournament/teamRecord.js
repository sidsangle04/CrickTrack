import { base44 } from '@/api/base44Client';

export const shortNameFor = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();

// The tournament Team record behind an auction team. It is created the first
// time an auction team is saved, so the tournament's own Teams section shows the
// same name, colour and logo straight away, and every later edit keeps it in
// step. The auction team is linked to it through team_id.
export async function ensureTeamRecord({ tournamentId, mode, teamId = '', name, color, logoUrl }) {
  const payload = {
    name: (name || '').trim(),
    primary_color: color || '#10b981',
    logo_url: logoUrl || ''
  };
  const teams = await base44.entities.Team.list();
  const all = Array.isArray(teams) ? teams : [];
  const key = payload.name.toLowerCase();
  const match =
    (teamId ? all.find((t) => t.id === teamId) : null) ||
    all.find((t) => t.tournament_id === tournamentId && (t.name || '').trim().toLowerCase() === key);

  if (match) {
    await base44.entities.Team.update(match.id, payload);
    return match.id;
  }

  const created = await base44.entities.Team.create({
    ...payload,
    short_name: shortNameFor(payload.name) || 'TEAM',
    ground_mode: mode || 'turf',
    tournament_id: tournamentId
  });
  return created.id;
}