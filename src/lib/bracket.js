// Tournament fixture generation & derivation helpers.
// Supports two formats: pure knockout (single elimination) and
// league + knockout (round-robin league stage feeding a seeded bracket).

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
 * Standard bracket seeding order for a power-of-two slot count.
 * slots=4 -> [1,4,2,3]; slots=8 -> [1,8,4,5,2,7,3,6].
 */
export function seedOrder(slots) {
  let order = [1, 2];
  while (order.length < slots) {
    const total = order.length * 2;
    const next = [];
    for (let i = 0; i < order.length; i++) {
      next.push(order[i]);
      next.push(total + 1 - order[i]);
    }
    order = next;
  }
  return order;
}

/**
 * Generate the full set of TournamentMatch records for a knockout bracket.
 */
export function generateBracket(tournamentId, teamIds) {
  const n = (teamIds || []).length;
  if (n < 2) return [];
  const slots = nextPowerOfTwo(n);
  const totalRounds = Math.round(Math.log2(slots));

  const seeded = [];
  for (let i = 0; i < slots; i++) seeded.push(i < n ? teamIds[i] : '');

  const matches = [];

  const r1Count = slots / 2;
  for (let i = 0; i < r1Count; i++) {
    matches.push({
      tournament_id: tournamentId,
      stage: 'knockout',
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

  for (let r = 2; r <= totalRounds; r++) {
    const count = slots / Math.pow(2, r);
    for (let i = 0; i < count; i++) {
      matches.push({
        tournament_id: tournamentId,
        stage: 'knockout',
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
 * Generate round-robin league fixtures (single round-robin): every team
 * plays every other team once. Uses the circle method so fixtures are
 * grouped into rounds (n-1 rounds for even n, n rounds for odd n with byes).
 */
export function generateLeague(tournamentId, teamIds) {
  const ids = (teamIds || []).filter(Boolean);
  const n = ids.length;
  if (n < 2) return [];

  const arr = ids.slice();
  if (arr.length % 2 !== 0) arr.push(null); // bye placeholder
  const totalRounds = arr.length - 1;
  const half = arr.length / 2;

  const matches = [];
  const fixed = arr[0];
  let rotating = arr.slice(1);

  for (let r = 0; r < totalRounds; r++) {
    const week = [fixed, ...rotating];
    let mi = 0;
    for (let i = 0; i < half; i++) {
      const a = week[i];
      const b = week[week.length - 1 - i];
      if (!a || !b) {
        mi++;
        continue; // bye — no fixture
      }
      matches.push({
        tournament_id: tournamentId,
        stage: 'league',
        round: r + 1,
        match_index: mi,
        stage_label: `League R${r + 1}`,
        team1_id: a,
        team2_id: b,
        winner_team_id: '',
        match_id: '',
        next_round: 0,
        next_index: 0,
        status: 'pending'
      });
      mi++;
    }
    // rotate: move last to front
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  return matches;
}

/**
 * Generate an empty knockout bracket for the league+knockout format.
 * Round-1 teams are filled at derivation time from the league standings.
 */
export function generateLeagueKnockoutBracket(tournamentId, knockoutTeams) {
  const k = Math.max(2, knockoutTeams || 4);
  const slots = nextPowerOfTwo(k);
  const totalRounds = Math.round(Math.log2(slots));
  const matches = [];

  for (let r = 1; r <= totalRounds; r++) {
    const count = slots / Math.pow(2, r);
    for (let i = 0; i < count; i++) {
      matches.push({
        tournament_id: tournamentId,
        stage: 'knockout',
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
 * Derive the knockout bracket state. `round1Teams` optionally overrides
 * the stored round-1 participants (used by league+knockout to seed from
 * standings); each entry is { team1, team2 } indexed by match_index.
 */
export function deriveBracket(tmMatches, matchesMap, options = {}) {
  const { round1Teams, roundTeams } = options;
  const byRound = {};
  tmMatches.forEach((m) => {
    if (!byRound[m.round]) byRound[m.round] = {};
    byRound[m.round][m.match_index] = m;
  });

  const roundKeys = Object.keys(byRound).map(Number);
  const totalRounds = roundKeys.length ? Math.max(...roundKeys) : 0;
  const state = {};

  for (let r = 1; r <= totalRounds; r++) {
    state[r] = {};
    const count = Object.keys(byRound[r] || {}).length;
    for (let i = 0; i < count; i++) {
      const tm = byRound[r][i] || {};
      let t1 = tm.team1_id || '';
      let t2 = tm.team2_id || '';
      const prev1 = r > 1 ? state[r - 1][i * 2]?.winner || '' : '';
      const prev2 = r > 1 ? state[r - 1][i * 2 + 1]?.winner || '' : '';
      const override =
        (roundTeams && roundTeams[r] && roundTeams[r][i]) ||
        (r === 1 && round1Teams && round1Teams[i]) ||
        null;
      if (override) {
        t1 = override.team1 || (r > 1 ? prev1 : '');
        t2 = override.team2 || (r > 1 ? prev2 : '');
      } else if (r > 1) {
        t1 = prev1;
        t2 = prev2;
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

/**
 * Compute league standings from league fixtures. Points: win = 2,
 * loss = 0, tie/no-result = 1 each. Sorted by points desc, then wins desc,
 * then losses asc, then net run rate desc.
 *
 * Net run rate per team = (runs scored / overs faced) - (runs conceded / overs
 * bowled), aggregated across decided league matches. A side dismissed before
 * completing its quota is charged the full quota of overs (all-out rule);
 * partial overs count as legal balls / 6; Super Over innings are excluded.
 * `inningsByMatch` maps match id -> innings records for that match.
 */
export function computeStandings(leagueMatches, matchesMap, inningsByMatch = {}) {
  const teams = {};
  const ensure = (id) => {
    if (id && !teams[id]) {
      teams[id] = {
        id,
        p: 0,
        w: 0,
        l: 0,
        nr: 0,
        pts: 0,
        runsFor: 0,
        oversFor: 0,
        runsAgainst: 0,
        oversAgainst: 0,
        nrr: null
      };
    }
  };

  const oversFaced = (inn, quota) =>
    inn.end_reason === 'all_out' && quota > 0
      ? quota
      : (inn.total_balls || 0) / 6;

  const tally = (team, inns, quota, side) => {
    inns.forEach((inn) => {
      const overs = oversFaced(inn, quota);
      if (side === 'for') {
        team.runsFor += inn.total_runs || 0;
        team.oversFor += overs;
      } else {
        team.runsAgainst += inn.total_runs || 0;
        team.oversAgainst += overs;
      }
    });
  };

  leagueMatches.forEach((m) => {
    ensure(m.team1_id);
    ensure(m.team2_id);
    const t1 = teams[m.team1_id];
    const t2 = teams[m.team2_id];
    if (!t1 || !t2) return;

    let winner = m.winner_team_id || '';
    const linked = m.match_id ? matchesMap[m.match_id] : null;
    const completed = linked && linked.status === 'completed';
    if (completed && !winner) winner = linked.winner_id || '';

    if (!completed && !winner) return; // not yet decided

    t1.p++;
    t2.p++;
    if (winner === t1.id) {
      t1.w++;
      t1.pts += 2;
      t2.l++;
    } else if (winner === t2.id) {
      t2.w++;
      t2.pts += 2;
      t1.l++;
    } else {
      t1.nr++;
      t2.nr++;
      t1.pts++;
      t2.pts++;
    }

    // Net run rate — only from completed matches with recorded innings.
    if (completed && linked) {
      const quota = linked.overs_per_innings || 0;
      const inns = (inningsByMatch[linked.id] || []).filter((i) => !i.is_super_over);
      const t1Inns = inns.filter((i) => i.batting_team_id === t1.id);
      const t2Inns = inns.filter((i) => i.batting_team_id === t2.id);
      tally(t1, t1Inns, quota, 'for');
      tally(t2, t2Inns, quota, 'for');
      tally(t1, t2Inns, quota, 'against');
      tally(t2, t1Inns, quota, 'against');
    }
  });

  Object.values(teams).forEach((t) => {
    if (t.oversFor > 0 || t.oversAgainst > 0) {
      const forRate = t.oversFor > 0 ? t.runsFor / t.oversFor : 0;
      const againstRate = t.oversAgainst > 0 ? t.runsAgainst / t.oversAgainst : 0;
      t.nrr = forRate - againstRate;
    }
  });

  return Object.values(teams).sort(
    (a, b) =>
      b.pts - a.pts ||
      b.w - a.w ||
      a.l - b.l ||
      (b.nrr || 0) - (a.nrr || 0)
  );
}

/**
 * True when every league fixture has a decided result.
 */
export function leagueComplete(leagueMatches, matchesMap) {
  if (!leagueMatches.length) return false;
  return leagueMatches.every((m) => {
    if (m.winner_team_id) return true;
    const linked = m.match_id ? matchesMap[m.match_id] : null;
    return linked && linked.status === 'completed';
  });
}

/**
 * Build the round-1 knockout team pairs seeded from the final league
 * standings, using standard bracket seeding order.
 */
export function seedKnockoutRound1(standings, knockoutTeams) {
  const k = Math.max(2, knockoutTeams || 4);
  const slots = nextPowerOfTwo(k);
  const order = seedOrder(slots);
  const count = slots / 2;
  const res = [];
  for (let i = 0; i < count; i++) {
    const s1 = order[2 * i];
    const s2 = order[2 * i + 1];
    res.push({
      team1: (standings[s1 - 1] && standings[s1 - 1].id) || '',
      team2: (standings[s2 - 1] && standings[s2 - 1].id) || ''
    });
  }
  return res;
}

/**
 * League + Playoffs (exactly 4 teams): single round-robin league, then the
 * table topper goes straight to the Final, 2nd plays 3rd in the Semifinal,
 * and the last-placed team is eliminated.
 */
export function generateLeaguePlayoffs(tournamentId, teamIds) {
  const league = generateLeague(tournamentId, teamIds);
  return [
    ...league,
    {
      tournament_id: tournamentId,
      stage: 'knockout',
      round: 1,
      match_index: 0,
      stage_label: 'Semifinal',
      team1_id: '',
      team2_id: '',
      winner_team_id: '',
      match_id: '',
      next_round: 2,
      next_index: 0,
      status: 'pending'
    },
    {
      tournament_id: tournamentId,
      stage: 'knockout',
      round: 2,
      match_index: 0,
      stage_label: 'Final',
      team1_id: '',
      team2_id: '',
      winner_team_id: '',
      match_id: '',
      next_round: 0,
      next_index: 0,
      status: 'pending'
    }
  ];
}

/**
 * Seed the playoffs bracket from the final league standings: the topper is
 * anchored into the Final's team1 slot, 2nd vs 3rd contest the Semifinal, and
 * the Semifinal winner fills the Final's team2 slot once that game is decided.
 */
export function seedPlayoffs(standings, knockoutMatches, matchesMap) {
  const at = (i) => (standings[i] && standings[i].id) || '';
  const map = matchesMap || {};
  const semifinal = (knockoutMatches || []).find(
    (m) => m.round === 1 && m.match_index === 0
  );
  const semifinalWinner = semifinal ? matchWinner(semifinal, map, 1) : '';
  return {
    roundTeams: {
      1: [{ team1: at(1), team2: at(2) }],
      2: [{ team1: at(0), team2: semifinalWinner }]
    }
  };
}