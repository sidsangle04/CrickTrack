// Icon player draw helpers: bowls, random picks and draw order.

export const BOWLS = ['bowl1', 'bowl2'];

export const BOWL_LABELS = { bowl1: 'Bowl 1', bowl2: 'Bowl 2' };

export const bowlLabel = (bowl) => BOWL_LABELS[bowl] || bowl;

// How many icon players each team gets. 0 skips the draft altogether, 1 or 2 use
// that many bowls. Every tournament can set its own number.
export function iconCountFor(auction) {
  const raw = Number(auction?.icons_per_team);
  const n = Number.isFinite(raw) ? raw : 2;
  return Math.max(0, Math.min(BOWLS.length, Math.round(n)));
}

export function activeBowls(icons = 2) {
  const n = Math.max(0, Math.min(BOWLS.length, Math.round(Number(icons) || 0)));
  return BOWLS.slice(0, n);
}

export function iconPlayers(players) {
  return players.filter((p) => p.category === 'icon');
}

export function inBowl(players, bowl) {
  return iconPlayers(players).filter((p) => p.bowl === bowl);
}

// Icon players still waiting to be drawn from a bowl.
export function remainingInBowl(players, bowl) {
  return inBowl(players, bowl).filter((p) => !p.sold_to_team_id);
}

export function unassignedIcons(players) {
  return iconPlayers(players).filter((p) => p.bowl === 'none');
}

export function pickRandom(list) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function orderedTeams(teams) {
  return [...teams].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}

// Which team draws next, and from which bowl. Worked out from who already holds a
// player in each bowl, so the order can never drift from what is actually saved.
export function nextDrawTurn({ players, teams, icons = 2 }) {
  const order = orderedTeams(teams);
  const bowls = activeBowls(icons);
  if (!order.length || !bowls.length) {
    return { done: true, round: bowls.length, index: order.length, team: null, bowl: null };
  }
  const has = (teamId, bowl) =>
    players.some((p) => p.category === 'icon' && p.bowl === bowl && p.sold_to_team_id === teamId);
  for (let i = 0; i < bowls.length; i++) {
    const bowl = bowls[i];
    const index = order.findIndex((team) => !has(team.id, bowl));
    if (index !== -1) {
      return { done: false, round: i + 1, index, team: order[index], bowl };
    }
  }
  return { done: true, round: bowls.length, index: order.length, team: null, bowl: null };
}

// Teams still without a player in a bowl.
export function teamsMissingBowl({ players, teams, bowl }) {
  return orderedTeams(teams).filter(
    (team) =>
      !players.some(
        (p) => p.category === 'icon' && p.bowl === bowl && p.sold_to_team_id === team.id
      )
  );
}

export function bowlsReady({ players, teams, icons = 2 }) {
  const order = orderedTeams(teams);
  const bowls = activeBowls(icons);
  const errors = [];
  const counts = {};
  if (!order.length) errors.push('Add the teams taking part first.');
  if (!bowls.length) return { ready: errors.length === 0, errors, counts, pool: 0 };

  bowls.forEach((bowl) => {
    const n = inBowl(players, bowl).length;
    counts[bowl] = n;
    if (n !== order.length)
      errors.push(
        `${bowlLabel(bowl)} needs exactly ${order.length} player${order.length === 1 ? '' : 's'} (has ${n}).`
      );
  });

  const pool = unassignedIcons(players).length;
  if (pool > 0) errors.push(`${pool} icon player${pool === 1 ? '' : 's'} still unassigned.`);

  const selected = iconPlayers(players).length;
  const needed = order.length * bowls.length;
  if (selected !== needed)
    errors.push(
      `Select exactly ${needed} icon player${needed === 1 ? '' : 's'} for ${order.length} team${
        order.length === 1 ? '' : 's'
      } (selected ${selected}).`
    );

  return { ready: errors.length === 0, errors, counts, pool };
}

export function assignmentsFor({ players, teams, icons = 2 }) {
  const order = orderedTeams(teams);
  const bowls = activeBowls(icons);
  return order.map((team) => ({
    team,
    picks: bowls.map((bowl) => ({
      bowl,
      player: players.find(
        (p) => p.category === 'icon' && p.bowl === bowl && p.sold_to_team_id === team.id
      )
    }))
  }));
}