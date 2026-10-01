import { useCallback, useMemo } from 'react';
import usePredictionData from './usePredictionData';
import { buildRatingMap, predictLive } from '@/lib/predictionEngine';

// Live win probability during scoring. `compute` accepts any innings state so
// the caller can price the situation as it will be after the ball being logged.
export default function useLivePrediction({ match, innings, allInnings = [] }) {
  const { ratings } = usePredictionData({
    team1Id: match?.team1_id,
    team2Id: match?.team2_id,
    enabled: !!match
  });

  const ratingMap = useMemo(() => buildRatingMap(ratings), [ratings]);
  const priorTeam1Pct = match?.prematch_team1_pct ?? 50;
  const parScore = (match?.overs_per_innings || 20) * 7;

  const compute = useCallback(
    (inningsState) => predictLive({ match, innings: inningsState, allInnings, ratingMap, priorTeam1Pct, parScore }),
    [match, allInnings, ratingMap, priorTeam1Pct, parScore]
  );

  const prediction = useMemo(() => compute(innings), [compute, innings]);

  return { prediction, compute };
}