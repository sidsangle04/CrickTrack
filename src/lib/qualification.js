// Qualification scenario guidance for league standings.
//
// Guidance is derived from the CURRENT table: every undecided fixture other
// than the one being considered is assumed not to change the standings, so
// the output is provisional while other league matches remain.

const PAR_RATE = 6.0;

function oversText(o) {
  let whole = Math.floor(o);
  let balls = Math.round((o - whole) * 6);
  if (balls >= 6) {
    whole += 1;
    balls = 0;
  }
  return `${whole}.${balls}`;
}

/**
 * Work out the win margin a team needs on NRR, given a target net run rate it
 * must beat after the match. Returns { batFirst, chase } — a run margin to
 * defend, a latest overs figure to complete a chase, or null where the target
 * is unreachable that way.
 */
function requiredMargin(team, quota, targetNRR) {
  const Q = quota;
  if (!Q || Q <= 0) return { batFirst: null, chase: null };

  const RF = team.runsFor || 0;
  const OF = team.oversFor || 0;
  const RA = team.runsAgainst || 0;
  const OA = team.oversAgainst || 0;

  // Batting first: assume the team posts its current scoring rate over the quota.
  const batRate = OF > 0 ? RF / OF : PAR_RATE;
  const posted = batRate * Q;
  const forRate = (RF + posted) / (OF + Q);
  const maxConceded = (forRate - targetNRR) * (OA + Q) - RA;
  const margin = Math.ceil(posted - maxConceded);
  const batFirst = margin <= posted ? Math.max(1, margin) : null;

  // Chasing: assume the opponent posts its current conceded rate over the quota.
  const bowlRate = OA > 0 ? RA / OA : PAR_RATE;
  const oppScore = bowlRate * Q;
  const target = oppScore + 1;
  const K = targetNRR + (RA + oppScore) / (OA + Q);
  let chase = null;
  if (K > 0) {
    const maxOvers = (RF + target) / K - OF;
    if (maxOvers > 0) chase = oversText(Math.min(maxOvers, Q));
  }

  return { batFirst, chase };
}

export function computeQualification({
  standings,
  leagueMatches,
  matchesMap,
  teamsMap,
  qualifyPlaces
}) {
  const places = Math.max(1, qualifyPlaces || 1);
  const map = matchesMap || {};
  const name = (id) => teamsMap?.[id]?.name || 'opponent';

  const decided = (m) => {
    if (m.winner_team_id) return true;
    const linked = m.match_id ? map[m.match_id] : null;
    return !!(linked && linked.status === 'completed');
  };
  const quotaOf = (m) => {
    const linked = m.match_id ? map[m.match_id] : null;
    return (linked && linked.overs_per_innings) || 0;
  };

  const remaining = (leagueMatches || []).filter((m) => !decided(m));
  const provisional = remaining.length > 0;

  const result = {};

  standings.forEach((s, i) => {
    const rank = i + 1;
    const fixtures = remaining.filter(
      (m) => m.team1_id === s.id || m.team2_id === s.id
    );

    if (!fixtures.length) {
      result[s.id] = {
        status: rank <= places ? 'qualified' : 'out',
        provisional,
        lines: []
      };
      return;
    }

    const bestPts = s.pts + 2 * fixtures.length;
    const chaserPts = standings[places] ? standings[places].pts : 0;
    let status;
    if (rank <= places) status = 'qualified';
    else if (bestPts >= chaserPts) status = 'possible';
    else status = 'out';

    const lines = status === 'qualified'
      ? []
      : fixtures.map((m) => {
          const opponentId = m.team1_id === s.id ? m.team2_id : m.team1_id;
          const oppName = name(opponentId);
          const newPts = s.pts + 2;

          // Points-only simulation: the team wins, everyone else unchanged.
          const simPts = standings
            .map((t) => ({ id: t.id, pts: t.id === s.id ? newPts : t.pts }))
            .sort((a, b) => b.pts - a.pts);
          const cutPts = simPts[places - 1] ? simPts[places - 1].pts : 0;

          if (newPts > cutPts) {
            return { opponentId, kind: 'through', text: `Beat ${oppName} and you're through` };
          }

          if (newPts === cutPts) {
            // Level on points at the cut-off — net run rate decides.
            const tied = standings.filter(
              (t) =>
                t.id !== s.id &&
                t.pts === newPts &&
                t.nrr !== null &&
                t.nrr !== undefined
            );
            const targetNRR = tied.length ? Math.max(...tied.map((t) => t.nrr)) : 0;
            const { batFirst, chase } = requiredMargin(s, quotaOf(m), targetNRR);
            const parts = [];
            if (batFirst) parts.push(`win by ${batFirst}+ runs`);
            if (chase) parts.push(`chase it down inside ${chase} overs`);
            return {
              opponentId,
              kind: 'nrr',
              text: parts.length
                ? `Beat ${oppName} by a margin — ${parts.join(', or ')}`
                : `Beat ${oppName} and hope the net run rate falls your way`
            };
          }

          return {
            opponentId,
            kind: 'outside',
            text: `Beat ${oppName}, and other results must go your way`
          };
        });

    result[s.id] = { status, provisional, lines };
  });

  return result;
}

// Points position for a team assuming it wins its next match (+2), with every
// other fixture left as-is. Mirrors the panel logic.
function pointsStatus(team, standings, places) {
  const newPts = team.pts + 2;
  const sim = standings
    .map((t) => ({ id: t.id, pts: t.id === team.id ? newPts : t.pts }))
    .sort((a, b) => b.pts - a.pts);
  const cutPts = sim[places - 1] ? sim[places - 1].pts : 0;
  if (newPts > cutPts) return { kind: 'through', newPts };
  if (newPts < cutPts) return { kind: 'outside', newPts };
  const tied = standings.filter(
    (t) => t.id !== team.id && t.pts === newPts && t.nrr !== null && t.nrr !== undefined
  );
  const targetNRR = tied.length ? Math.max(...tied.map((t) => t.nrr)) : 0;
  return { kind: 'nrr', newPts, targetNRR };
}

/**
 * What each side needs from a league fixture to qualify, once the first
 * innings is complete. The first innings score is known, so the chasing side's
 * target and the defending side's run margin can be worked out precisely.
 */
export function computeMatchScenario({
  battingTeamId,
  bowlingTeamId,
  firstInningsRuns,
  firstInningsBalls,
  quota,
  target,
  standings,
  teamsMap,
  places
}) {
  const list = standings || [];
  const byId = {};
  list.forEach((s) => {
    byId[s.id] = s;
  });
  const batting = byId[battingTeamId];
  const bowling = byId[bowlingTeamId];
  if (!batting || !bowling) return null;

  const Q = quota > 0 ? quota : 20;
  const O1 = firstInningsBalls > 0 ? firstInningsBalls / 6 : Q;
  const placesCount = Math.max(1, places || 1);

  // Would losing this fixture still leave the team in a qualifying place?
  const survivesLoss = (team, opponent) => {
    const sim = list
      .map((t) => ({ id: t.id, pts: t.id === opponent.id ? t.pts + 2 : t.pts }))
      .sort((a, b) => b.pts - a.pts);
    const cutPts = sim[placesCount - 1] ? sim[placesCount - 1].pts : 0;
    return team.pts > cutPts;
  };

  const requirementFor = (team, opponent, isChasing) => {
    if (survivesLoss(team, opponent)) {
      return { kind: 'qualified', text: 'Already through — even a loss keeps you in the top places' };
    }

    const st = pointsStatus(team, list, placesCount);
    if (st.kind === 'through') return { kind: 'through', text: "Win and you're through" };
    if (st.kind === 'outside') {
      return { kind: 'outside', text: 'Win, and other results must go your way' };
    }

    if (isChasing) {
      // Chasing: the team scores the target in `o` overs.
      const K =
        st.targetNRR + (team.runsAgainst + firstInningsRuns) / (team.oversAgainst + O1);
      if (K <= 0) return { kind: 'through', text: "Chase it down and you're through" };
      const maxOvers = (team.runsFor + target) / K - team.oversFor;
      if (maxOvers <= 0) {
        return { kind: 'outside', text: 'Win, and other results must go your way' };
      }
      if (maxOvers >= Q) return { kind: 'through', text: "Chase it down and you're through" };
      return { kind: 'nrr', text: `Chase ${target} down inside ${oversText(maxOvers)} overs` };
    }

    // Defending: the team already posted the first-innings score and wins by M runs.
    const forRate = (team.runsFor + firstInningsRuns) / (team.oversFor + O1);
    const maxR = (forRate - st.targetNRR) * (team.oversAgainst + Q) - team.runsAgainst;
    if (maxR >= target - 1) {
      return { kind: 'through', text: 'Defend — any winning margin is enough' };
    }
    if (maxR < 0) return { kind: 'outside', text: 'Win, and other results must go your way' };
    const margin = Math.floor(target - 1 - maxR) + 1;
    return { kind: 'nrr', text: `Win by at least ${margin} runs` };
  };

  return {
    batting: {
      teamId: battingTeamId,
      requirement: requirementFor(batting, bowling, true)
    },
    bowling: {
      teamId: bowlingTeamId,
      requirement: requirementFor(bowling, batting, false)
    }
  };
}