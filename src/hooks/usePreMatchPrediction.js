import { useMemo } from 'react';
import usePredictionData from './usePredictionData';
import { buildRatingMap, predictPreMatch } from '@/lib/predictionEngine';

// Pre-match win chances for the two teams picked in Match Setup.
export default function usePreMatchPrediction({ team1Id, team2Id, team1XI = [], team2XI = [] }) {
  const { matches, ratings, h2h1, h2h2, isLoading } = usePredictionData({
    team1Id,
    team2Id,
    enabled: !!(team1Id && team2Id)
  });

  const prediction = useMemo(() => {
    if (!team1Id || !team2Id) return null;
    if (!team1XI.length && !team2XI.length) return null;
    return predictPreMatch({
      team1Id,
      team2Id,
      team1XI,
      team2XI,
      ratings: buildRatingMap(ratings),
      h2h1: buildRatingMap(h2h1),
      h2h2: buildRatingMap(h2h2),
      matches
    });
  }, [team1Id, team2Id, team1XI, team2XI, ratings, h2h1, h2h2, matches]);

  return { prediction, isLoading };
}