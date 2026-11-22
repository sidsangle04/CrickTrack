// Icon player draw helpers: bowls, random picks and draw order.

export const BOWLS = ['bowl1', 'bowl2'];

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
export function nextDrawTurn({ players, teams }) {
  const order = orderedTeams(teams);
  if (!order.length) return { done: false, round: 1, index: 0, team: null, bowl: null };
  const has = (teamId, bowl) =>
    players.some((p) => p.category === 'icon' && p.bowl === bowl && p.sold_to_team_id === teamId);
  for (const bowl of BOWLS) {
    const index = order.findIndex((team) => !has(team.id, bowl));
    if (index !== -1) {
      return { done: false, round: bowl === 'bowl1' ? 1 : 2, index, team: order[index], bowl };
    }
  }
  return { done: true, round: 2, index: order.length, team: null, bowl: null };
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

export function bowlsReady({ players, teams }) {
  const order = orderedTeams(teams);
  const icons = iconPlayers(players);
  const b1 = inBowl(players, 'bowl1').length;
  const b2 = inBowl(players, 'bowl2').length;
  const pool = unassignedIcons(players).length;
  const errors = [];
  if (!order.length) errors.push('Add the teams taking part first.');
  if (b1 !== order.length)
    errors.push(`Bowl 1 needs exactly ${order.length} player${order.length === 1 ? '' : 's'} (has ${b1}).`);
  if (b2 !== order.length)
    errors.push(`Bowl 2 needs exactly ${order.length} player${order.length === 1 ? '' : 's'} (has ${b2}).`);
  if (pool > 0) errors.push(`${pool} icon player${pool === 1 ? '' : 's'} still unassigned.`);
  if (icons.length !== order.length * 2)
    errors.push(
      `Select exactly ${order.length * 2} icon players for ${order.length} teams (selected ${icons.length}).`
    );
  return { ready: errors.length === 0, errors, b1, b2, pool };
}

export function assignmentsFor({ players, teams }) {
  const order = orderedTeams(teams);
  return order.map((team) => ({
    team,
    bowl1: players.find((p) => p.category === 'icon' && p.bowl === 'bowl1' && p.sold_to_team_id === team.id),
    bowl2: players.find((p) => p.category === 'icon' && p.bowl === 'bowl2' && p.sold_to_team_id === team.id)
  }));
}