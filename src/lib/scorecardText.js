export const getOversDisplay = (balls = 0) => `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

export const getDismissalText = (batter, playersMap = {}) => {
  if (batter.status === 'did_not_bat') return 'did not bat';
  if (batter.status === 'yet_to_bat') return 'yet to bat';
  if (!batter.is_out) return 'not out';

  const bowler = playersMap[batter.dismissed_by_bowler_id]?.name || 'Unknown';
  const fielder = playersMap[batter.dismissed_by_fielder_id]?.name || 'Unknown';

  switch (batter.dismissal_type) {
    case 'bowled':
      return `b ${bowler}`;
    case 'caught':
      return `c ${fielder} b ${bowler}`;
    case 'lbw':
      return `lbw b ${bowler}`;
    case 'stumped':
      return `st ${fielder} b ${bowler}`;
    case 'run_out':
      return `run out (${fielder})`;
    case 'hit_wicket':
      return `hit wicket b ${bowler}`;
    case 'retired_hurt':
      return 'retired hurt';
    case 'retired_out':
      return 'retired out';
    default:
      return 'out';
  }
};

export const buildShareUrl = (matchId) =>
  `${window.location.origin}/SharedScorecard?matchId=${matchId}`;