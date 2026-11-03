// Normalizes the scorecard read out of a Play-Cricket PDF into the import plan.
// A printed scorecard carries innings totals and per-player batting and bowling
// figures but no ball-by-ball log, so nothing here invents deliveries.

import { toIsoDate } from "./localDate.js";

// "34.1 overs" means 34 completed overs and 1 legal ball — 205 balls, not 204.6.
export const oversToBalls = (overs) => {
  const value =
    typeof overs === "number" ? overs : parseFloat(String(overs ?? "").replace(/[^0-9.]/g, ""));
  if (!isFinite(value) || value <= 0) return 0;
  const whole = Math.floor(value);
  const partial = Math.round((value - whole) * 10);
  return whole * 6 + partial;
};

export const ballsToOvers = (balls) =>
  `${Math.floor((balls || 0) / 6)}.${(balls || 0) % 6}`;

const num = (value) => {
  if (typeof value === "number") return isFinite(value) ? value : 0;
  const n = parseInt(String(value ?? "").replace(/[^0-9-]/g, ""), 10);
  return isFinite(n) ? n : 0;
};

// Scorecards decorate names with captain/keeper markers that must not become
// part of the player's name.
const cleanName = (value) =>
  String(value ?? "")
    .replace(/[*†‡]+/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*\((?:c|wk|wkt|keeper|capt|captain)\)\s*$/i, "")
    .trim();

const parseDate = (value) => {
  const s = String(value ?? "").trim();
  if (!s) return toIsoDate(new Date());
  const iso = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  // Printed English scorecards are day-first (12/05/2026 = 12 May 2026).
  const dmy = s.match(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${year}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }
  const parsed = new Date(s.replace(/(\d+)(st|nd|rd|th)/i, "$1"));
  return isNaN(parsed) ? toIsoDate(new Date()) : toIsoDate(parsed);
};

// Turns a scorecard's "how out" text into the model's dismissal fields, pulling
// the fielder out of forms like "ct Jones b Smith" or "run out (Wilson)".
export const classifyDismissal = (howOut, bowler, fielder) => {
  const raw = String(howOut ?? "").trim();
  const h = raw.toLowerCase().replace(/\.+$/, "");
  const bowlerName = cleanName(bowler);
  const fielderName = cleanName(fielder);

  const none = { is_out: false, dismissal_type: null, bowler: "", fielder: "" };
  const out = (type, { bowler: by, fielder: fld } = {}) => ({
    is_out: true,
    dismissal_type: type,
    bowler: by !== undefined ? by : bowlerName,
    fielder: fld !== undefined ? fld : "",
  });

  if (!h || h === "not out") return none;
  if (h.includes("did not bat") || h === "dnb" || h === "absent") return none;
  if (h.startsWith("retired hurt") || h.startsWith("retired not out")) return out("retired_hurt");
  if (h.startsWith("retired")) return out("retired_out");

  if (h === "ro" || h.startsWith("run out")) {
    const parens = raw.match(/\(([^)]+)\)/)?.[1];
    return out("run_out", { bowler: "", fielder: fielderName || cleanName(parens) });
  }
  // "ct & b Smith" is a catch and bowled: the bowler takes the catch.
  if (/^(ct|c)\s*&\s*b\b/.test(h)) return out("caught", { fielder: fielderName || bowlerName });
  if (h === "st" || h === "stumped" || h.startsWith("st ")) {
    const inline = cleanName(raw.replace(/^stumped\s*/i, "").replace(/^st\s+/i, "").split(/\s+b\s+/i)[0]);
    return out("stumped", { fielder: fielderName || inline });
  }
  if (h === "ct" || h === "c" || h === "caught" || /^(ct|caught|c)\s/.test(h)) {
    const inline = cleanName(raw.replace(/^(ct|caught|c)\s*/i, "").split(/\s+b\s+/i)[0]);
    return out("caught", { fielder: fielderName || inline });
  }
  if (h.startsWith("hit wicket")) return out("hit_wicket");
  if (h === "lbw" || h.startsWith("lbw")) return out("lbw");
  if (h === "b" || h === "bowled") return out("bowled");
  if (h.startsWith("b ")) return out("bowled", { bowler: bowlerName || cleanName(raw.slice(2)) });

  return out("caught");
};

const normalizeBatter = (raw) => {
  const playerName = cleanName(raw?.name);
  const howOut = String(raw?.how_out ?? "").trim();
  const how = howOut.toLowerCase();
  const didNotBat = how.includes("did not bat") || how === "dnb" || how === "absent";
  const dismissal = classifyDismissal(howOut, raw?.bowler, raw?.fielder);
  const isOut = !didNotBat && dismissal.is_out;

  return {
    name: playerName,
    runs: num(raw?.runs),
    balls: num(raw?.balls),
    fours: num(raw?.fours),
    sixes: num(raw?.sixes),
    how_out: howOut,
    is_out: isOut,
    dismissal_type: isOut ? dismissal.dismissal_type : null,
    bowler: dismissal.bowler,
    fielder: dismissal.fielder,
    status: didNotBat ? "did_not_bat" : isOut ? "out" : "not_out",
  };
};

const normalizeBowler = (raw) => {
  const overs = String(raw?.overs ?? "").trim();
  const balls = oversToBalls(overs);
  const runs = num(raw?.runs);
  return {
    name: cleanName(raw?.name),
    overs,
    balls,
    maidens: num(raw?.maidens),
    runs,
    wickets: num(raw?.wickets),
    wides: num(raw?.wides),
    no_balls: num(raw?.no_balls),
    economy: balls > 0 ? (runs / balls) * 6 : 0,
  };
};

export function normalizePdfScorecard(raw) {
  const issues = [];
  const source = Array.isArray(raw?.innings) ? raw.innings.filter(Boolean) : [];
  if (source.length === 0) {
    throw new Error(
      "No innings were found in that PDF. It may be a scanned image or a scorecard layout the reader does not recognise."
    );
  }

  // The innings say who actually batted first; the header carries the fuller
  // club name ("East Molesey CC - 1st XI"), so prefer that form when it matches.
  const fullerName = (short, candidates) => {
    const s = cleanName(short).toLowerCase();
    if (!s) return "";
    const hit = candidates.find((c) => {
      const t = cleanName(c).toLowerCase();
      return t && (t.includes(s) || s.includes(t));
    });
    return cleanName(hit) || cleanName(short);
  };
  const headerNames = [cleanName(raw?.team1_name), cleanName(raw?.team2_name)];
  const battingNames = source.map((r) => cleanName(r?.batting_team));
  const team1Name = fullerName(battingNames[0], headerNames) || headerNames[0] || "Team 1";
  const team2Name = fullerName(battingNames[1], headerNames) || headerNames[1] || "Team 2";

  if (!cleanName(raw?.team1_name) && !cleanName(raw?.team2_name)) {
    issues.push({ level: "warning", message: "Team names were not found in the PDF. Enter both below." });
  }
  if (!cleanName(raw?.venue)) {
    issues.push({ level: "warning", message: "No venue in the PDF — you can add one below." });
  }

  // Innings are listed in the order they were played, so the first bats first.
  const sideFor = (index) => (index === 0 ? "team1" : "team2");

  const innings = source.map((r, index) => {
    const batters = (Array.isArray(r?.batters) ? r.batters : [])
      .map(normalizeBatter)
      .filter((b) => b.name && !/^(extras|total|fall)/i.test(b.name));
    const bowlers = (Array.isArray(r?.bowlers) ? r.bowlers : [])
      .map(normalizeBowler)
      .filter((b) => b.name && !/^(extras|total|fall)/i.test(b.name));

    const extras = {
      byes: num(r?.extras_byes),
      leg_byes: num(r?.extras_leg_byes),
      wides: num(r?.extras_wides),
      no_balls: num(r?.extras_no_balls),
    };
    const extrasTotal =
      num(r?.extras_total) || extras.byes + extras.leg_byes + extras.wides + extras.no_balls;

    const batRuns = batters.reduce((sum, b) => sum + b.runs, 0);
    const outs = batters.filter((b) => b.is_out).length;
    const runs = num(r?.runs) || batRuns + extrasTotal;
    const wickets = num(r?.wickets) || outs;
    const balls = oversToBalls(r?.overs) || bowlers.reduce((sum, b) => sum + b.balls, 0);

    return {
      number: index + 1,
      battingTeam: sideFor(index),
      runs,
      wickets,
      balls,
      overs: ballsToOvers(balls),
      extras,
      extrasTotal,
      batters,
      bowlers,
    };
  });

  if (innings.some((inn) => inn.batters.length === 0)) {
    issues.push({
      level: "warning",
      message: "One innings has no batting rows — the PDF layout may have been read only in part.",
    });
  }
  if (innings.some((inn) => inn.bowlers.length === 0)) {
    issues.push({
      level: "warning",
      message: "One innings has no bowling rows — those bowling figures will be missing.",
    });
  }

  const maxOvers = Math.max(...innings.map((inn) => Math.ceil(inn.balls / 6)), 0);
  const oversPerInnings = num(raw?.overs_per_innings) || maxOvers || 50;

  const resultText = String(raw?.result ?? "").trim();
  const matchDate = parseDate(raw?.date);

  return {
    match: {
      team1Name,
      team2Name,
      date: matchDate,
      venue: cleanName(raw?.venue),
      oversPerInnings,
      result: resultText,
      toss: String(raw?.toss ?? "").trim(),
    },
    innings,
    hasBallByBall: false,
    issues,
  };
}

// Contract handed to the PDF reader. Descriptions carry the instructions, since
// the extraction call takes a schema and no prompt.
export const PDF_EXTRACT_SCHEMA = {
  type: "object",
  description: "A cricket scorecard printed from Play-Cricket.",
  properties: {
    team1_name: { type: "string", description: "Name of the team that batted first." },
    team2_name: { type: "string", description: "Name of the team that batted second." },
    date: { type: "string", description: "Match date exactly as printed, e.g. 12/05/2026." },
    venue: { type: "string", description: "Ground or venue name." },
    competition: { type: "string", description: "Competition or league name if printed." },
    result: { type: "string", description: "The result line, e.g. 'EMCC won by 4 wickets'." },
    toss: { type: "string", description: "Toss line if printed." },
    overs_per_innings: { type: "number", description: "Overs allotted per innings if stated." },
    has_ball_by_ball: {
      type: "boolean",
      description:
        "True only if the document also contains ball-by-ball commentary pages for the innings, false if it is a scorecard on its own.",
    },
    innings: {
      type: "array",
      description: "One entry per innings, in the order they were played.",
      items: {
        type: "object",
        properties: {
          batting_team: { type: "string", description: "Team that batted in this innings." },
          runs: { type: "number", description: "Total runs for the innings." },
          wickets: { type: "number", description: "Wickets lost." },
          overs: {
            type: "string",
            description:
              "Overs bowled exactly as printed, e.g. '34.1' meaning 34 overs and 1 ball. Never convert this to a decimal number.",
          },
          extras_total: { type: "number", description: "Total extras." },
          extras_byes: { type: "number" },
          extras_leg_byes: { type: "number" },
          extras_wides: { type: "number" },
          extras_no_balls: { type: "number" },
          batters: {
            type: "array",
            description: "Every batter listed in the batting table, in batting order.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                how_out: {
                  type: "string",
                  description: "Dismissal text exactly as printed, e.g. 'ct Jones b Smith', 'b Smith', 'lbw b Smith', 'run out (Wilson)', 'not out', 'did not bat'.",
                },
                bowler: { type: "string", description: "Bowler name from the separate bowler column, if the table has one." },
                fielder: { type: "string", description: "Fielder or keeper named in the dismissal, if the table has one." },
                runs: { type: "number" },
                balls: { type: "number" },
                fours: { type: "number" },
                sixes: { type: "number" },
              },
              required: ["name"],
            },
          },
          bowlers: {
            type: "array",
            description: "Every bowler listed in the bowling table, in bowling order.",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                overs: { type: "string", description: "Overs bowled exactly as printed, e.g. '9.3'." },
                maidens: { type: "number" },
                runs: { type: "number" },
                wickets: { type: "number" },
                wides: { type: "number" },
                no_balls: { type: "number" },
              },
              required: ["name"],
            },
          },
        },
        required: ["batters", "bowlers"],
      },
    },
  },
  required: ["innings"],
};