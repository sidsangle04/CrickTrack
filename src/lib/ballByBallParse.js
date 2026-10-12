// Parses an Excel (.xlsx/.xls) or CSV ball-by-ball scorecard into a normalized
// import plan. The ball-by-ball log is the source of truth: innings totals,
// batting/bowling figures and partnerships are derived from it, so an imported
// match stays consistent with every scorecard, report and analytics view.
//
// Tolerated input shapes:
//  - a key/value header block (Team 1 / Team 2 / Date / Venue / Overs ...) above
//    the deliveries table, or on its own "Match" sheet
//  - one deliveries table, one row per ball; column names are matched
//    case-insensitively against a wide set of aliases
//  - an optional Innings or Batting Team column to split the innings
//  - an optional "Name vs Name" title row for the team names
// Anything the file does not supply is left empty and surfaced as an issue for
// the review step, never invented.

import * as XLSX from "xlsx";
import { summarizeInnings } from "./ballByBallDerive.js";

const norm = (v) => String(v ?? "").replace(/\u00a0/g, " ").trim();
const compact = (v) => norm(v).toLowerCase().replace(/[^a-z0-9]/g, "");
const slug = (v) => norm(v).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export const SHOT_TYPES = ["drive", "cut", "pull", "hook", "sweep", "reverse_sweep", "flick", "glance", "defence", "leave", "edge", "miscue", "other"];
export const LINES = ["wide_outside_off", "outside_off", "off_stump", "middle_stump", "leg_stump", "outside_leg", "wide_outside_leg", "off", "middle", "leg"];
export const LENGTHS = ["full_toss", "yorker", "full", "good_length", "good", "back_of_length", "short", "bouncer"];
export const TURF_ZONES = ["Front Left", "Front Right", "Back Left", "Back Center", "Back Right"];

const SHOT_ALIASES = {
  defense: "defence", block: "defence", cover_drive: "drive", straight_drive: "drive",
  on_drive: "drive", off_drive: "drive", square_cut: "cut", leg_glance: "glance",
  paddle: "sweep", paddle_sweep: "sweep", sweep_shot: "sweep", lofted: "other",
};

const pickEnum = (value, list, aliases = {}) => {
  const s = slug(value);
  if (!s) return null;
  const mapped = aliases[s] || s;
  return list.includes(mapped) ? mapped : null;
};

const FIELD_ALIASES = {
  innings: ["innings", "inning", "inns", "inningno", "inningsno", "inningsnumber"],
  over: ["over", "overno", "overnumber", "overnum"],
  ball: ["ball", "ballno", "ballnumber", "ballinover", "ballofover", "delivery", "deliveryno", "deliverynumber"],
  batter: ["batter", "battername", "batsman", "batsmanname", "striker", "strikername", "facingbatter", "batsmanstriker"],
  non_striker: ["nonstriker", "nonstrikername", "nonstrikerbatsman", "batter2", "batsman2", "otherbatter", "partner", "nonstrikerbatter"],
  bowler: ["bowler", "bowlername"],
  runs_bat: ["runs", "runsbat", "batruns", "batterruns", "runsbatter", "runsbatsman", "batsmanruns"],
  extras_type: ["extrastype", "extras", "extra", "extratype", "extracode"],
  extras_runs: ["extrasruns", "extraruns", "extrarun"],
  runs_total: ["runstotal", "totalruns", "deliveryruns", "runsscored"],
  wicket_type: ["wickettype", "wicket", "dismissal", "dismissaltype", "howout", "how", "outtype"],
  player_out: ["playerout", "batterout", "dismissed", "dismissedbatter", "batterdismissed", "outbatter"],
  fielder: ["fielder", "fieldername", "catcher", "assist", "fielders"],
  shot_type: ["shot", "shottype", "shotname", "stroke"],
  line: ["line", "linebowled"],
  length: ["length", "lengthbowled"],
  variation: ["variation", "deliveryvariation", "ballvariation"],
  zone: ["zone", "shotzone", "wagonwheelzone", "wagonwheel", "region", "shotregion", "scoringzone"],
  shot_x: ["shotx", "shotcoordinatex"],
  shot_y: ["shoty", "shotcoordinatey"],
  pitch_x: ["pitchx", "pitchlandingx"],
  pitch_y: ["pitchy", "pitchlandingy"],
  turf_zone: ["turfzone", "groundzone"],
  shot_distance: ["shotdistance", "distance"],
  batting_team: ["battingteam", "batteam"],
  bowling_team: ["bowlingteam", "bowlteam"],
  catch_drop: ["catchdrop", "isdrop", "dropped", "drop"],
  dropped_by: ["droppedby"],
};

const HEADER_FIELD = {};
Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
  aliases.forEach((a) => {
    if (!HEADER_FIELD[a]) HEADER_FIELD[a] = field;
  });
});

const INFO_FIELDS = {
  team1: ["team1", "team1name", "hometeam", "hometeamname", "teamone", "team1short"],
  team2: ["team2", "team2name", "awayteam", "awayteamname", "teamtwo", "team2short"],
  date: ["date", "matchdate", "gamedate", "playedon"],
  venue: ["venue", "ground", "groundname", "place", "location"],
  overs: ["oversperinnings", "matchovers", "totalovers", "oversperteam", "oversperinning"],
  ballType: ["balltype"],
  format: ["format", "matchformat"],
  toss: ["toss", "tossresult"],
  result: ["result", "matchresult", "outcome"],
  competition: ["competition", "league", "tournament", "division"],
};

const INFO_KEY_FIELD = {};
Object.entries(INFO_FIELDS).forEach(([field, aliases]) => {
  aliases.forEach((a) => {
    if (!INFO_KEY_FIELD[a]) INFO_KEY_FIELD[a] = field;
  });
});

const EXTRA_MAP = {
  wd: "wide", wide: "wide", w: "wide", wides: "wide", wideball: "wide",
  nb: "no_ball", noball: "no_ball", no: "no_ball", noballs: "no_ball",
  b: "bye", bye: "bye", byes: "bye",
  lb: "leg_bye", legbye: "leg_bye", legbyes: "leg_bye",
  pen: "penalty", penalty: "penalty",
};

const WICKET_MAP = {
  b: "bowled", bowled: "bowled",
  c: "caught", ct: "caught", caught: "caught",
  lbw: "lbw",
  ro: "run_out", runout: "run_out", run: "run_out",
  st: "stumped", stumped: "stumped",
  hw: "hit_wicket", hitwicket: "hit_wicket",
  rh: "retired_hurt", retiredhurt: "retired_hurt",
  retiredout: "retired_out", retired: "retired_out",
  obstructing: "obstructing_field", obstructingthefield: "obstructing_field",
  timedout: "timed_out", handledball: "handled_ball",
};

const NOT_OUT_WORDS = ["", "notout", "no", "n", "na", "-", "didnotbat", "dnb", "absent", "retirednotout"];

function parseHowOut(text) {
  const t = norm(text).toLowerCase();
  if (!t || NOT_OUT_WORDS.includes(compact(t))) return { wicket_type: null, fielder: "" };
  const caught = t.match(/^(?:c|ct|caught)\s+(.+?)(?:\s+b\s+.+)?$/);
  if (caught) return { wicket_type: "caught", fielder: norm(caught[1]) };
  const stumped = t.match(/^(?:st|stumped)\s+(.+?)(?:\s+b\s+.+)?$/);
  if (stumped) return { wicket_type: "stumped", fielder: norm(stumped[1]) };
  if (/^lbw\b/.test(t)) return { wicket_type: "lbw", fielder: "" };
  if (/^(?:run ?out|ro)\b/.test(t)) {
    return { wicket_type: "run_out", fielder: norm(t.replace(/^(?:run ?out|ro)\s*/, "").replace(/[()]/g, "").replace(/\s+b\s+.*$/, "")) };
  }
  if (/^(?:b\b|bowled)/.test(t)) return { wicket_type: "bowled", fielder: "" };
  if (/hit ?wicket/.test(t)) return { wicket_type: "hit_wicket", fielder: "" };
  if (/retired ?hurt/.test(t)) return { wicket_type: "retired_hurt", fielder: "" };
  if (/retired/.test(t)) return { wicket_type: "retired_out", fielder: "" };
  return { wicket_type: "caught", fielder: norm(text) };
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => norm(c) !== ""));
}

async function readWorkbook(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "csv" || ext === "txt") {
    const text = await file.text();
    return [{ name: "CSV", rows: parseCSV(text) }];
  }
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  return wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, defval: "", blankrows: false }),
  }));
}

function findHeaderRow(rows) {
  const limit = Math.min(rows.length, 60);
  for (let i = 0; i < limit; i++) {
    const fields = new Set(rows[i].map((c) => HEADER_FIELD[compact(c)]).filter(Boolean));
    const hasPeople = fields.has("batter") || fields.has("bowler");
    const hasOutcome = fields.has("runs_bat") || fields.has("extras_type") || fields.has("runs_total");
    const hasOrder = fields.has("ball") || fields.has("over");
    if (hasPeople && hasOutcome && (hasOrder || fields.size >= 3)) return i;
  }
  return -1;
}

function collectInfo(sheets) {
  const info = {};
  const readPairs = (rows) => {
    rows.forEach((row) => {
      const k = compact(row[0]);
      const v = norm(row[1]);
      if (!k || !v) return;
      const field = INFO_KEY_FIELD[k];
      if (field && info[field] === undefined) info[field] = v;
    });
  };
  sheets.forEach((sheet) => {
    const h = findHeaderRow(sheet.rows);
    if (h < 0) readPairs(sheet.rows);
    else readPairs(sheet.rows.slice(0, h));
  });
  if (!info.team1 || !info.team2) {
    const title = sheets
      .flatMap((s) => s.rows.flat())
      .map((c) => norm(c))
      .find((c) => /\s+(?:vs|v)\s+/i.test(c) && c.length < 90);
    if (title) {
      const parts = title.split(/\s+(?:vs|v)\s+/i).map((t) => t.trim());
      if (!info.team1 && parts[0]) info.team1 = parts[0];
      if (!info.team2 && parts[1]) info.team2 = parts[1];
    }
  }
  return info;
}

function resolveBattingTeam(raw, team1Name, team2Name) {
  const c = compact(raw);
  if (!c) return null;
  const c1 = compact(team1Name);
  const c2 = compact(team2Name);
  if (c1 && (c === c1 || c.includes(c1) || c1.includes(c))) return "team1";
  if (c2 && (c === c2 || c.includes(c2) || c2.includes(c))) return "team2";
  return null;
}

function normalizeDelivery(row, cols) {
  const raw = (f) => (cols[f] === undefined ? "" : norm(row[cols[f]]));
  const has = (f) => cols[f] !== undefined;
  const num = (f) => {
    const t = raw(f).replace(/[^0-9.\-]/g, "");
    if (t === "" || t === "-" || t === ".") return null;
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : null;
  };

  const striker = raw("batter");
  const bowler = raw("bowler");
  if (!striker || !bowler) return null;

  const extrasRaw = raw("extras_type");
  const extrasIsNumeric = extrasRaw !== "" && !isNaN(Number(extrasRaw));
  const extrasType = extrasIsNumeric ? null : EXTRA_MAP[compact(extrasRaw)] || null;
  let extrasRuns = num("extras_runs");
  if (extrasIsNumeric && extrasRuns === null) extrasRuns = Number(extrasRaw);

  let runsBat = num("runs_bat") ?? 0;

  const is_wide = extrasType === "wide";
  const is_no_ball = extrasType === "no_ball";
  const is_bye = extrasType === "bye";
  const is_leg_bye = extrasType === "leg_bye";
  const is_penalty = extrasType === "penalty";

  // Files that carry a single "Runs" column plus an extras type put the extra's
  // runs in that column: move them across rather than counting them off the bat.
  if (extrasType && extrasRuns === null) {
    extrasRuns = runsBat || (is_wide || is_no_ball ? 1 : 0);
    runsBat = 0;
  }
  // The same column value repeated in both places (a wide entered as Runs 1 and
  // Extra Runs 1) is one delivery, not two.
  if ((is_wide || is_no_ball) && extrasRuns !== null && runsBat > 0 && runsBat === extrasRuns) {
    runsBat = 0;
  }

  const wide_runs = is_wide ? extrasRuns || 1 : 0;
  const no_ball_runs = is_no_ball ? extrasRuns || 1 : 0;
  const bye_runs = is_bye ? extrasRuns || 0 : 0;
  const leg_bye_runs = is_leg_bye ? extrasRuns || 0 : 0;
  const penalty_runs = is_penalty ? extrasRuns || 0 : 0;
  const is_legal_delivery = !is_wide && !is_no_ball;
  const runs_total =
    num("runs_total") ?? runsBat + wide_runs + no_ball_runs + bye_runs + leg_bye_runs + penalty_runs;

  const wicketRaw = raw("wicket_type");
  let wicket_type = WICKET_MAP[compact(wicketRaw)] ?? null;
  let fielder = raw("fielder");
  if (wicket_type === null && wicketRaw) {
    const parsed = parseHowOut(wicketRaw);
    wicket_type = parsed.wicket_type;
    if (!fielder) fielder = parsed.fielder;
  }

  const zoneRaw = raw("zone");
  const zoneNum = parseFloat(zoneRaw);
  const shotRegion = zoneRaw && !Number.isFinite(zoneNum) ? zoneRaw : null;

  return {
    striker,
    non_striker: raw("non_striker"),
    bowler,
    runs_bat: runsBat,
    runs_total,
    is_wide,
    wide_runs,
    is_no_ball,
    no_ball_runs,
    is_bye,
    bye_runs,
    is_leg_bye,
    leg_bye_runs,
    penalty_runs,
    is_legal_delivery,
    is_dot_ball: is_legal_delivery && runs_total === 0,
    is_boundary: runsBat === 4,
    is_six: runsBat === 6,
    is_wicket: !!wicket_type,
    wicket_type: wicket_type || undefined,
    player_out: wicket_type ? raw("player_out") || striker : undefined,
    fielder: wicket_type && fielder ? fielder : undefined,
    shot_type: pickEnum(raw("shot_type"), SHOT_TYPES, SHOT_ALIASES) || undefined,
    line: pickEnum(raw("line"), LINES) || undefined,
    length: pickEnum(raw("length"), LENGTHS) || undefined,
    delivery_variation: raw("variation") || undefined,
    wagon_wheel_zone: Number.isFinite(zoneNum) && zoneNum >= 1 && zoneNum <= 8 ? zoneNum : undefined,
    shot_region: shotRegion || undefined,
    shot_x: num("shot_x") ?? undefined,
    shot_y: num("shot_y") ?? undefined,
    pitch_x: num("pitch_x") ?? undefined,
    pitch_y: num("pitch_y") ?? undefined,
    turf_zone: TURF_ZONES.find((z) => compact(z) === compact(raw("turf_zone"))) || undefined,
    shot_distance: ["inner", "mid", "boundary"].includes(slug(raw("shot_distance"))) ? slug(raw("shot_distance")) : undefined,
    is_catch_drop: /^(y|yes|true|1)$/i.test(raw("catch_drop")) || undefined,
    dropped_by: raw("dropped_by") || undefined,
    _has: has,
  };
}

export async function buildImportPlan(file) {
  const sheets = await readWorkbook(file);

  let table = null;
  sheets.forEach((sheet) => {
    const headerIndex = findHeaderRow(sheet.rows);
    if (headerIndex < 0) return;
    const dataRows = sheet.rows.slice(headerIndex + 1).filter((r) => r.some((c) => norm(c) !== ""));
    if (!table || dataRows.length > table.dataRows.length) {
      table = { sheet, headerIndex, dataRows };
    }
  });
  if (!table) {
    throw new Error(
      "No ball-by-ball table found. The file needs a header row with Batter and Bowler plus Runs (or Extras) columns."
    );
  }

  const info = collectInfo(sheets);
  const header = table.sheet.rows[table.headerIndex];
  const cols = {};
  header.forEach((cell, idx) => {
    const field = HEADER_FIELD[compact(cell)];
    if (field && cols[field] === undefined) cols[field] = idx;
  });

  const issues = [];
  const team1Name = info.team1 || "";
  const team2Name = info.team2 || "";
  if (!team1Name || !team2Name) {
    issues.push({ level: "warning", message: "Team names were not found in the file. Enter both team names below." });
  }

  // Group rows into innings, then order each innings by the file's own over/ball.
  const groups = new Map();
  const groupOrder = [];
  table.dataRows.forEach((row) => {
    const inningsRaw = cols.innings !== undefined ? norm(row[cols.innings]) : "";
    const batRaw = cols.batting_team !== undefined ? norm(row[cols.batting_team]) : "";
    const key = inningsRaw || batRaw || "1";
    if (!groups.has(key)) {
      groups.set(key, { key, batRaw, rows: [] });
      groupOrder.push(key);
    }
    groups.get(key).rows.push(row);
  });

  const sortRows = (rows) => {
    if (cols.over === undefined && cols.ball === undefined) return rows;
    return [...rows].sort((a, b) => {
      const oa = parseFloat(norm(a[cols.over] ?? 0)) || 0;
      const ob = parseFloat(norm(b[cols.over] ?? 0)) || 0;
      if (oa !== ob) return oa - ob;
      const ba = parseFloat(norm(a[cols.ball] ?? 0)) || 0;
      const bb = parseFloat(norm(b[cols.ball] ?? 0)) || 0;
      return ba - bb;
    });
  };

  const innings = [];
  let skipped = 0;
  let untagged = 0;
  let derivedNonStriker = 0;

  groupOrder.forEach((key, groupIdx) => {
    const group = groups.get(key);
    let overNumber = 0;
    let ballInOver = 0;
    let deliveryNumber = 0;
    let lastNonStriker = "";
    const recentStrikers = [];
    const deliveries = [];

    // Over and ball numbering is read from the file when present (scorers number
    // the over as displayed, so a wide keeps its own ball slot), with the base
    // detected so 0-based and 1-based files both land on CrickTrack's numbering.
    const groupOvers = cols.over === undefined ? [] : group.rows.map((r) => parseFloat(norm(r[cols.over]))).filter(Number.isFinite);
    const groupBalls = cols.ball === undefined ? [] : group.rows.map((r) => parseFloat(norm(r[cols.ball]))).filter(Number.isFinite);
    const overBase = groupOvers.length ? Math.min(...groupOvers) : 0;
    const ballShift = groupBalls.length && Math.min(...groupBalls) === 0 ? 1 : 0;

    sortRows(group.rows).forEach((row) => {
      const d = normalizeDelivery(row, cols);
      if (!d) { skipped += 1; return; }

      // Files that only name the facing batter: the partner is the other batter
      // still at the crease, taken from the most recent strikers.
      if (!d.non_striker) {
        d.non_striker =
          lastNonStriker && lastNonStriker !== d.striker
            ? lastNonStriker
            : recentStrikers.find((n) => n !== d.striker) || "";
      }
      if (d.striker && recentStrikers[0] !== d.striker) {
        const at = recentStrikers.indexOf(d.striker);
        if (at >= 0) recentStrikers.splice(at, 1);
        recentStrikers.unshift(d.striker);
        if (recentStrikers.length > 4) recentStrikers.pop();
      }
      if (d.non_striker) lastNonStriker = d.non_striker;
      if (!d.non_striker) { d.non_striker = d.striker; derivedNonStriker += 1; }
      if (!d.shot_type && !d.line && !d.length) untagged += 1;

      const fileOver = cols.over === undefined ? NaN : parseFloat(norm(row[cols.over]));
      const fileBall = cols.ball === undefined ? NaN : parseFloat(norm(row[cols.ball]));

      deliveryNumber += 1;
      if (d.is_legal_delivery) ballInOver += 1;
      if (Number.isFinite(fileOver)) overNumber = Math.max(0, fileOver - overBase);
      if (Number.isFinite(fileBall)) ballInOver = Math.max(0, fileBall) + ballShift;
      d.over_number = overNumber;
      d.ball_in_over = ballInOver;
      d.delivery_number = deliveryNumber;
      deliveries.push(d);
      if (d.is_legal_delivery && ballInOver >= 6) { overNumber += 1; ballInOver = 0; }
    });

    if (deliveries.length === 0) return;
    const battingTeam =
      resolveBattingTeam(group.batRaw, team1Name, team2Name) || (groupIdx % 2 === 0 ? "team1" : "team2");
    innings.push({ number: innings.length + 1, battingTeam, sourceLabel: group.batRaw || "", deliveries });
  });

  if (innings.length === 0) {
    throw new Error(
      "The ball-by-ball table has no usable rows. Check that the Batter and Bowler columns are filled in on every row."
    );
  }
  if (skipped > 0) {
    issues.push({
      level: "warning",
      message: `${skipped} row${skipped === 1 ? "" : "s"} skipped — the batter or bowler name was missing.`,
    });
  }
  if (derivedNonStriker > 0) {
    issues.push({
      level: "warning",
      message: `${derivedNonStriker} deliveries had no non-striker in the file; the facing batter was used so the totals stay correct.`,
    });
  }
  if (untagged > 0) {
    issues.push({
      level: "warning",
      message: `${untagged} deliveries have no shot/line/length tags — those analytics stay empty for this match.`,
    });
  }

  const summaries = innings.map((i) => summarizeInnings(i.deliveries));
  const derivedOvers = Math.max(...summaries.map((s) => Math.ceil(s.balls / 6)), 1);
  const oversPerInnings = info.overs ? parseFloat(info.overs) || derivedOvers : derivedOvers;

  if (!info.venue) issues.push({ level: "warning", message: "No venue in the file — you can add one below." });

  return {
    match: {
      team1Name,
      team2Name,
      date: info.date || new Date().toISOString().split("T")[0],
      venue: info.venue || "",
      oversPerInnings,
      ballType: ["leather", "tennis", "tape"].includes(slug(info.ballType)) ? slug(info.ballType) : "leather",
      format: "limited",
      toss: info.toss || "",
      result: info.result || "",
      competition: info.competition || "",
    },
    innings,
    summaries,
    issues,
    fileName: file.name,
    sourceSheet: table.sheet.name,
  };
}

export const TEMPLATE_CSV = [
  "Team 1,India",
  "Team 2,Australia",
  "Date,2026-05-12",
  "Venue,Wankhede Stadium",
  "Overs per innings,20",
  "Ball type,leather",
  "",
  "Innings,Over,Ball,Batter,Non Striker,Bowler,Runs,Extras Type,Extra Runs,Wicket Type,Player Out,Fielder,Shot,Line,Length,Zone",
  "1,1,1,Rohit Sharma,Virat Kohli,Pat Cummins,1,,,,,,drive,off_stump,good_length,cover",
  "1,1,2,Virat Kohli,Rohit Sharma,Pat Cummins,4,,,,,,cut,outside_off,short,point",
  "1,1,3,Virat Kohli,Rohit Sharma,Pat Cummins,0,,,,,,leave,outside_off,good_length,",
  "1,1,4,Virat Kohli,Rohit Sharma,Pat Cummins,0,,,,,,defence,off_stump,good_length,",
  "1,1,5,Virat Kohli,Rohit Sharma,Pat Cummins,0,wide,1,,,,,outside_off,full,",
  "1,1,6,Virat Kohli,Rohit Sharma,Pat Cummins,0,,,caught,,Steve Smith,,outside_off,good_length,point",
  "1,2,1,Rohit Sharma,Shubman Gill,Josh Hazlewood,0,,,,,,defence,off_stump,good_length,",
  "2,1,1,David Warner,Travis Head,Jasprit Bumrah,1,,,,,,glance,leg_stump,full,short_fine_leg",
].join("\n");