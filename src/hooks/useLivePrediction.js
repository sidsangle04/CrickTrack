import { useCallback, useMemo } from 'react';
import usePredictionData from './usePredictionData';
import { buildRatingMap, predictLive } from '@/lib/predictionEngine';

// Live win probability during scoring. `compute` accepts any innings state so
// the caller can price the situation as it will be after the ball being logged.
export default function useLivePrediction({ match, innings, allInnings = [], venuePar = null }) {
  const { ratings } = usePredictionData({
    team1Id: match?.team1_id,
    team2Id: match?.team2_id,
    enabled: !!match
  });

  const ratingMap = useMemo(() => buildRatingMap(ratings), [ratings]);
  const priorTeam1Pct = match?.prematch_team1_pct ?? 50;
  // Par comes from the venue's average first-innings score when one exists;
  // otherwise the engine falls back to a format baseline and shows no par.
  const parScore = venuePar?.average ?? null;

  const compute = useCallback(
    (inningsState) => predictLive({ match, innings: inningsState, allInnings, ratingMap, priorTeam1Pct, parScore }),
    [match, allInnings, ratingMap, priorTeam1Pct, parScore]
  );

  const prediction = useMemo(() => compute(innings), [compute, innings]);

  return { prediction, compute };
}