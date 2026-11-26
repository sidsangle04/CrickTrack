import { base44 } from '@/api/base44Client';

// A bracketed nickname is not a different person: "Nikhil Choughule (Tinku)"
// and "Nikhil Choughule" match.
export const normPlayerName = (name) =>
  (name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

// Everyone entered in an auction or a tournament squad also gets a profile in
// the Players directory, so no one is missing from that list. The same person is
// never registered twice.
export async function ensurePlayerProfile({
  name,
  mode,
  tournamentId,
  role,
  photo_url,
  batting_style,
  bowling_style
}) {
  const clean = (name || '').trim();
  if (!clean) return null;

  const existing = await findPlayerByName({ name: clean, mode });
  if (existing) return existing;

  return await base44.entities.Player.create({
    name: clean,
    role: role || 'batsman',
    ground_mode: mode || 'turf',
    tournament_id: tournamentId || '',
    photo_url: photo_url || '',
    batting_style: batting_style || 'right_hand',
    bowling_style: bowling_style || 'none'
  });
}