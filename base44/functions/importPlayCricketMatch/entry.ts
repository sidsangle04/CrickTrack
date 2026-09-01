import { secrets } from "base44:runtime";

// Backend proxy/parser for Play-Cricket URL import. The public results page is
// behind a browser-challenge bot wall, so we use the official Play-Cricket club
// API (https://www.play-cricket.com/api/v2/match_detail) which requires a club
// API token stored as the PLAY_CRICKET_API_KEY secret. This function only
// fetches + parses the API response into the same normalized summary shape the
// frontend parsers produce; all entity writes happen client-side via the
// shared writeImportedMatch writer.

const mapHowOut = (howOut, bowler) => {
  const h = (howOut || "").toLowerCase();
  if (h === "not out") return { dismissal: "not out", dismissal_type: null, is_out: false };
  if (h === "did not bat" || h === "") return { dismissal: "not out", dismissal_type: null, is_out: false };
  if (h === "bowled" || h === "b") return { dismissal: bowler ? `b ${bowler}` : "bowled", dismissal_type: "bowled", is_out: true };
  if (h.startsWith("lbw")) return { dismissal: bowler ? `lbw b ${bowler}` : howOut, dismissal_type: "lbw", is_out: true };
  if (h.startsWith("ct") || h.startsWith("caught")) return { dismissal: bowler ? `${howOut} b ${bowler}` : howOut, dismissal_type: "caught", is_out: true };
  if (h.startsWith("st") || h.startsWith("stumped")) return { dismissal: bowler ? `${howOut} b ${bowler}` : howOut, dismissal_type: "stumped", is_out: true };
  if (h.startsWith("run out")) return { dismissal: howOut, dismissal_type: "run_out", is_out: true };
  if (h.startsWith("hit wicket")) return { dismissal: bowler ? `hit wicket b ${bowler}` : howOut, dismissal_type: "hit_wicket", is_out: true };
  if (h.startsWith("retired hurt")) return { dismissal: howOut, dismissal_type: "retired_hurt", is_out: false };
  if (h.startsWith("retired")) return { dismissal: howOut, dismissal_type: "retired_out", is_out: true };
  return { dismissal: bowler ? `${howOut} b ${bowler}` : howOut, dismissal_type: "caught", is_out: true };
};

const num = (v) => (v === undefined || v === null || v === "" ? 0 : Number(v) || 0);

function parseApiMatch(md) {
  const innings = md.innings || [];
  const inn0 = innings[0] || {};
  const team1Name = inn0.batting_team_name || md.team1_name || md.home_team_name || "Team 1";
  const team2Name = inn0.bowling_team_name || md.team2_name || md.away_team_name || "Team 2";
  const matchDate = (md.match_date || new Date().toISOString().split("T")[0]).split("T")[0];
  const ground = md.ground_name || md.venue || "Unknown";
  const toss = md.toss_won_by_team_name ? `${md.toss_won_by_team_name} won toss` : "";
  const result = md.result_description || md.match_result || "";
  const oversPerInnings = num(md.overs_per_innings || md.match_overs) || 50;

  const parseBatters = (arr) => (arr || []).map((b) => {
    const howOut = b.how_out || b.howout || "not out";
    const bowler = b.bowler_name || "";
    const m = mapHowOut(howOut, bowler);
    return {
      name: b.player_name || b.name || "Unknown",
      runs: num(b.runs),
      balls: num(b.balls || b.balls_faced),
      fours: num(b.fours || b["4s"]),
      sixes: num(b.sixes || b["6s"]),
      howOut,
      bowler,
      dismissal: m.dismissal,
      dismissal_type: m.dismissal_type,
      is_out: m.is_out,
    };
  });

  const parseBowlers = (arr) => (arr || []).map((b) => ({
    name: b.player_name || b.name || "Unknown",
    overs: String(b.overs || "0"),
    maidens: num(b.maidens),
    runs: num(b.runs || b.runs_conceded),
    wickets: num(b.wickets),
    wides: num(b.wides),
    no_balls: num(b.no_balls || b.no_ball),
  }));

  const parseInn = (inn) => {
    const extras = inn.extras || {};
    return {
      runs: num(inn.runs || inn.total_runs),
      wickets: num(inn.wickets || inn.total_wickets),
      overs: num(inn.overs),
      extras: {
        byes: num(extras.byes),
        leg_byes: num(extras.leg_byes),
        wides: num(extras.wides),
        no_balls: num(extras.no_balls || extras.no_ball),
      },
      batters: parseBatters(inn.batting || inn.batting_scorecard),
      bowlers: parseBowlers(inn.bowling || inn.bowling_scorecard),
    };
  };

  const inn1 = innings.find((i) => String(i.batting_team_name) === team1Name) || innings[0] || { batting: [], bowling: [], extras: {} };
  const inn2 = innings.find((i) => String(i.batting_team_name) === team2Name) || innings[1] || { batting: [], bowling: [], extras: {} };

  return {
    matchDate,
    ground,
    toss,
    result,
    team1Name,
    team2Name,
    oversPerInnings,
    innings1: parseInn(inn1),
    innings2: parseInn(inn2),
  };
}

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = body.url || "";
    const matchIdMatch = url.match(/(\d+)/);
    if (!matchIdMatch) {
      return Response.json({ error: "INVALID_URL", message: "No match ID found in that URL." }, { status: 400 });
    }

    const apiKey = secrets.get("PLAY_CRICKET_API_KEY");
    if (!apiKey) {
      return Response.json({
        error: "NO_API_KEY",
        message:
          "Play-Cricket API key not set. Add the PLAY_CRICKET_API_KEY secret (from your club's Play-Cricket admin → Site Config → API) to enable URL import. You can still import via CSV/HTML file upload in the meantime.",
      }, { status: 400 });
    }

    const apiRes = await fetch(
      `https://www.play-cricket.com/api/v2/match_detail?match_id=${matchIdMatch[1]}&api_token=${apiKey}`
    );
    if (!apiRes.ok) {
      return Response.json({ error: "API_ERROR", message: `Play-Cricket API returned ${apiRes.status}. Check the URL and API key.` }, { status: 502 });
    }
    const json = await apiRes.json();
    const md = (json.match_detail && json.match_detail[0]) || json.match_detail || json;
    const data = parseApiMatch(md);

    return Response.json({ ok: true, data });
  } catch (error) {
    return Response.json({ error: error.message || "Import failed" }, { status: 500 });
  }
}