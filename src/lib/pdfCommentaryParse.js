// Reads the "39.7 D Butler to A Prakash: 2 runs" style of Play-Cricket ball-by-ball
// commentary. Outcomes are words ("No run", "2 runs", "1 w", "1 nb", "4 b",
// "1 lb", "S Pattuvathi dismissed"); dismissal details come from the scorecard.

import { resolvePdfName } from "./pdfDeliveryParse.js";

const text = (v) => String(v ?? "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const LINE = /^(\d+)\.(\d+)\s+(.*?)\s+to\s*(.*?):\s*(.*)$/;

export const isWordCommentary = (lines) =>
  lines.filter((l) => LINE.test(text(l))).length >= Math.max(3, lines.length / 3);

const parseLine = (line) => {
  const m = text(line).match(LINE);
  if (!m) return null;
  return { over: Number(m[1]), label: Number(m[2]), bowler: m[3], batter: m[4], outcome: m[5] };
};

const parseOutcome = (outcome) => {
  const o = {
    runs_bat: 0, wide_runs: 0, no_ball_runs: 0, bye_runs: 0, leg_bye_runs: 0,
    is_wide: false, is_no_ball: false, is_bye: false, is_leg_bye: false, is_wicket: false,
  };
  if (/dismissed\s*$/i.test(outcome)) {
    o.is_wicket = true;
    return o;
  }
  outcome.split(",").map(text).forEach((part) => {
    const m = part.match(/^(\d+)\s*(runs?|w|nb|b|lb)$/i);
    if (!m) return;
    const n = Number(m[1]);
    const kind = m[2].toLowerCase();
    if (kind === "w") { o.is_wide = true; o.wide_runs += n; }
    else if (kind === "nb") { o.is_no_ball = true; o.no_ball_runs += n; }
    else if (kind === "b") { o.is_bye = true; o.bye_runs += n; }
    else if (kind === "lb") { o.is_leg_bye = true; o.leg_bye_runs += n; }
    else o.runs_bat += n;
  });
  return o;
};

export function buildWordDeliveries(lines, battingRoster, fieldingRoster, batters, label, issues) {
  const rows = lines.map(parseLine).filter(Boolean).reverse(); // printed newest first

  // The commentary leaves one batter's name blank; the scorecard says who never
  // appears by name, so a single missing batter can be filled in with certainty.
  const named = new Set(rows.map((r) => resolvePdfName(r.batter, battingRoster)).filter(Boolean));
  const missing = batters.filter((b) => b.balls > 0 && !named.has(b.name));
  const blankName = missing.length === 1 ? missing[0].name : "";

  const resolved = rows.map((r) => ({
    ...r,
    striker: r.batter ? resolvePdfName(r.batter, battingRoster) : blankName,
    bowlerName: resolvePdfName(r.bowler, fieldingRoster),
  }));

  const atCrease = [];
  const used = new Set();
  const nextIn = () => battingRoster.find((n) => !used.has(n)) || "";
  const deliveries = [];
  let currentOver = null;
  let legalInOver = 0;
  let skipped = 0;

  resolved.forEach((row) => {
    if (!row.striker || !row.bowlerName) { skipped += 1; return; }
    const striker = row.striker;
    if (!atCrease.includes(striker)) {
      if (atCrease.length >= 2) atCrease.shift();
      atCrease.push(striker);
      used.add(striker);
    }
    if (atCrease.length < 2) {
      const incoming = nextIn();
      if (incoming) { atCrease.push(incoming); used.add(incoming); }
    }
    const nonStriker = atCrease.find((n) => n !== striker) || "";

    const o = parseOutcome(row.outcome);
    if (row.over !== currentOver) { currentOver = row.over; legalInOver = 0; }
    const runsTotal = o.runs_bat + o.wide_runs + o.no_ball_runs + o.bye_runs + o.leg_bye_runs;
    // A seventh "ball" with nothing scored is an untracked extra, not a legal ball.
    const extraSeventh = !o.is_wide && !o.is_no_ball && legalInOver >= 6 && runsTotal === 0 && !o.is_wicket;
    const isLegal = !o.is_wide && !o.is_no_ball && !extraSeventh;
    if (isLegal) legalInOver += 1;

    let wicket = null;
    if (o.is_wicket) {
      const rec = batters.find((b) => b.name === striker);
      wicket = { type: rec?.dismissal_type || "caught", fielder: resolvePdfName(rec?.fielder || "", fieldingRoster) };
    }

    deliveries.push({
      over_number: row.over,
      ball_in_over: isLegal ? legalInOver : Math.max(legalInOver, 1),
      delivery_number: deliveries.length + 1,
      striker, non_striker: nonStriker, bowler: row.bowlerName,
      runs_bat: o.runs_bat, runs_total: runsTotal,
      is_wide: o.is_wide, wide_runs: o.wide_runs,
      is_no_ball: o.is_no_ball, no_ball_runs: o.no_ball_runs,
      is_bye: o.is_bye, bye_runs: o.bye_runs,
      is_leg_bye: o.is_leg_bye, leg_bye_runs: o.leg_bye_runs,
      penalty_runs: 0,
      is_legal_delivery: isLegal,
      is_boundary: o.runs_bat === 4 || o.runs_bat === 6,
      is_six: o.runs_bat === 6,
      is_dot_ball: isLegal && runsTotal === 0 && !o.is_wicket,
      is_wicket: o.is_wicket,
      wicket_type: wicket ? wicket.type : undefined,
      player_out: wicket ? striker : undefined,
      fielder: wicket && wicket.fielder ? wicket.fielder : undefined,
    });

    if (o.is_wicket) {
      const at = atCrease.indexOf(striker);
      if (at >= 0) atCrease.splice(at, 1);
    }
  });

  // The blank-named batter's own dismissal is also missing from the commentary:
  // it is his last delivery, and the scorecard confirms he was out.
  const blankRec = batters.find((b) => b.name === blankName);
  const hasWicket = deliveries.some((d) => d.is_wicket && d.player_out === blankName);
  if (blankName && blankRec?.is_out && !hasWicket) {
    const idx = deliveries.map((d) => d.striker).lastIndexOf(blankName);
    const d = deliveries[idx];
    if (d && d.runs_total === 0 && d.is_legal_delivery) {
      d.is_wicket = true;
      d.is_dot_ball = false;
      d.wicket_type = blankRec.dismissal_type || "caught";
      d.player_out = blankName;
      const f = resolvePdfName(blankRec.fielder || "", fieldingRoster);
      if (f) d.fielder = f;
    }
  }

  if (skipped) {
    issues.push({ level: "warning", message: `${label}: ${skipped} commentary line(s) could not be matched to a player and were skipped.` });
  }
  return deliveries;
}