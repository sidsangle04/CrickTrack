import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { computeStandings } from '@/lib/bracket';
import { computeMatchScenario } from '@/lib/qualification';

/**
 * Loads the tournament league table for the match being scored (when it is
 * linked to a league fixture) and works out what each side needs to qualify
 * once the first innings is complete.
 */
export default function useTournamentScenario({ match, innings, allInnings, teamsMap }) {
  const tmId = match?.tournament_match_id;

  const { data } = useQuery({
    queryKey: ['tournament-scenario', tmId],
    enabled: !!tmId,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const tm = (await base44.entities.TournamentMatch.filter({ id: tmId }))[0];
      if (!tm) return null;
      const tournament = (await base44.entities.Tournament.filter({ id: tm.tournament_id }))[0];
      if (!tournament || tournament.format === 'knockout') return null;

      const leagueMatches = await base44.entities.TournamentMatch.filter({
        tournament_id: tm.tournament_id,
        stage: 'league'
      });
      const matchIds = leagueMatches.map((m) => m.match_id).filter(Boolean);
      const linkedMatches = matchIds.length
        ? await base44.entities.Match.filter({ id: { $in: matchIds } })
        : [];
      const matchesMap = linkedMatches.reduce((a, m) => ({ ...a, [m.id]: m }), {});
      const inningsList = matchIds.length
        ? await base44.entities.Innings.filter({ match_id: { $in: matchIds } })
        : [];
      const inningsByMatch = inningsList.reduce((a, inn) => {
        (a[inn.match_id] = a[inn.match_id] || []).push(inn);
        return a;
      }, {});

      return { tournament, standings: computeStandings(leagueMatches, matchesMap, inningsByMatch) };
    }
  });

  if (!data || !match || !innings) return null;
  if (match.format === 'test' || innings.is_super_over) return null;

  const first = (allInnings || []).find((i) => i.innings_number === 1 && !i.is_super_over);
  if (!first || first.status !== 'completed') return null;

  const places = data.tournament.format === 'league_playoffs'
    ? 3
    : data.tournament.knockout_teams || 4;

  return computeMatchScenario({
    battingTeamId: innings.batting_team_id,
    bowlingTeamId: innings.bowling_team_id,
    firstInningsRuns: first.total_runs || 0,
    firstInningsBalls: first.total_balls || 0,
    quota: match.overs_per_innings || 20,
    target: innings.target || (first.total_runs || 0) + 1,
    standings: data.standings,
    teamsMap,
    places
  });
}