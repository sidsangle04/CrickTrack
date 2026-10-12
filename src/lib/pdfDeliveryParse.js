// Folds the ball-by-ball commentary pages of a full Play-Cricket PDF into a
// scorecard import plan.
//
// The PDF reader transcribes the printed commentary verbatim; everything below
// is derived from that text. The commentary abbreviates names ("N Stevens",
// "McKernan") and counts wides and no balls in the over.ball label, so the
// scorecard roster is the dictionary names resolve against and the legal ball
// number is counted here rather than read off the label.
//
// Nothing is invented. If the reconstructed log does not add up to the printed
// scorecard totals, the plan keeps the aggregate-only path.

import { summarizeInnings } from "./ballByBallDerive.js";
import { classifyDismissal } from "./pdfScorecardNormalize.js";

const text = (value) => String(value ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const surnameOf = (name) => {
  const parts = text(name).split(" ").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "";
};

// "N Stevens" -> Nick Stevens, "McKernan" -> Tim McKernan. Returns "" when the
// commentary name cannot be pinned to exactly one player on the roster.
export const resolvePdfName = (short, roster) => {
  const s = text(short);
  if (!s) return "";
  const exact = roster.find((n) => n.toLowerCase() === s.toLowerCase());
  if (exact) return exact;

  const parts = s.split(" ");
  const surname = parts[parts.length - 1].toLowerCase();
  const initial = parts.length > 1 ? parts[0].toLowerCase()[0] : "";

  const sameSurname = roster.filter((n) => surnameOf(n).toLowerCase() === surname);
  if (sameSurname.length === 1) return sameSurname[0];
  if (initial) {
    const byInitial = sameSurname.find((n) => n[0].toLowerCase() === initial);
    if (byInitial) return byInitial;
  }
  const endsWith = roster.filter((n) => n.toLowerCase().endsWith(surname));
  if (endsWith.length === 1) return endsWith[0];
  return "";
};

// Commentary runs codes: • (or 0) for a dot, 1-6 off the bat, "1lb" leg bye,
// "1b" bye, "w" wide, "1nb" no ball, uppercase "W" a wicket. "1nb+ 1" is a no
// ball the batter also scored off, the runs before the + coming off the bat.
export const parseOutcome = (code) => {
  const t = text(code);
  const out = {
    runs_bat: 0,
    wide_runs: 0,
    no_ball_runs: 0,
    bye_runs: 0,
    leg_bye_runs: 0,
    penalty_runs: 0,
    is_wide: false,
    is_no_ball: false,
    is_bye: false,
    is_leg_bye: false,
    is_wicket: false,
  };
  if (!t || t === "•" || t === "0") return out;

  // Uppercase W is a wicket; lowercase w is a wide.
  if (t.includes("W")) {
    out.is_wicket = true;
    return out;
  }

  const lower = t.toLowerCase();
  const scoredOffNoBall = lower.match(/^(\d*)nb\+\s*(\d+)$/);
  if (scoredOffNoBall) {
    out.is_no_ball = true;
    out.runs_bat = Number(scoredOffNoBall[1] || 0);
    out.no_ball_runs = Number(scoredOffNoBall[2] || 1);
    return out;
  }
  if (lower.includes("nb")) {
    out.is_no_ball = true;
    out.no_ball_runs = parseInt(lower, 10) || 1;
    return out;
  }
  if (/^\d*w$/.test(lower)) {
    out.is_wide = true;
    out.wide_runs = parseInt(lower, 10) || 1;
    return out;
  }
  const legBye = lower.match(/^(\d+)lb$/);
  if (legBye) {
    out.is_leg_bye = true;
    out.leg_bye_runs = Number(legBye[1]);
    return out;
  }
  const bye = lower.match(/^(\d+)b$/);
  if (bye) {
    out.is_bye = true;
    out.bye_runs = Number(bye[1]);
    return out;
  }
  if (/^\d+$/.test(lower)) {
    out.runs_bat = Number(lower);
    return out;
  }
  return out;
};

const DISMISSAL_KEYWORD = /\b(ct\s*&\s*b|c\s*&\s*b|caught|ct|stumped|st|run out|lbw|hit wicket|retired|b)\b/i;

// "OUT Nick Stevens c & b Tim McKernan 52 (48)" -> who went, and how.
const parseWicket = (description, battingRoster, fieldingRoster, bowlerName) => {
  const raw = text(description);
  if (!/^OUT\b/i.test(raw)) return null;

  const body = raw.replace(/^OUT\s+/i, "").replace(/\s+\d+\s*\(\d+\)\s*$/, "").trim();
  let name = battingRoster
    .filter((n) => body.toLowerCase().startsWith(n.toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];

  let howOut = "";
  if (name) {
    howOut = body.slice(name.length).trim();
  } else {
    // The roster did not match, so split at the first dismissal keyword.
    const at = body.search(DISMISSAL_KEYWORD);
    if (at > 0) {
      name = body.slice(0, at).trim();
      howOut = body.slice(at).trim();
    } else {
      howOut = body;
    }
  }

  const info = classifyDismissal(howOut, bowlerName, "");
  const fielder = info.fielder ? resolvePdfName(info.fielder, fieldingRoster) || info.fielder : "";
  return { playerOut: name || "", type: info.is_out ? info.dismissal_type : "caught", fielder };
};

// One commentary line: "49.6 W McKernan to N Stevens, OUT Nick Stevens c & b ..."
const parseLine = (line) => {
  const m = text(line).match(/^(\d+\.\d+)\s+(.*?)\s+to\s+(.*?),\s*(.*)$/);
  if (!m) return null;
  const [over, ball] = m[1].split(".").map(Number);
  // The runs code is usually one token, but "1nb+ 1" carries its own space.
  const head = m[2].split(" ").filter(Boolean);
  if (!head.length) return null;
  const spacedCode = head[0].endsWith("+") && head.length > 1;
  return {
    over,
    printedBall: ball,
    code: spacedCode ? `${head[0]} ${head[1]}` : head[0],
    bowler: spacedCode ? head.slice(2).join(" ") : head.slice(1).join(" "),
    batter: m[3],
    description: m[4],
  };
};

const buildDeliveries = (lines, battingRoster, fieldingRoster, label, issues) => {
  const rows = lines
    .map(parseLine)
    .filter(Boolean)
    .reverse(); // the PDF prints the innings newest ball first

  const atCrease = [];
  const used = new Set();
  const nextIn = () => battingRoster.find((n) => !used.has(n)) || "";

  const deliveries = [];
  let currentOver = null;
  let legalInOver = 0;

  rows.forEach((row) => {
    const striker = resolvePdfName(row.batter, battingRoster);
    const bowler = resolvePdfName(row.bowler, fieldingRoster);
    if (!striker || !bowler) {
      issues.push({
        level: "warning",
        message: `${label}: "${!striker ? row.batter : row.bowler}" does not match a player on the scorecard, so that delivery was skipped.`,
      });
      return;
    }

    if (!atCrease.includes(striker)) {
      if (atCrease.length >= 2) atCrease.shift();
      atCrease.push(striker);
      used.add(striker);
    }
    if (atCrease.length < 2) {
      const incoming = nextIn();
      if (incoming) {
        atCrease.push(incoming);
        used.add(incoming);
      }
    }
    const nonStriker = atCrease.find((n) => n !== striker) || "";

    const outcome = parseOutcome(row.code);
    if (row.over !== currentOver) {
      currentOver = row.over;
      legalInOver = 0;
    }
    const isLegal = !outcome.is_wide && !outcome.is_no_ball;
    const ballInOver = isLegal ? legalInOver + 1 : legalInOver;
    if (isLegal) legalInOver += 1;

    const runsTotal =
      outcome.runs_bat +
      outcome.wide_runs +
      outcome.no_ball_runs +
      outcome.bye_runs +
      outcome.leg_bye_runs +
      outcome.penalty_runs;

    const wicket = outcome.is_wicket ? parseWicket(row.description, battingRoster, fieldingRoster, bowler) : null;
    const playerOut = wicket ? wicket.playerOut || striker : "";

    deliveries.push({
      over_number: row.over,
      ball_in_over: ballInOver,
      delivery_number: deliveries.length + 1,
      striker,
      non_striker: nonStriker,
      bowler,
      runs_bat: outcome.runs_bat,
      runs_total: runsTotal,
      is_wide: outcome.is_wide,
      wide_runs: outcome.wide_runs,
      is_no_ball: outcome.is_no_ball,
      no_ball_runs: outcome.no_ball_runs,
      is_bye: outcome.is_bye,
      bye_runs: outcome.bye_runs,
      is_leg_bye: outcome.is_leg_bye,
      leg_bye_runs: outcome.leg_bye_runs,
      penalty_runs: outcome.penalty_runs,
      is_legal_delivery: isLegal,
      is_boundary: outcome.runs_bat === 4 || outcome.runs_bat === 6,
      is_six: outcome.runs_bat === 6,
      is_dot_ball: isLegal && runsTotal === 0,
      is_wicket: outcome.is_wicket,
      wicket_type: wicket ? wicket.type : undefined,
      player_out: playerOut || undefined,
      fielder: wicket && wicket.fielder ? wicket.fielder : undefined,
    });

    if (outcome.is_wicket) {
      const at = atCrease.indexOf(playerOut);
      if (at >= 0) atCrease.splice(at, 1);
    }
  });

  return deliveries;
};

// Contract handed to the PDF reader for the commentary pages.
export const pdfDeliverySchema = (which) => ({
  type: "object",
  description: `The ball-by-ball commentary for the ${which === 1 ? "FIRST" : "SECOND"} innings only: the innings of the team that batted ${which === 1 ? "first" : "second"}.`,
  properties: {
    batting_team: {
      type: "string",
      description: "The team batting in this innings, exactly as the commentary section heading prints it.",
    },
    lines: {
      type: "array",
      description:
        "EVERY commentary line of this innings, in the order printed in the document, transcribed verbatim character for character, including the over.ball label, the runs code, the bowler and the batter. Do not skip, merge, summarise, reorder or reformat any line, and leave out the over-summary lines.",
      items: { type: "string" },
    },
  },
  required: ["batting_team", "lines"],
});

// Merges the commentary back into the scorecard plan, and only keeps it when
// every innings adds up to the printed totals.
export function attachPdfDeliveries(plan, rawInnings) {
  const issues = [...(plan.issues || [])];
  const rosters = plan.innings.map((inn) => inn.batters.map((b) => b.name).filter(Boolean));
  const side = (inn) => (inn.battingTeam === "team1" ? plan.match.team1Name : plan.match.team2Name);

  const withDeliveries = plan.innings.map((inn, index) => {
    const lines = Array.isArray(rawInnings[index]?.lines) ? rawInnings[index].lines : [];
    // The fielding side is the other innings' batting line-up, keepers included.
    const fieldingRoster = rosters[index === 0 ? 1 : 0] || [];
    const deliveries = lines.length
      ? buildDeliveries(lines, rosters[index] || [], fieldingRoster, side(inn), issues)
      : [];
    return { ...inn, deliveries };
  });

  if (withDeliveries.every((inn) => inn.deliveries.length === 0)) {
    issues.push({
      level: "warning",
      message:
        "The ball-by-ball commentary could not be read from this PDF. The scorecard figures are imported as normal.",
    });
    return { ...plan, hasBallByBall: false, issues };
  }

  // The printed scorecard is the reference: a log that does not add up to it is
  // not trustworthy, so it is dropped rather than imported alongside it.
  const mismatched = [];
  withDeliveries.forEach((inn, index) => {
    const derived = summarizeInnings(inn.deliveries);
    const ballDiff = derived.balls - plan.innings[index].balls;
    const runDiff = derived.runs - plan.innings[index].runs;
    const wicketDiff = derived.wickets - plan.innings[index].wickets;
    if (runDiff !== 0 || wicketDiff !== 0 || ballDiff !== 0) {
      mismatched.push(
        `${side(inn)}: commentary has ${derived.runs}/${derived.wickets} off ${derived.balls} balls, scorecard says ${plan.innings[index].runs}/${plan.innings[index].wickets} off ${plan.innings[index].balls}`
      );
    }
  });

  if (mismatched.length) {
    issues.push({
      level: "warning",
      message: `The ball-by-ball commentary did not add up to the printed scorecard (${mismatched.join("; ")}), so the delivery log was left out and the scorecard figures are imported instead.`,
    });
    return { ...plan, hasBallByBall: false, issues };
  }

  return { ...plan, hasBallByBall: true, innings: withDeliveries, issues };
}