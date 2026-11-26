import { base44 } from '@/api/base44Client';

export const normPlayerName = (name) => (name || '').trim().toLowerCase();

// Finds an existing player record for a name so the same person is never
// registered twice. A record already in the team wins, then one that belongs to
// no team, so attaching them never pulls anyone out of another squad.
export async function findPlayerByName({ name, mode, teamId, tournamentId }) {
  const key = normPlayerName(name);
  if (!key) return null;

  const query = {};
  if (mode) query.ground_mode = mode;
  if (tournamentId) query.tournament_id = tournamentId;

  const rows = await base44.entities.Player.filter(query);
  const matches = (Array.isArray(rows) ? rows : []).filter(
    (p) => normPlayerName(p.name) === key
  );
  if (!matches.length) return null;

  return (
    matches.find((p) => teamId && p.team_id === teamId) ||
    matches.find((p) => !p.team_id) ||
    matches[0]
  );
}