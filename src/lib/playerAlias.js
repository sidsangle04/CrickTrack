// Play-Cricket scorecards are inconsistent about first names: one card prints
// "A Malpure", another "Atharva Malpure" for the same player. On import we
// treat those as the same person so an existing profile is reused instead of a
// duplicate being created. This applies only to the squads listed below —
// every other team keeps exact-name matching, so an initial in one club's card
// can never be folded into a same-surname player at another club.

const ALIAS_TEAMS = ["cardiff titans cc 1st xi"];

const words = (name) =>
  (name || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

// True when every word of shortName matches fullName in order, with any
// single-letter word standing in for the word it starts ("A" → "Atharva").
const abbreviates = (shortName, fullName) => {
  const s = words(shortName);
  const f = words(fullName);
  if (!s.length || !f.length || s.length > f.length) return false;
  if (s[s.length - 1] !== f[f.length - 1]) return false;
  let i = 0;
  let usedInitial = false;
  for (let j = 0; j < f.length && i < s.length; j++) {
    const sw = s[i];
    const fw = f[j];
    if (sw === fw) {
      i++;
      continue;
    }
    if (sw.length === 1 && fw.startsWith(sw)) {
      i++;
      usedInitial = true;
      continue;
    }
    if (i === s.length - 1 && j < f.length - 1) continue;
    return false;
  }
  return i === s.length && usedInitial;
};

export const namesMatch = (a, b) => abbreviates(a, b) || abbreviates(b, a);

export const isAliasTeam = (teamName) =>
  ALIAS_TEAMS.includes((teamName || "").trim().toLowerCase());

// Resolve a scorecard name to an existing player of that team.
export const findTeamPlayer = (players, name, team) => {
  if (!name || !team) return null;
  const sameTeam = players.filter((p) => p.team_id === team.id);
  const exact = sameTeam.find(
    (p) => (p.name || "").trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (exact) return exact;
  if (!isAliasTeam(team.name)) return null;
  return sameTeam.find((p) => namesMatch(p.name, name)) || null;
};