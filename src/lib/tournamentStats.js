// Tournament statistics engine.
//
// Every number here is derived from the scoring records already stored in the
// app (matches, innings, batter/bowler innings, partnerships). Nothing is
// entered by hand and nothing is cached, so editing, correcting or deleting a
// match immediately changes the tournament's statistics.

// Dismissals a bowler is credited with. Run-outs, retired, obstructing etc.
// are never bowler wickets.
const BOWLER_WICKETS = new Set(['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket']);

export const hasBatted = (b) =>
  !!b && b.status !== 'yet_to_bat' && b.status !== 'did_not_bat';

export const oversText = (balls = 0) => `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

const div = (a, b) => (b ? a / b : null);
const r2 = (v) => (v === null || v === undefined ? null : Math.round(v * 100) / 100);

/**
 * The matches a tournament's fixtures actually produced. The link is stored
 * twice: `TournamentMatch.match_id` and `Match.tournament_match_id`.
 */
export function resolveTournamentMatches(tournamentMatches = [], matches = []) {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const byFixture = new Map();
  matches.forEach((m) => {
    if (m.tournament_match_id) byFixture.set(m.tournament_match_id, m);
  });
  const out = [];
  const seen = new Set();
  (tournamentMatches || []).forEach((tm) => {
    const m = (tm.match_id && byId.get(tm.match_id)) || byFixture.get(tm.id);
    if (m && !seen.has(m.id)) {
      seen.add(m.id);
      out.push(m);
    }
  });
  return out;
}

const better = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  if (a.wickets !== b.wickets) return a.wickets > b.wickets ? a : b;
  return a.runs < b.runs ? a : b;
};

const fmtDate = (d) =>
  d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';

export function buildTournamentStats({
  tournament,
  tournamentMatches = [],
  matches = [],
  innings = [],
  batterInnings = [],
  bowlerInnings = [],
  partnerships = [],
  teams = [],
  players = [],
}) {
  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const playersById = Object.fromEntries(players.map((p) => [p.id, p]));

  const linked = resolveTournamentMatches(tournamentMatches, matches);
  const finalMatches = linked.filter((m) => m.status === 'completed');
  const liveMatches = linked.filter((m) =>
    ['live', 'innings_break', 'super_over'].includes(m.status)
  );
  const finalIds = new Set(finalMatches.map((m) => m.id));
  const playedIds = new Set(linked.map((m) => m.id));

  const matchById = Object.fromEntries(linked.map((m) => [m.id, m]));

  const opponentOf = (match, teamId) => {
    const otherId = match.team1_id === teamId ? match.team2_id : match.team1_id;
    return teamsById[otherId]?.short_name || teamsById[otherId]?.name || 'Opponent';
  };

  // Only completed matches with a recorded innings count towards the totals.
  const finalInnings = innings.filter(
    (i) => finalIds.has(i.match_id) && !i.is_super_over
  );
  const finalBatters = batterInnings.filter((b) => finalIds.has(b.match_id));
  const finalBowlers = bowlerInnings.filter((b) => finalIds.has(b.match_id));
  const finalPartnerships = partnerships.filter((p) => finalIds.has(p.match_id));

  // ---------- match appearance (playing XI, with innings as a fallback) ----------
  const matchesByPlayer = new Map();
  const addAppearance = (playerId, matchId) => {
    if (!playerId) return;
    const set = matchesByPlayer.get(playerId) || new Set();
    set.add(matchId);
    matchesByPlayer.set(playerId, set);
  };
  finalMatches.forEach((m) => {
    [...(m.team1_playing_xi || []), ...(m.team2_playing_xi || [])].forEach((pid) =>
      addAppearance(pid, m.id)
    );
  });
  [...finalBatters, ...finalBowlers].forEach((r) => addAppearance(r.player_id, r.match_id));

  // ---------- batting ----------
  const bat = new Map();
  finalBatters.forEach((b) => {
    if (!hasBatted(b)) return;
    const row = bat.get(b.player_id) || {
      player_id: b.player_id,
      innings: 0,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      dots: 0,
      dismissals: 0,
      not_outs: 0,
      thirties: 0,
      fifties: 0,
      hs: -1,
      hs_not_out: false,
    };
    const runs = b.runs || 0;
    row.innings += 1;
    row.runs += runs;
    row.balls += b.balls_faced || 0;
    row.fours += b.fours || 0;
    row.sixes += b.sixes || 0;
    row.dots += b.dots || 0;
    const out = b.is_out === true && b.dismissal_type !== 'retired_hurt';
    if (out) row.dismissals += 1;
    else row.not_outs += 1;
    if (runs >= 50) row.fifties += 1;
    else if (runs >= 30) row.thirties += 1;
    if (runs > row.hs || (runs === row.hs && !out)) {
      row.hs = runs;
      row.hs_not_out = !out;
    }
    bat.set(b.player_id, row);
  });

  const batting = [...bat.values()].map((row) => {
    const player = playersById[row.player_id];
    const teamId = player?.team_id || '';
    return {
      ...row,
      hs: row.hs < 0 ? 0 : row.hs,
      name: player?.name || 'Unknown player',
      team_id: teamId,
      team_name: teamsById[teamId]?.short_name || teamsById[teamId]?.name || '',
      matches: matchesByPlayer.get(row.player_id)?.size || 0,
      average: r2(div(row.runs, row.dismissals)),
      strike_rate: row.balls ? r2((row.runs / row.balls) * 100) : null,
      hs_text: `${row.hs < 0 ? 0 : row.hs}${row.hs_not_out ? '*' : ''}`,
    };
  });

  // ---------- bowling ----------
  const bowl = new Map();
  finalBowlers.forEach((b) => {
    const row = bowl.get(b.player_id) || {
      player_id: b.player_id,
      balls: 0,
      runs: 0,
      wickets: 0,
      maidens: 0,
      dots: 0,
      best: null,
    };
    const legal = b.balls || (b.overs ? Math.round(b.overs * 6) : 0);
    row.balls += legal;
    row.runs += b.runs_conceded || 0;
    row.wickets += b.wickets || 0;
    row.maidens += b.maidens || 0;
    row.dots += b.dots || 0;
    row.best = better(row.best, { wickets: b.wickets || 0, runs: b.runs_conceded || 0 });
    bowl.set(b.player_id, row);
  });

  const bowling = [...bowl.values()].map((row) => {
    const player = playersById[row.player_id];
    const teamId = player?.team_id || '';
    return {
      ...row,
      name: player?.name || 'Unknown player',
      team_id: teamId,
      team_name: teamsById[teamId]?.short_name || teamsById[teamId]?.name || '',
      matches: matchesByPlayer.get(row.player_id)?.size || 0,
      overs: oversText(row.balls),
      average: r2(div(row.runs, row.wickets)),
      economy: row.balls ? r2(row.runs / (row.balls / 6)) : null,
      strike_rate: row.wickets ? r2(row.balls / row.wickets) : null,
      best_text: row.best ? `${row.best.wickets}/${row.best.runs}` : '—',
      best_sort: row.best ? row.best.wickets * 1000 - row.best.runs : -1,
    };
  });

  // ---------- fielding ----------
  const field = new Map();
  const bump = (playerId, key) => {
    if (!playerId) return;
    const row = field.get(playerId) || {
      player_id: playerId,
      catches: 0,
      run_outs: 0,
      stumpings: 0,
    };
    row[key] += 1;
    field.set(playerId, row);
  };
  finalBatters.forEach((b) => {
    if (!b.is_out || !b.dismissed_by_fielder_id) return;
    if (b.dismissal_type === 'caught') bump(b.dismissed_by_fielder_id, 'catches');
    else if (b.dismissal_type === 'run_out') bump(b.dismissed_by_fielder_id, 'run_outs');
    else if (b.dismissal_type === 'stumped') bump(b.dismissed_by_fielder_id, 'stumpings');
  });
  const fielding = [...field.values()].map((row) => {
    const player = playersById[row.player_id];
    const teamId = player?.team_id || '';
    return {
      ...row,
      name: player?.name || 'Unknown player',
      team_id: teamId,
      team_name: teamsById[teamId]?.short_name || teamsById[teamId]?.name || '',
      matches: matchesByPlayer.get(row.player_id)?.size || 0,
      total: row.catches + row.run_outs + row.stumpings,
    };
  });

  // ---------- teams ----------
  const teamIds = [
    ...new Set(
      [
        ...(tournament?.team_ids || []),
        ...linked.flatMap((m) => [m.team1_id, m.team2_id]),
      ].filter(Boolean)
    ),
  ];

  const teamRows = teamIds.map((id) => {
    const teamMatches = finalMatches.filter(
      (m) => m.team1_id === id || m.team2_id === id
    );
    const ownInnings = finalInnings.filter((i) => i.batting_team_id === id);
    const oppInnings = finalInnings.filter(
      (i) => i.bowling_team_id === id || (i.match_id && teamMatches.some((m) => m.id === i.match_id && i.batting_team_id !== id))
    );
    const scores = ownInnings.map((i) => i.total_runs || 0);
    const won = teamMatches.filter((m) => m.winner_id === id).length;
    const lost = teamMatches.filter((m) => m.winner_id && m.winner_id !== id).length;
    const noResult = teamMatches.filter((m) => m.status === 'completed' && !m.winner_id && m.result && /no result|abandon|forfeit/i.test(m.result)).length;
    const tied = teamMatches.length - won - lost - noResult;
    const runsFor = scores.reduce((a, b) => a + b, 0);
    const runsAgainst = oppInnings.reduce((a, i) => a + (i.total_runs || 0), 0);

    const oversOf = (inn, match) => {
      const quota = match?.overs_per_innings || 0;
      return inn.end_reason === 'all_out' && quota > 0 ? quota : (inn.total_balls || 0) / 6;
    };
    const oversFor = ownInnings.reduce(
      (a, i) => a + oversOf(i, matchById[i.match_id]),
      0
    );
    const oversAgainst = oppInnings.reduce(
      (a, i) => a + oversOf(i, matchById[i.match_id]),
      0
    );
    const nrr =
      oversFor > 0 || oversAgainst > 0
        ? r2(
            (oversFor > 0 ? runsFor / oversFor : 0) -
              (oversAgainst > 0 ? runsAgainst / oversAgainst : 0)
          )
        : null;

    const teamBatters = finalBatters.filter((b) =>
      ownInnings.some((i) => i.id === b.innings_id)
    );

    return {
      team_id: id,
      name: teamsById[id]?.name || 'Team',
      short_name: teamsById[id]?.short_name || '',
      logo_url: teamsById[id]?.logo_url || '',
      color: teamsById[id]?.primary_color || '#374151',
      played: teamMatches.length,
      won,
      lost,
      tied: Math.max(tied, 0),
      no_result: noResult,
      points: won * 2 + Math.max(tied, 0),
      runs_for: runsFor,
      runs_against: runsAgainst,
      highest: scores.length ? Math.max(...scores) : null,
      lowest: scores.length ? Math.min(...scores) : null,
      average_score: scores.length ? r2(runsFor / scores.length) : null,
      wickets_taken: oppInnings.reduce((a, i) => a + (i.total_wickets || 0), 0),
      wickets_lost: ownInnings.reduce((a, i) => a + (i.total_wickets || 0), 0),
      fours: teamBatters.reduce((a, b) => a + (b.fours || 0), 0),
      sixes: teamBatters.reduce((a, b) => a + (b.sixes || 0), 0),
      nrr,
      matchIds: teamMatches.map((m) => m.id),
    };
  });

  const pointsTable = [...teamRows].sort(
    (a, b) => b.points - a.points || b.won - a.won || (b.nrr || 0) - (a.nrr || 0)
  );

  // ---------- overview ----------
  const highestTeamInnings = finalInnings.reduce((best, i) => {
    if (!best) return i;
    return (i.total_runs || 0) > (best.total_runs || 0) ? i : best;
  }, null);
  const bestBatting = batting.reduce((a, b) => (!a || b.hs > a.hs ? b : a), null);
  const bestBowling = bowling.reduce(
    (a, b) => (b.best_sort > (a?.best_sort ?? -1) ? b : a),
    null
  );
  const totalRuns = finalInnings.reduce((a, i) => a + (i.total_runs || 0), 0);
  const totalBalls = finalInnings.reduce((a, i) => a + (i.total_balls || 0), 0);

  const overview = {
    matches: finalMatches.length,
    live_matches: liveMatches.length,
    runs: totalRuns,
    wickets: finalInnings.reduce((a, i) => a + (i.total_wickets || 0), 0),
    balls: totalBalls,
    overs: oversText(totalBalls),
    sixes: finalBatters.reduce((a, b) => a + (b.sixes || 0), 0),
    fours: finalBatters.reduce((a, b) => a + (b.fours || 0), 0),
    highest_team_score: highestTeamInnings
      ? {
          value: `${highestTeamInnings.total_runs || 0}/${highestTeamInnings.total_wickets || 0}`,
          team: teamsById[highestTeamInnings.batting_team_id]?.short_name || teamsById[highestTeamInnings.batting_team_id]?.name || 'Team',
          match_id: highestTeamInnings.match_id,
        }
      : null,
    highest_individual: bestBatting
      ? { value: bestBatting.hs_text, name: bestBatting.name, player_id: bestBatting.player_id, team: bestBatting.team_name }
      : null,
    best_bowling: bestBowling
      ? { value: bestBowling.best_text, name: bestBowling.name, player_id: bestBowling.player_id, team: bestBowling.team_name }
      : null,
    average_per_match: finalMatches.length ? r2(totalRuns / finalMatches.length) : null,
  };

  // ---------- records ----------
  const inningsBest = (rows, pick) =>
    rows.reduce((best, r) => {
      const v = pick(r);
      return !best || v > best.v ? { v, r } : best;
    }, null);

  const fastest = inningsBest(
    finalBatters.filter((b) => hasBatted(b) && (b.balls_faced || 0) >= 10),
    (b) => ((b.runs || 0) / b.balls_faced) * 100
  );
  const mostSixesInnings = inningsBest(finalBatters.filter(hasBatted), (b) => b.sixes || 0);
  const mostFoursInnings = inningsBest(finalBatters.filter(hasBatted), (b) => b.fours || 0);
  const lowestTeamInnings = finalInnings.reduce((low, i) => {
    if (!low) return i;
    return (i.total_runs || 0) < (low.total_runs || 0) ? i : low;
  }, null);
  const topPartnership = finalPartnerships.reduce(
    (best, p) => (!best || (p.runs || 0) > (best.runs || 0) ? p : best),
    null
  );
  const topScorer = batting.reduce((a, b) => (!a || b.runs > a.runs ? b : a), null);
  const topWicketTaker = bowling.reduce((a, b) => (!a || b.wickets > a.wickets ? b : a), null);

  const matchRef = (matchId, teamId) => {
    const m = matchById[matchId];
    if (!m) return '';
    const opp = teamId ? `vs ${opponentOf(m, teamId)}` : '';
    return [opp, fmtDate(m.date)].filter(Boolean).join(' · ');
  };

  const playerRecord = (row, value, extra, matchId, teamId) => ({
    value,
    name: row?.name || '—',
    sub: extra || '',
    match: matchRef(matchId, teamId || row?.team_id),
    match_id: matchId || '',
    player_id: row?.player_id || '',
  });

  const records = {
    highest_team_total: highestTeamInnings
      ? {
          value: `${highestTeamInnings.total_runs || 0}/${highestTeamInnings.total_wickets || 0}`,
          name: teamsById[highestTeamInnings.batting_team_id]?.name || 'Team',
          match: matchRef(highestTeamInnings.match_id, highestTeamInnings.batting_team_id),
          match_id: highestTeamInnings.match_id,
        }
      : null,
    lowest_team_total: lowestTeamInnings
      ? {
          value: `${lowestTeamInnings.total_runs || 0}/${lowestTeamInnings.total_wickets || 0}`,
          name: teamsById[lowestTeamInnings.batting_team_id]?.name || 'Team',
          match: matchRef(lowestTeamInnings.match_id, lowestTeamInnings.batting_team_id),
          match_id: lowestTeamInnings.match_id,
        }
      : null,
    highest_individual: bestBatting
      ? playerRecord(bestBatting, bestBatting.hs_text, bestBatting.team_name, bestBatting.hs_match_id)
      : null,
    fastest_innings: fastest
      ? playerRecord(
          batting.find((b) => b.player_id === fastest.r.player_id),
          `${fastest.r.runs} (${fastest.r.balls_faced}b)`,
          `${r2(fastest.v)} SR`,
          fastest.r.match_id
        )
      : null,
    most_sixes_innings: mostSixesInnings
      ? playerRecord(
          batting.find((b) => b.player_id === mostSixesInnings.r.player_id),
          `${mostSixesInnings.v} sixes`,
          `${mostSixesInnings.r.runs} runs`,
          mostSixesInnings.r.match_id
        )
      : null,
    most_fours_innings: mostFoursInnings
      ? playerRecord(
          batting.find((b) => b.player_id === mostFoursInnings.r.player_id),
          `${mostFoursInnings.v} fours`,
          `${mostFoursInnings.r.runs} runs`,
          mostFoursInnings.r.match_id
        )
      : null,
    best_bowling: bestBowling
      ? playerRecord(bestBowling, bestBowling.best_text, bestBowling.team_name)
      : null,
    most_wickets_match: bestBowling
      ? playerRecord(bestBowling, `${bestBowling.best?.wickets || 0} wkts`, bestBowling.team_name)
      : null,
    highest_partnership: topPartnership
      ? {
          value: `${topPartnership.runs || 0}`,
          name: `${playersById[topPartnership.batter1_id]?.name || 'Batter'} & ${playersById[topPartnership.batter2_id]?.name || 'Batter'}`,
          sub: `${topPartnership.balls || 0} balls · ${topPartnership.wicket_number}${['st', 'nd', 'rd'][topPartnership.wicket_number - 1] || 'th'} wicket`,
          match: matchRef(topPartnership.match_id),
          match_id: topPartnership.match_id,
        }
      : null,
    most_runs: topScorer ? playerRecord(topScorer, `${topScorer.runs}`, `${topScorer.innings} inns`, '', topScorer.team_id) : null,
    most_wickets: topWicketTaker
      ? playerRecord(topWicketTaker, `${topWicketTaker.wickets}`, `${topWicketTaker.overs} ov`, '', topWicketTaker.team_id)
      : null,
  };

  // Highest individual score needs its own match reference.
  const hsRow = finalBatters
    .filter(hasBatted)
    .reduce((best, b) => (!best || (b.runs || 0) > (best.runs || 0) ? b : best), null);
  if (records.highest_individual && hsRow) {
    records.highest_individual.match = matchRef(hsRow.match_id, bestBatting?.team_id);
    records.highest_individual.match_id = hsRow.match_id;
  }
  const bestBowlRow = finalBowlers.reduce((best, b) => {
    if (!best) return b;
    if ((b.wickets || 0) !== (best.wickets || 0)) return (b.wickets || 0) > (best.wickets || 0) ? b : best;
    return (b.runs_conceded || 0) < (best.runs_conceded || 0) ? b : best;
  }, null);
  if (records.best_bowling && bestBowlRow) {
    records.best_bowling.match = matchRef(bestBowlRow.match_id);
    records.best_bowling.match_id = bestBowlRow.match_id;
    records.most_wickets_match = { ...records.best_bowling };
  }

  // ---------- per-player match log (drill-down + charts) ----------
  const playerLog = {};
  const ensureLog = (playerId) => {
    if (!playerLog[playerId]) playerLog[playerId] = [];
    return playerLog[playerId];
  };
  const logEntry = (playerId, matchId) => {
    const list = ensureLog(playerId);
    let entry = list.find((e) => e.match_id === matchId);
    if (!entry) {
      const m = matchById[matchId];
      const teamId = playersById[playerId]?.team_id;
      entry = {
        match_id: matchId,
        date: m?.date || '',
        label: m ? opponentOf(m, teamId) : 'Match',
        live: !finalIds.has(matchId),
        runs: null,
        balls: null,
        out: null,
        wickets: null,
        conceded: null,
        bowled_balls: null,
        catches: 0,
        run_outs: 0,
        stumpings: 0,
      };
      list.push(entry);
    }
    return entry;
  };

  batterInnings.forEach((b) => {
    if (!playedIds.has(b.match_id) || !hasBatted(b)) return;
    const e = logEntry(b.player_id, b.match_id);
    e.runs = b.runs || 0;
    e.balls = b.balls_faced || 0;
    e.out = b.is_out === true && b.dismissal_type !== 'retired_hurt';
    if (b.is_out && b.dismissed_by_fielder_id) {
      if (b.dismissal_type === 'caught') e.catches += 1;
      else if (b.dismissal_type === 'run_out') e.run_outs += 1;
      else if (b.dismissal_type === 'stumped') e.stumpings += 1;
    }
  });
  bowlerInnings.forEach((b) => {
    if (!playedIds.has(b.match_id)) return;
    const e = logEntry(b.player_id, b.match_id);
    e.wickets = b.wickets || 0;
    e.conceded = b.runs_conceded || 0;
    e.bowled_balls = b.balls || (b.overs ? Math.round(b.overs * 6) : 0);
  });

  Object.values(playerLog).forEach((list) =>
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  );

  // ---------- chart series ----------
  const charts = {
    runs_by_team: teamRows
      .filter((t) => t.runs_for > 0)
      .map((t) => ({ name: t.short_name || t.name, runs: t.runs_for, color: t.color })),
    top_run_scorers: [...batting]
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5)
      .map((p) => ({ name: p.name, runs: p.runs })),
    top_wicket_takers: [...bowling]
      .sort((a, b) => b.wickets - a.wickets || b.best_sort - a.best_sort)
      .slice(0, 5)
      .map((p) => ({ name: p.name, wickets: p.wickets })),
    wins: pointsTable.filter((t) => t.played > 0).map((t) => ({ name: t.short_name || t.name, wins: t.won, losses: t.lost, color: t.color })),
    boundaries: teamRows.map((t) => ({ name: t.short_name || t.name, fours: t.fours, sixes: t.sixes })),
    runs_per_match: [...finalMatches]
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .map((m, idx) => {
        const total = finalInnings
          .filter((i) => i.match_id === m.id)
          .reduce((a, i) => a + (i.total_runs || 0), 0);
        return {
          name: `M${idx + 1}`,
          runs: total,
          label: `${teamsById[m.team1_id]?.short_name || 'T1'} v ${teamsById[m.team2_id]?.short_name || 'T2'}`,
        };
      }),
  };

  return {
    linked,
    finalMatches,
    liveMatches,
    innings: innings.filter((i) => playedIds.has(i.match_id) && !i.is_super_over),
    finalInnings,
    batting,
    bowling,
    fielding,
    teams: teamRows,
    pointsTable,
    overview,
    records,
    charts,
    playerLog,
    teamsById,
    playersById,
    matchById,
    hasData: finalMatches.length > 0,
  };
}