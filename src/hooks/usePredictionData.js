import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useGroundShape } from '@/lib/GroundShapeContext';

const CACHE_TIME = 5 * 60 * 1000;
const EMPTY = { bat: [], bowl: [] };

// Player figures from the completed matches of the active mode, plus
// head-to-head figures for each side against tonight's opposition.
async function fetchFigures(matchIds) {
  if (!matchIds.length) return EMPTY;
  const [bat, bowl] = await Promise.all([
    base44.entities.BatterInnings.aggregate({
      query: { match_id: { $in: matchIds } },
      groupBy: 'player_id',
      sum: ['runs', 'balls_faced', 'fours', 'sixes']
    }),
    base44.entities.BowlerInnings.aggregate({
      query: { match_id: { $in: matchIds } },
      groupBy: 'player_id',
      sum: ['balls', 'runs_conceded', 'wickets', 'dots']
    })
  ]);
  return { bat: bat.rows || [], bowl: bowl.rows || [] };
}

export default function usePredictionData({ team1Id, team2Id, enabled = true }) {
  const { mode } = useGroundShape();

  const matchesQuery = useQuery({
    queryKey: ['prediction-matches', mode],
    queryFn: () => base44.entities.Match.filter({ ground_mode: mode, status: 'completed' }, '-date', 100),
    enabled,
    staleTime: CACHE_TIME
  });

  const matches = matchesQuery.data || [];
  const allIds = matches.map((m) => m.id);
  // Matches the opposition played — team 1's players' record against them, and vice versa.
  const vsTeam2 = matches.filter((m) => m.team1_id === team2Id || m.team2_id === team2Id).map((m) => m.id);
  const vsTeam1 = matches.filter((m) => m.team1_id === team1Id || m.team2_id === team1Id).map((m) => m.id);

  const careerQuery = useQuery({
    queryKey: ['prediction-career', mode, allIds.length],
    queryFn: () => fetchFigures(allIds),
    enabled: enabled && allIds.length > 0,
    staleTime: CACHE_TIME
  });

  const h2h1Query = useQuery({
    queryKey: ['prediction-h2h', team2Id, vsTeam2.length],
    queryFn: () => fetchFigures(vsTeam2),
    enabled: enabled && !!team2Id && vsTeam2.length > 0,
    staleTime: CACHE_TIME
  });

  const h2h2Query = useQuery({
    queryKey: ['prediction-h2h', team1Id, vsTeam1.length],
    queryFn: () => fetchFigures(vsTeam1),
    enabled: enabled && !!team1Id && vsTeam1.length > 0,
    staleTime: CACHE_TIME
  });

  return {
    matches,
    ratings: careerQuery.data || EMPTY,
    h2h1: h2h1Query.data || EMPTY,
    h2h2: h2h2Query.data || EMPTY,
    isLoading: matchesQuery.isLoading
  };
}