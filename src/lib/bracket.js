// Single-elimination bracket generation & derivation helpers.

export function nextPowerOfTwo(n) {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 2);
}

export function stageLabel(round, totalRounds) {
  const fromFinal = totalRounds - round;
  if (fromFinal === 0) return 'Final';
  if (fromFinal === 1) return 'Semifinal';
  if (fromFinal === 2) return 'Quarterfinal';
  if (fromFinal === 3) return 'Round of 16';
  return `Round ${round}`;
}

/**
 * Generate the full set of TournamentMatch records for a knockout bracket.
 * Round 1 is seeded with the given teams (byes fill empty slots when the
 * team count is not a power of two). Later rounds are created as empty slots
 * whose participants are derived in the UI from previous-round winners.
 */
export function generateBracket(tournamentId, teamIds) {
  const n = (teamIds || []).length;
  if (n < 2) return [];
  const slots = nextPowerOfTwo(n);
  const totalRounds = Math.round(Math.log2(slots));

  const seeded = [];
  for (let i = 0; i < slots; i++) seeded.push(i < n ? teamIds[i] : '');

  const matches = [];

  // Round 1 — seeded teams
  const r1Count = slots / 2;
  for (let i = 0; i < r1Count; i++) {
    matches.push({
      tournament_id: tournamentId,
      round: 1,
      match_index: i,
      stage_label: stageLabel(1, totalRounds),
      team1_id: seeded[i * 2] || '',
      team2_id: seeded[i * 2 + 1] || '',
      winner_team_id: '',
      match_id: '',
      next_round: totalRounds > 1 ? 2 : 0,
      next_index: Math.floor(i / 2),
      status: 'pending'
    });
  }

  // Later rounds — empty slots
  for (let r = 2; r <= totalRounds; r++) {
    const count = slots / Math.pow(2, r);
    for (let i = 0; i < count; i++) {
      matches.push({
        tournament_id: tournamentId,
        round: r,
        match_index: i,
        stage_label: stageLabel(r, totalRounds),
        team1_id: '',
        team2_id: '',
        winner_team_id: '',
        match_id: '',
        next_round: r < totalRounds ? r + 1 : 0,
        next_index: Math.floor(i / 2),
        status: 'pending'
      });
    }
  }

  return matches;
}

/**
 * Resolve the winner of a single bracket match.
 * Priority: manual winner_team_id, then a completed linked Match's winner_id,
 * then (round 1 only) an automatic bye for an unopposed team.
 */
export function matchWinner(tm, matchesMap, round) {
  if (tm.winner_team_id) return tm.winner_team_id;
  const linked = tm.match_id ? matchesMap[tm.match_id] : null;
  if (linked && linked.status === 'completed' && linked.winner_id) return linked.winner_id;
  if (round === 1) {
    if (tm.team1_id && !tm.team2_id) return tm.team1_id;
    if (!tm.team1_id && tm.team2_id) return tm.team2_id;
  }
  return '';
}

/**
 * Derive the full bracket state (teams + winners) for every round from the
 * round-1 seeds and the linked Match results. Later-round participants are
 * computed from previous-round winners, so advancement never needs to be
 * persisted separately.
 */
export function deriveBracket(tmMatches, matchesMap) {
  const byRound = {};
  tmMatches.forEach((m) => {
    if (!byRound[m.round]) byRound[m.round] = {};
    byRound[m.round][m.match_index] = m;
  });

  const totalRounds = Math.max(...Object.keys(byRound).map(Number));
  const state = {};

  for (let r = 1; r <= totalRounds; r++) {
    state[r] = {};
    const count = Object.keys(byRound[r] || {}).length;
    for (let i = 0; i < count; i++) {
      const tm = byRound[r][i] || {};
      let t1 = tm.team1_id || '';
      let t2 = tm.team2_id || '';
      if (r > 1) {
        t1 = state[r - 1][i * 2]?.winner || '';
        t2 = state[r - 1][i * 2 + 1]?.winner || '';
      }
      const winner = matchWinner(
        { ...tm, team1_id: t1, team2_id: t2 },
        matchesMap,
        r
      );
      state[r][i] = {
        id: tm.id,
        team1: t1,
        team2: t2,
        winner,
        stage_label: tm.stage_label,
        match_id: tm.match_id || '',
        status: tm.status
      };
    }
  }

  return { state, totalRounds };
}