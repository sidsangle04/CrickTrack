// Pure helpers for multi-innings Test cricket: innings sequence, follow-on,
// lead/trail banner, targets, and the match outcome engine. Shared by
// LiveScoring and ScoreHeader so the rules live in one place.

export function isTestMatch(match) {
  return match?.format === 'test';
}

// Max wickets in an innings. Test: players_per_team - 1. Limited: 10.
export function getMaxWickets(match) {
  if (isTestMatch(match)) {
    const ppt = match?.players_per_team || 11;
    return Math.max(1, ppt - 1);
  }
  return 10;
}

export function getFirstBattingTeamId(match) {
  return match?.batting_team_id || '';
}

export function getSecondBattingTeamId(match) {
  if (!match) return '';
  return match.team1_id === match.batting_team_id ? match.team2_id : match.team1_id;
}

// Which team bats in a given innings number (1-4) for a Test match.
// Standard: 1=A, 2=B, 3=A, 4=B.  Follow-on: 1=A, 2=B, 3=B, 4=A.
export function getBattingTeamForInnings(match, inningsNumber) {
  const A = getFirstBattingTeamId(match);
  const B = getSecondBattingTeamId(match);
  if (inningsNumber === 1) return A;
  if (inningsNumber === 2) return B;
  const followOn = match?.follow_on_enforced;
  if (inningsNumber === 3) return followOn ? B : A;
  if (inningsNumber === 4) return followOn ? A : B;
  return '';
}

export function getBowlingTeamForInnings(match, inningsNumber) {
  const bat = getBattingTeamForInnings(match, inningsNumber);
  if (!match) return '';
  return bat === match.team1_id ? match.team2_id : match.team1_id;
}

// Innings numbers (1-4) a given team bats in.
export function teamInningsNumbers(match, teamId) {
  const A = getFirstBattingTeamId(match);
  const isTeamA = teamId === A;
  if (match?.follow_on_enforced) {
    return isTeamA ? [1, 4] : [2, 3];
  }
  return isTeamA ? [1, 3] : [2, 4];
}

// Cumulative runs for a team across its innings (completed + in-progress).
export function teamTotalRuns(match, allInnings, teamId) {
  const nums = teamInningsNumbers(match, teamId);
  return allInnings
    .filter((i) => nums.includes(i.innings_number))
    .reduce((s, i) => s + (i.total_runs || 0), 0);
}

// Target for the 4th-innings chase.
export function getFourthInningsTarget(match, allInnings) {
  const A = getFirstBattingTeamId(match);
  const B = getSecondBattingTeamId(match);
  if (match?.follow_on_enforced) {
    // Innings 4 = A chasing B's total (innings 2 + 3) minus A's 1st innings.
    const bTotal = teamTotalRuns(match, allInnings, B);
    const aInn1 = allInnings.find((i) => i.innings_number === 1)?.total_runs || 0;
    return bTotal - aInn1 + 1;
  }
  // Standard: Innings 4 = B chasing A's total (innings 1 + 3) minus B's 1st innings.
  const aTotal = teamTotalRuns(match, allInnings, A);
  const bInn2 = allInnings.find((i) => i.innings_number === 2)?.total_runs || 0;
  return aTotal - bInn2 + 1;
}

function teamName(match, teamId, team1Name, team2Name) {
  if (!match) return '';
  return teamId === match.team1_id ? team1Name : team2Name;
}

// Live lead/trail banner text for the active innings. Returns null when N/A.
export function getLeadTrailBanner(match, allInnings, currentInnings, team1Name, team2Name) {
  if (!isTestMatch(match) || !currentInnings) return null;
  const innNum = currentInnings.innings_number;
  const A = getFirstBattingTeamId(match);
  const B = getSecondBattingTeamId(match);
  const cur = currentInnings.total_runs || 0;
  const nameA = teamName(match, A, team1Name, team2Name);
  const nameB = teamName(match, B, team1Name, team2Name);

  if (innNum === 1) return null; // first innings, no reference point

  if (innNum === 2) {
    const a1 = allInnings.find((i) => i.innings_number === 1)?.total_runs || 0;
    const diff = a1 - cur;
    if (diff > 0) return `${nameB} trails by ${diff} runs`;
    if (diff === 0) return 'Scores level';
    return `${nameB} leads by ${Math.abs(diff)} runs`;
  }

  if (innNum === 3) {
    const a1 = allInnings.find((i) => i.innings_number === 1)?.total_runs || 0;
    const b1 = allInnings.find((i) => i.innings_number === 2)?.total_runs || 0;
    if (match?.follow_on_enforced) {
      const trail = a1 - b1;
      const live = trail - cur;
      if (live > 0) return `${nameB} trails by ${live} runs (Follow-On)`;
      if (live === 0) return 'Scores level';
      return `${nameB} leads by ${Math.abs(live)} runs`;
    }
    const base = a1 - b1; // positive => A led after innings 2
    if (base >= 0) {
      return `${nameA} leads by ${base + cur} runs`;
    }
    const baseTrail = Math.abs(base);
    const net = cur - baseTrail;
    if (net < 0) return `${nameA} trails by ${Math.abs(net)} runs`;
    if (net === 0) return 'Scores level';
    return `${nameA} leads by ${net} runs`;
  }

  if (innNum === 4) {
    const target = getFourthInningsTarget(match, allInnings);
    const battingTeam = getBattingTeamForInnings(match, 4);
    const battingName = teamName(match, battingTeam, team1Name, team2Name);
    const needs = target - cur;
    if (needs <= 0) return `${battingName} has won!`;
    return `${battingName} needs ${needs} runs to win`;
  }

  return null;
}

export function totalBallsBowled(allInnings) {
  return allInnings.reduce((s, i) => s + (i.total_balls || 0), 0);
}

// Overs remaining under a match-wide cap (Infinity when uncapped).
export function oversRemaining(match, allInnings) {
  if (!match?.is_over_limited) return Infinity;
  const limitBalls = (match.total_match_overs || 0) * 6;
  return Math.max(0, Math.floor((limitBalls - totalBallsBowled(allInnings)) / 6));
}

// Evaluate outcome after an innings ends. Returns { winner_id, result } or null to continue.
export function evaluateTestOutcome(match, allInnings, justEndedInnings, team1Name, team2Name) {
  const innNum = justEndedInnings.innings_number;
  const A = getFirstBattingTeamId(match);
  const B = getSecondBattingTeamId(match);
  const maxWickets = getMaxWickets(match);
  const nameA = teamName(match, A, team1Name, team2Name);
  const nameB = teamName(match, B, team1Name, team2Name);

  // Follow-on innings defeat: Team B all out in innings 3 while still trailing.
  if (match?.follow_on_enforced && innNum === 3) {
    const a1 = allInnings.find((i) => i.innings_number === 1)?.total_runs || 0;
    const b1 = allInnings.find((i) => i.innings_number === 2)?.total_runs || 0;
    const b3 = justEndedInnings.total_runs || 0;
    const trail = a1 - b1;
    const liveNet = trail - b3;
    if (justEndedInnings.total_wickets >= maxWickets && liveNet > 0) {
      return { winner_id: A, result: `${nameA} won by an innings and ${liveNet} runs` };
    }
    return null; // continue to innings 4
  }

  // 4th innings complete => decide the match.
  if (innNum === 4) {
    const battingTeam = getBattingTeamForInnings(match, 4);
    const bowlingTeam = battingTeam === A ? B : A;
    const battingName = teamName(match, battingTeam, team1Name, team2Name);
    const bowlingName = teamName(match, bowlingTeam, team1Name, team2Name);
    const target = getFourthInningsTarget(match, allInnings);
    const score = justEndedInnings.total_runs || 0;
    const wickets = justEndedInnings.total_wickets || 0;

    if (score >= target) {
      const wktsLeft = Math.max(0, maxWickets - wickets);
      return { winner_id: battingTeam, result: `${battingName} won by ${wktsLeft} wickets` };
    }
    if (wickets >= maxWickets) {
      if (score === target - 1) {
        return { winner_id: '', result: 'Match Tied' };
      }
      const margin = target - 1 - score;
      return { winner_id: bowlingTeam, result: `${bowlingName} won by ${margin} runs` };
    }
    // Declared or overs expired without a result => handled by draw check.
    return null;
  }

  return null; // innings 1, 2, or non-follow-on 3 => continue
}