// Helpers shared by the public (signed-out) share endpoints.
// Both the scorecard and the tournament statistics page read the same records
// and must hide the same account-identifying fields.

export const toList = (res: any) => (Array.isArray(res) ? res : (res?.items ?? []));

// Drop the scoring account's identity from anything a public page receives.
export const strip = (rows: any[]) =>
  rows.map(({ created_by, created_by_id, is_sample, ...rest }: any) => rest);

export const slimMatch = (m: any) => ({
  id: m.id,
  date: m.date,
  venue: m.venue,
  result: m.result,
  status: m.status,
  winner_id: m.winner_id,
  team1_id: m.team1_id,
  team2_id: m.team2_id,
  tournament_match_id: m.tournament_match_id,
  overs_per_innings: m.overs_per_innings,
  format: m.format,
  ball_type: m.ball_type,
});