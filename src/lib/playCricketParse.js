// Parsers for Play-Cricket scorecard exports → normalized summary object.
// CSV: the "Export to CSV" output from a Play-Cricket results page.
// HTML: the printable results page saved as .html (tolerant of layout variants).
// The same normalized shape is produced by the importPlayCricketMatch backend
// function (which parses the Play-Cricket API response), so both the URL and
// file import paths feed one shared entity-writer.

import { toIsoDate, todayIso } from "./localDate.js";

const parseScore = (s) => {
  const runs = parseInt(s) || 0;
  const wicketMatch = s.match(/(\d+)-(\d+)/);
  const wickets = wicketMatch ? parseInt(wicketMatch[2]) : 10;
  const oversMatch = s.match(/\(([0-9.]+) overs\)/);
  const overs = oversMatch ? parseFloat(oversMatch[1]) : 0;
  const allOut = /all out/i.test(s);
  return { runs, wickets: allOut ? 10 : wickets, overs };
};

const mapHowOut = (howOut, bowler) => {
  const h = (howOut || "").toLowerCase();
  if (h === "not out") return { dismissal: "not out", dismissal_type: null, is_out: false };
  if (h === "did not bat") return { dismissal: "did not bat", dismissal_type: null, is_out: false };
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

const parseExtrasLine = (line) => {
  if (!line) return { byes: 0, leg_byes: 0, wides: 0, no_balls: 0 };
  const b = parseInt(line.match(/b \((\d+)\)/)?.[1] || "0");
  const lb = parseInt(line.match(/lb \((\d+)\)/)?.[1] || "0");
  const w = parseInt(line.match(/w \((\d+)\)/)?.[1] || "0");
  const nb = parseInt(line.match(/nb \((\d+)\)/)?.[1] || "0");
  return { byes: b, leg_byes: lb, wides: w, no_balls: nb };
};

export function parseCSVText(text) {
  const lines = text.split("\n").map((l) => l.trim());

  const matchTitle = lines.find((l) => l.includes(" Vs ") || l.includes(" vs "))?.split(",")[1]?.trim() || "";
  const groundLine = lines.find((l) => l.startsWith("Ground,"));
  const ground = groundLine ? groundLine.split(",")[1]?.trim() : "Unknown";
  const dateLine = lines.find((l) => l.includes("Date,,"));
  const dateRaw = dateLine ? dateLine.split(",,")[1]?.trim() : "";
  let matchDate = todayIso();
  if (dateRaw) {
    const cleaned = dateRaw.replace(/(\d+)(st|nd|rd|th)/, "$1");
    const parsed = new Date(cleaned);
    if (!isNaN(parsed)) matchDate = toIsoDate(parsed);
  }
  const tossLine = lines.find((l) => l.startsWith("Toss,"));
  const toss = tossLine ? tossLine.split(",").slice(1).join(",").trim() : "";
  const resultLine = lines.find((l) => l.startsWith("Result :"));
  const result = resultLine ? resultLine.replace("Result :", "").trim() : "";

  const scoreLine = lines.find((l) => l.startsWith("Score,"));
  let score1 = "";
  let score2 = "";
  if (scoreLine) {
    const parts = scoreLine.split(",");
    score1 = parts[1]?.trim() || "";
    score2 = parts[2]?.trim() || "";
  }

  const teams = matchTitle.split(" Vs ").map((t) => t.trim());
  const team1Name = teams[0] || "Team 1";
  const team2Name = teams[1] || "Team 2";

  const parseBatting = (startIdx) => {
    const batters = [];
    let i = startIdx;
    while (i < lines.length) {
      const line = lines[i];
      if (!line || line.startsWith("Extras") || line.startsWith("Fall of") || line.startsWith("Bowling") || line.startsWith("*")) break;
      const parts = line.split(",");
      const name = parts[0]?.trim();
      if (!name || name === "Name") { i++; continue; }
      const howOut = parts[1]?.trim() || "not out";
      const bowler = parts[2]?.trim() || "";
      let runsIdx = 4;
      for (let k = 3; k <= 5; k++) {
        if (parts[k]?.trim() !== "" && !isNaN(parseInt(parts[k]))) { runsIdx = k; break; }
      }
      const runs = parseInt(parts[runsIdx]) || 0;
      const fours = parseInt(parts[runsIdx + 1]) || 0;
      const sixes = parseInt(parts[runsIdx + 2]) || 0;
      const balls = parseInt(parts[runsIdx + 3]) || 0;
      const m = mapHowOut(howOut, bowler);
      batters.push({ name, runs, balls, fours, sixes, howOut, bowler, dismissal: m.dismissal, dismissal_type: m.dismissal_type, is_out: m.is_out });
      i++;
    }
    return batters;
  };

  const parseBowling = (startIdx) => {
    const bowlers = [];
    let i = startIdx;
    while (i < lines.length) {
      const line = lines[i];
      if (!line || line.startsWith("Total") || line.startsWith("Fielding") || line.startsWith("https")) break;
      const parts = line.split(",");
      const name = parts[0]?.trim();
      if (!name || name === "Bowler") { i++; continue; }
      const overs = parts[2]?.trim() || "0";
      const maidens = parseInt(parts[3]) || 0;
      const runs = parseInt(parts[4]) || 0;
      const wickets = parseInt(parts[5]) || 0;
      const wides = parseInt(parts[6]) || 0;
      const no_balls = parseInt(parts[7]) || 0;
      bowlers.push({ name, overs, maidens, runs, wickets, wides, no_balls });
      i++;
    }
    return bowlers;
  };

  const batting1Idx = lines.findIndex((l) => l === "Name,How Out,Bowler,,Runs,4s,6s,Balls,");
  const bowling1Idx = lines.findIndex((l, i) => i > batting1Idx && l === "Bowler,,Overs,Maidens,Runs,Wickets,Wides,No Balls,");
  const batting2Idx = lines.findIndex((l, i) => i > bowling1Idx && l === "Name,How Out,Bowler,,Runs,4s,6s,Balls,");
  const bowling2Idx = lines.findIndex((l, i) => i > batting2Idx && l === "Bowler,,Overs,Maidens,Runs,Wickets,Wides,No Balls,");

  const batters1 = batting1Idx >= 0 ? parseBatting(batting1Idx + 1) : [];
  const bowlers1 = bowling1Idx >= 0 ? parseBowling(bowling1Idx + 1) : [];
  const batters2 = batting2Idx >= 0 ? parseBatting(batting2Idx + 1) : [];
  const bowlers2 = bowling2Idx >= 0 ? parseBowling(bowling2Idx + 1) : [];

  const extras1Line = batting1Idx >= 0 ? lines.slice(batting1Idx, bowling1Idx >= 0 ? bowling1Idx : lines.length).find((l) => l.startsWith("Extras,")) : "";
  const extras2Line = batting2Idx >= 0 ? lines.slice(batting2Idx, bowling2Idx >= 0 ? bowling2Idx : lines.length).find((l) => l.startsWith("Extras,")) : "";

  const s1 = parseScore(score1);
  const s2 = parseScore(score2);
  const oversPerInnings = Math.max(Math.ceil(s1.overs) || 0, Math.ceil(s2.overs) || 0) || 50;

  return {
    matchDate, ground, toss, result, team1Name, team2Name, oversPerInnings,
    innings1: { ...s1, batters: batters1, bowlers: bowlers1, extras: parseExtrasLine(extras1Line) },
    innings2: { ...s2, batters: batters2, bowlers: bowlers2, extras: parseExtrasLine(extras2Line) },
  };
}

export function parseHTMLScorecard(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(doc.querySelectorAll("table"));
  if (tables.length === 0) throw new Error("No tables found in HTML — try the CSV export from Play-Cricket instead.");

  const battingTables = [];
  const bowlingTables = [];
  tables.forEach((t) => {
    const headerText = Array.from(t.querySelectorAll("th, td")).slice(0, 12).map((c) => c.textContent.trim()).join(" ").toLowerCase();
    if (headerText.includes("how out") || headerText.includes("howout")) battingTables.push(t);
    else if (headerText.includes("maidens") && headerText.includes("overs")) bowlingTables.push(t);
  });

  if (battingTables.length < 2) throw new Error("Could not find two batting tables in the HTML — try the CSV export instead.");

  const titleCandidates = [];
  doc.querySelectorAll("h1,h2,h3,h4,title,strong,b").forEach((el) => {
    const txt = el.textContent.trim();
    if (/\s+(?:vs|v)\s+/i.test(txt) && txt.length < 90) titleCandidates.push(txt);
  });
  const matchTitle = titleCandidates[0] || doc.title || "";
  const teams = matchTitle.split(/\s+(?:vs|v)\s+/i).map((s) => s.trim());
  const team1Name = teams[0] || "Team 1";
  const team2Name = teams[1] || "Team 2";

  const ground = doc.body?.textContent.match(/Ground\s*[:\-]?\s*([A-Za-z0-9 ,.'-]+)/i)?.[1]?.trim() || "Unknown";
  const matchDate = todayIso();

  const parseBattingTable = (table) => {
    const rows = Array.from(table.querySelectorAll("tr"));
    const batters = [];
    rows.forEach((r) => {
      const cells = Array.from(r.querySelectorAll("td")).map((c) => c.textContent.trim());
      if (cells.length < 5) return;
      const name = cells[0];
      if (!name || /extras|total|fall|name/i.test(name)) return;
      const howOut = cells[1] || "not out";
      const bowler = cells[2] || "";
      const nums = cells.slice(3).map((c) => parseInt(c)).filter((n) => !isNaN(n));
      const runs = nums[0] || 0;
      const fours = nums[1] || 0;
      const sixes = nums[2] || 0;
      const balls = nums[3] || 0;
      const m = mapHowOut(howOut, bowler);
      batters.push({ name, runs, balls, fours, sixes, howOut, bowler, dismissal: m.dismissal, dismissal_type: m.dismissal_type, is_out: m.is_out });
    });
    return batters;
  };

  const parseBowlingTable = (table) => {
    const rows = Array.from(table.querySelectorAll("tr"));
    const bowlers = [];
    rows.forEach((r) => {
      const cells = Array.from(r.querySelectorAll("td")).map((c) => c.textContent.trim());
      if (cells.length < 5) return;
      const name = cells[0];
      if (!name || /bowler|total/i.test(name)) return;
      const overs = cells[1] || "0";
      const maidens = parseInt(cells[2]) || 0;
      const runs = parseInt(cells[3]) || 0;
      const wickets = parseInt(cells[4]) || 0;
      const wides = parseInt(cells[5]) || 0;
      const no_balls = parseInt(cells[6]) || 0;
      bowlers.push({ name, overs, maidens, runs, wickets, wides, no_balls });
    });
    return bowlers;
  };

  const batters1 = parseBattingTable(battingTables[0]);
  const batters2 = parseBattingTable(battingTables[1]);
  const bowlers1 = bowlingTables[0] ? parseBowlingTable(bowlingTables[0]) : [];
  const bowlers2 = bowlingTables[1] ? parseBowlingTable(bowlingTables[1]) : [];

  const totalRuns = (b) => b.reduce((s, x) => s + (x.runs || 0), 0);
  const innings1 = { runs: totalRuns(batters1), wickets: batters1.filter((b) => b.is_out).length, overs: 0, batters: batters1, bowlers: bowlers1, extras: { byes: 0, leg_byes: 0, wides: 0, no_balls: 0 } };
  const innings2 = { runs: totalRuns(batters2), wickets: batters2.filter((b) => b.is_out).length, overs: 0, batters: batters2, bowlers: bowlers2, extras: { byes: 0, leg_byes: 0, wides: 0, no_balls: 0 } };

  return {
    matchDate, ground, toss: "", result: "", team1Name, team2Name, oversPerInnings: 50,
    innings1, innings2,
  };
}