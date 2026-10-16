// Deterministic sample data for the signed-out demo experience.
// Nothing here touches the database — it is generated in memory on load, so a
// visitor browsing the demo never reads or writes a real record.

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LENGTHS = ['full_toss', 'yorker', 'full', 'good_length', 'back_of_length', 'short'];
const LINES = ['wide_outside_off', 'outside_off', 'off_stump', 'middle_stump', 'leg_stump', 'outside_leg'];

const PITCH_X = {
  wide_outside_off: 0.28,
  outside_off: 0.38,
  off_stump: 0.45,
  middle_stump: 0.52,
  leg_stump: 0.6,
  outside_leg: 0.7,
};

const PITCH_Y = {
  full_toss: 0.1,
  yorker: 0.2,
  full: 0.35,
  good_length: 0.5,
  back_of_length: 0.63,
  short: 0.78,
};

const REGIONS = ['Third Man', 'Point', 'Cover', 'Mid Off', 'Mid On', 'Mid Wicket', 'Square Leg', 'Fine Leg'];

export const DEMO_TEAMS = [
  { id: 'demo-t1', name: 'Riverside CC', short_name: 'RIV', primary_color: '#10b981', home_ground: 'Riverside Oval' },
  { id: 'demo-t2', name: 'Kingsbury Strikers', short_name: 'KGS', primary_color: '#38bdf8', home_ground: 'Kingsbury Park' },
  { id: 'demo-t3', name: 'Northgate Nomads', short_name: 'NGN', primary_color: '#f59e0b', home_ground: 'Northgate Green' },
  { id: 'demo-t4', name: 'Bramley Tigers', short_name: 'BRT', primary_color: '#a855f7', home_ground: 'Bramley Rec' },
];

export const DEMO_TEAMS_MAP = DEMO_TEAMS.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});

// Raw career numbers; average, strike rate and economy are derived below.
const RAW_PLAYERS = [
  { id: 'demo-p1', team_id: 'demo-t1', name: 'Daniel Whitfield', role: 'batsman', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 7, is_captain: true, matches: 34, innings: 32, runs: 1247, balls: 972, hs: 118, fours: 121, sixes: 38, fifties: 9, hundreds: 2, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p2', team_id: 'demo-t1', name: 'Sam Okoye', role: 'all_rounder', batting_style: 'right_hand', bowling_style: 'right_arm_medium', jersey_number: 22, matches: 31, innings: 28, runs: 782, balls: 651, hs: 84, fours: 68, sixes: 22, fifties: 4, hundreds: 0, wickets: 41, balls_bowled: 1180, runs_conceded: 962, best: '4/18' },
  { id: 'demo-p3', team_id: 'demo-t1', name: 'Harry Benson', role: 'wicket_keeper', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 12, is_wicket_keeper: true, matches: 29, innings: 26, runs: 640, balls: 588, hs: 71, fours: 54, sixes: 9, fifties: 3, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p4', team_id: 'demo-t1', name: 'Aiden Cole', role: 'bowler', batting_style: 'right_hand', bowling_style: 'right_arm_fast', jersey_number: 31, matches: 33, innings: 20, runs: 186, balls: 201, hs: 24, fours: 14, sixes: 3, fifties: 0, hundreds: 0, wickets: 56, balls_bowled: 1420, runs_conceded: 1180, best: '5/22' },
  { id: 'demo-p5', team_id: 'demo-t1', name: 'Tom Radley', role: 'bowler', batting_style: 'left_hand', bowling_style: 'left_arm_orthodox', jersey_number: 44, matches: 27, innings: 17, runs: 142, balls: 168, hs: 19, fours: 9, sixes: 2, fifties: 0, hundreds: 0, wickets: 44, balls_bowled: 1290, runs_conceded: 1042, best: '4/25' },
  { id: 'demo-p6', team_id: 'demo-t1', name: 'Josh Fenwick', role: 'batsman', batting_style: 'left_hand', bowling_style: 'none', jersey_number: 18, matches: 18, innings: 15, runs: 402, balls: 348, hs: 62, fours: 39, sixes: 8, fifties: 2, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p7', team_id: 'demo-t1', name: 'Ryan Mercer', role: 'bowler', batting_style: 'right_hand', bowling_style: 'right_arm_off_spin', jersey_number: 9, matches: 21, innings: 12, runs: 96, balls: 118, hs: 16, fours: 7, sixes: 1, fifties: 0, hundreds: 0, wickets: 34, balls_bowled: 1020, runs_conceded: 780, best: '4/12' },

  { id: 'demo-p8', team_id: 'demo-t2', name: 'Marcus Hale', role: 'batsman', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 5, is_captain: true, matches: 30, innings: 29, runs: 1104, balls: 890, hs: 96, fours: 98, sixes: 26, fifties: 7, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p9', team_id: 'demo-t2', name: 'Ravi Chandran', role: 'all_rounder', batting_style: 'right_hand', bowling_style: 'right_arm_off_spin', jersey_number: 27, matches: 28, innings: 25, runs: 668, balls: 540, hs: 73, fours: 55, sixes: 18, fifties: 3, hundreds: 0, wickets: 38, balls_bowled: 1090, runs_conceded: 880, best: '4/21' },
  { id: 'demo-p10', team_id: 'demo-t2', name: 'Liam Doyle', role: 'wicket_keeper', batting_style: 'left_hand', bowling_style: 'none', jersey_number: 14, is_wicket_keeper: true, matches: 22, innings: 20, runs: 512, balls: 470, hs: 58, fours: 44, sixes: 7, fifties: 2, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p11', team_id: 'demo-t2', name: 'Ben Sturgess', role: 'bowler', batting_style: 'right_hand', bowling_style: 'right_arm_fast', jersey_number: 33, matches: 26, innings: 15, runs: 98, balls: 120, hs: 14, fours: 8, sixes: 0, fifties: 0, hundreds: 0, wickets: 49, balls_bowled: 1210, runs_conceded: 1010, best: '5/19' },
  { id: 'demo-p12', team_id: 'demo-t2', name: 'Kyle Petersen', role: 'bowler', batting_style: 'right_hand', bowling_style: 'right_arm_leg_spin', jersey_number: 41, matches: 24, innings: 12, runs: 76, balls: 95, hs: 11, fours: 5, sixes: 1, fifties: 0, hundreds: 0, wickets: 41, balls_bowled: 1080, runs_conceded: 900, best: '4/28' },
  { id: 'demo-p13', team_id: 'demo-t2', name: 'Nathan Boyle', role: 'bowler', batting_style: 'left_hand', bowling_style: 'left_arm_medium', jersey_number: 16, matches: 19, innings: 11, runs: 64, balls: 82, hs: 12, fours: 4, sixes: 0, fifties: 0, hundreds: 0, wickets: 31, balls_bowled: 940, runs_conceded: 812, best: '3/16' },

  { id: 'demo-p14', team_id: 'demo-t3', name: 'Ethan Marsh', role: 'batsman', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 3, is_captain: true, matches: 21, innings: 20, runs: 733, balls: 640, hs: 88, fours: 62, sixes: 17, fifties: 5, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p15', team_id: 'demo-t3', name: 'Ollie Grant', role: 'all_rounder', batting_style: 'left_hand', bowling_style: 'left_arm_medium', jersey_number: 21, matches: 23, innings: 20, runs: 520, balls: 470, hs: 64, fours: 41, sixes: 12, fifties: 2, hundreds: 0, wickets: 33, balls_bowled: 940, runs_conceded: 790, best: '3/17' },
  { id: 'demo-p16', team_id: 'demo-t3', name: 'Callum Reid', role: 'bowler', batting_style: 'right_hand', bowling_style: 'right_arm_fast', jersey_number: 29, matches: 19, innings: 13, runs: 64, balls: 88, hs: 12, fours: 4, sixes: 0, fifties: 0, hundreds: 0, wickets: 37, balls_bowled: 980, runs_conceded: 812, best: '4/23' },
  { id: 'demo-p17', team_id: 'demo-t3', name: 'Niall Foster', role: 'wicket_keeper', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 8, is_wicket_keeper: true, matches: 17, innings: 15, runs: 331, balls: 322, hs: 49, fours: 28, sixes: 4, fifties: 1, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p18', team_id: 'demo-t3', name: 'Isaac Palmer', role: 'batsman', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 24, matches: 14, innings: 13, runs: 288, balls: 276, hs: 54, fours: 26, sixes: 6, fifties: 1, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },

  { id: 'demo-p19', team_id: 'demo-t4', name: 'Zac Holloway', role: 'batsman', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 1, is_captain: true, matches: 25, innings: 24, runs: 867, balls: 742, hs: 103, fours: 78, sixes: 24, fifties: 6, hundreds: 1, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
  { id: 'demo-p20', team_id: 'demo-t4', name: 'Idris Bello', role: 'all_rounder', batting_style: 'right_hand', bowling_style: 'right_arm_off_spin', jersey_number: 17, matches: 22, innings: 19, runs: 455, balls: 410, hs: 57, fours: 36, sixes: 10, fifties: 2, hundreds: 0, wickets: 29, balls_bowled: 870, runs_conceded: 720, best: '3/22' },
  { id: 'demo-p21', team_id: 'demo-t4', name: 'Rhys Dalton', role: 'bowler', batting_style: 'left_hand', bowling_style: 'left_arm_fast', jersey_number: 36, matches: 20, innings: 11, runs: 52, balls: 74, hs: 10, fours: 3, sixes: 0, fifties: 0, hundreds: 0, wickets: 40, balls_bowled: 1010, runs_conceded: 830, best: '5/26' },
  { id: 'demo-p22', team_id: 'demo-t4', name: 'Freddie Nash', role: 'batsman', batting_style: 'right_hand', bowling_style: 'none', jersey_number: 11, matches: 16, innings: 14, runs: 298, balls: 290, hs: 45, fours: 23, sixes: 5, fifties: 0, hundreds: 0, wickets: 0, balls_bowled: 0, runs_conceded: 0, best: '—' },
];

export const DEMO_PLAYERS = RAW_PLAYERS.map((p) => ({
  ...p,
  average: p.innings ? +(p.runs / p.innings).toFixed(1) : 0,
  strike_rate: p.balls ? +((p.runs / p.balls) * 100).toFixed(1) : 0,
  economy: p.balls_bowled ? +((p.runs_conceded / (p.balls_bowled / 6)) || 0).toFixed(2) : 0,
  overs_bowled: +(p.balls_bowled / 6).toFixed(0),
}));

export const DEMO_PLAYERS_MAP = DEMO_PLAYERS.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

// Spread a target total across a fixed number of balls so the innings always
// adds up, while still producing a realistic mix of dots, singles and boundaries.
function runsSequence(total, balls, rand) {
  const seq = [];
  let remaining = total;
  for (let i = 0; i < balls; i++) {
    const left = balls - i;
    const pace = remaining / left;
    const r = rand();
    let pick;
    if (pace >= 2.2) pick = r < 0.45 ? 6 : r < 0.8 ? 4 : 2;
    else if (pace >= 1.8) pick = r < 0.3 ? 4 : r < 0.55 ? 2 : r < 0.75 ? 6 : 1;
    else if (pace >= 1.4) pick = r < 0.3 ? 2 : r < 0.75 ? 1 : r < 0.9 ? 4 : 0;
    else if (pace >= 1.05) pick = r < 0.55 ? 1 : r < 0.8 ? 0 : 2;
    else pick = r < 0.7 ? 0 : 1;

    const minNow = Math.max(0, remaining - (left - 1) * 6);
    pick = Math.max(minNow, Math.min(pick, remaining));
    seq.push(pick);
    remaining -= pick;
  }
  return seq;
}

// Builds one innings plus its ball-by-ball log, with shot and pitch coordinates
// so the demo can show a real wagon wheel, pitch map and worm graph.
function buildInnings(cfg) {
  const rand = mulberry32(cfg.seed);
  const balls = cfg.overs * 6;
  const runs = runsSequence(cfg.total, balls, rand);
  const wickets = new Set(cfg.wicketBalls);
  const deliveries = [];

  const chunk = Math.floor(balls / cfg.batters.length);

  for (let i = 0; i < balls; i++) {
    const over = Math.floor(i / 6);
    const ballInOver = (i % 6) + 1;
    const runsBat = runs[i];
    const isWicket = wickets.has(i + 1);

    const length = LENGTHS[Math.floor(rand() * LENGTHS.length)];
    const line = LINES[Math.floor(rand() * LINES.length)];

    // Shot direction and distance: boundaries fly further than dots.
    const theta = rand() * Math.PI * 2;
    const dist =
      runsBat >= 6 ? 0.98 + rand() * 0.06 :
      runsBat === 4 ? 0.86 + rand() * 0.1 :
      runsBat === 0 ? 0.22 + rand() * 0.3 :
      0.4 + rand() * 0.35;
    const regionIdx = Math.min(
      REGIONS.length - 1,
      Math.max(0, Math.floor(((theta / (Math.PI * 2)) * REGIONS.length) % REGIONS.length))
    );

    const strikerIdx = Math.min(cfg.batters.length - 1, Math.floor(i / chunk));
    const bowlerIdx = Math.min(cfg.bowlers.length - 1, Math.floor(over / cfg.bowlerOvers));

    deliveries.push({
      id: `${cfg.id}-d${i + 1}`,
      match_id: cfg.match_id,
      innings_id: cfg.id,
      over_number: over,
      ball_in_over: ballInOver,
      delivery_number: i + 1,
      striker_id: cfg.batters[strikerIdx],
      non_striker_id: cfg.batters[(strikerIdx + 1) % cfg.batters.length],
      bowler_id: cfg.bowlers[bowlerIdx],
      runs_bat: runsBat,
      runs_total: runsBat,
      is_wide: false,
      is_no_ball: false,
      is_legal_delivery: true,
      is_wicket: isWicket,
      wicket_type: isWicket ? (rand() < 0.5 ? 'caught' : rand() < 0.6 ? 'bowled' : 'lbw') : undefined,
      player_out_id: isWicket ? cfg.batters[strikerIdx] : undefined,
      is_boundary: runsBat === 4,
      is_six: runsBat === 6,
      is_dot_ball: runsBat === 0 && !isWicket,
      shot_x: +(Math.sin(theta) * dist).toFixed(3),
      shot_y: +(Math.cos(theta) * dist).toFixed(3),
      shot_region: REGIONS[regionIdx],
      shot_side: Math.sin(theta) < 0 ? 'leg' : 'off',
      shot_distance: runsBat >= 4 ? 'boundary' : runsBat === 0 ? 'inner' : 'mid',
      pitch_x: +(PITCH_X[line] + (rand() - 0.5) * 0.06).toFixed(3),
      pitch_y: +(PITCH_Y[length] + (rand() - 0.5) * 0.06).toFixed(3),
      length,
      line,
      is_voided: false,
    });
  }

  const total = runs.reduce((a, b) => a + b, 0);
  const wicketsLost = [...wickets].filter((b) => b <= balls).length;

  return {
    innings: {
      id: cfg.id,
      match_id: cfg.match_id,
      innings_number: cfg.number,
      batting_team_id: cfg.batting_team_id,
      bowling_team_id: cfg.bowling_team_id,
      is_super_over: false,
      total_runs: total,
      total_wickets: wicketsLost,
      total_overs: cfg.overs,
      total_balls: balls,
      status: cfg.status || 'completed',
    },
    deliveries,
  };
}

const built1 = buildInnings({
  id: 'demo-i1',
  match_id: 'demo-m1',
  number: 1,
  seed: 11,
  total: 168,
  overs: 20,
  wicketBalls: [18, 44, 71, 93, 104, 117],
  batting_team_id: 'demo-t1',
  bowling_team_id: 'demo-t2',
  batters: ['demo-p1', 'demo-p3', 'demo-p6', 'demo-p2', 'demo-p5', 'demo-p4'],
  bowlers: ['demo-p11', 'demo-p12', 'demo-p13', 'demo-p9'],
  bowlerOvers: 5,
});

const built2 = buildInnings({
  id: 'demo-i2',
  match_id: 'demo-m1',
  number: 2,
  seed: 22,
  total: 152,
  overs: 20,
  wicketBalls: [12, 29, 55, 68, 84, 99, 110, 118],
  batting_team_id: 'demo-t2',
  bowling_team_id: 'demo-t1',
  batters: ['demo-p8', 'demo-p10', 'demo-p9', 'demo-p13', 'demo-p11', 'demo-p12'],
  bowlers: ['demo-p4', 'demo-p5', 'demo-p2', 'demo-p7'],
  bowlerOvers: 5,
});

const built3 = buildInnings({
  id: 'demo-i3',
  match_id: 'demo-m3',
  number: 1,
  seed: 33,
  total: 142,
  overs: 17,
  wicketBalls: [23, 51, 77, 88],
  batting_team_id: 'demo-t1',
  bowling_team_id: 'demo-t3',
  batters: ['demo-p1', 'demo-p3', 'demo-p6', 'demo-p2', 'demo-p5'],
  bowlers: ['demo-p16', 'demo-p15', 'demo-p14'],
  bowlerOvers: 6,
  status: 'in_progress',
});

export const DEMO_INNINGS = [built1.innings, built2.innings, built3.innings];
export const DEMO_DELIVERIES = [...built1.deliveries, ...built2.deliveries, ...built3.deliveries];

const LIVE_INNINGS = built3.innings;

export const DEMO_MATCHES = [
  {
    id: 'demo-m1',
    date: '2026-09-14',
    venue: 'Riverside Oval',
    team1_id: 'demo-t1',
    team2_id: 'demo-t2',
    status: 'completed',
    overs_per_innings: 20,
    ground_mode: 'turf',
    result: 'Riverside CC won by 16 runs',
    innings_ids: ['demo-i1', 'demo-i2'],
  },
  {
    id: 'demo-m2',
    date: '2026-09-21',
    venue: 'Bramley Rec',
    team1_id: 'demo-t4',
    team2_id: 'demo-t3',
    status: 'completed',
    overs_per_innings: 20,
    ground_mode: 'turf',
    result: 'Bramley Tigers won by 4 wickets',
    score_lines: [
      { team_id: 'demo-t4', text: '171/6 (20.0)' },
      { team_id: 'demo-t3', text: '168/8 (20.0)' },
    ],
  },
  {
    id: 'demo-m3',
    date: '2026-10-16',
    venue: 'Riverside Oval',
    team1_id: 'demo-t1',
    team2_id: 'demo-t3',
    status: 'live',
    overs_per_innings: 20,
    ground_mode: 'turf',
    result: '',
    innings_ids: ['demo-i3'],
  },
  { id: 'demo-m4', date: '2026-10-18', venue: 'Kingsbury Park', team1_id: 'demo-t2', team2_id: 'demo-t4', status: 'setup', overs_per_innings: 20, ground_mode: 'turf', result: '' },
  { id: 'demo-m5', date: '2026-10-25', venue: 'Northgate Green', team1_id: 'demo-t3', team2_id: 'demo-t1', status: 'setup', overs_per_innings: 20, ground_mode: 'turf', result: '' },
];

// Score line for a match card, e.g. "168/6 (20.0)".
export function demoScoreLine(match, teamId) {
  if (match.score_lines) {
    const line = match.score_lines.find((s) => s.team_id === teamId);
    return line ? line.text : '';
  }
  const ids = match.innings_ids || [];
  for (const id of ids) {
    const inn = DEMO_INNINGS.find((i) => i.id === id);
    if (inn && inn.batting_team_id === teamId) {
      return `${inn.total_runs}/${inn.total_wickets} (${inn.total_overs}.0)`;
    }
  }
  return '';
}

export const DEMO_LIVE_SCORE = {
  team_id: LIVE_INNINGS.batting_team_id,
  runs: LIVE_INNINGS.total_runs,
  wickets: LIVE_INNINGS.total_wickets,
  overs: `${LIVE_INNINGS.total_overs}.0`,
};

export const DEMO_VENUES = [
  { id: 'demo-v1', name: 'Riverside Oval', location: 'Riverside', average: 164, matches: 18 },
  { id: 'demo-v2', name: 'Kingsbury Park', location: 'Kingsbury', average: 148, matches: 12 },
  { id: 'demo-v3', name: 'Northgate Green', location: 'Northgate', average: 139, matches: 9 },
  { id: 'demo-v4', name: 'Bramley Rec', location: 'Bramley', average: 155, matches: 15 },
  { id: 'demo-v5', name: 'Meadowbrook Ground', location: 'Elton', average: 171, matches: 7 },
];

export const DEMO_RUNS_LEADERS = [...DEMO_PLAYERS].sort((a, b) => b.runs - a.runs).slice(0, 6);
export const DEMO_WICKET_LEADERS = [...DEMO_PLAYERS].sort((a, b) => b.wickets - a.wickets).slice(0, 6);
export const DEMO_STRIKE_LEADERS = [...DEMO_PLAYERS]
  .filter((p) => p.runs >= 250)
  .sort((a, b) => b.strike_rate - a.strike_rate)
  .slice(0, 5);

export const DEMO_TOURNAMENT = {
  id: 'demo-tour-1',
  name: 'Summer Slam 2026',
  format: 'league_playoffs',
  status: 'in_progress',
  team_ids: ['demo-t1', 'demo-t2', 'demo-t3', 'demo-t4'],
  standings: [
    { team_id: 'demo-t1', played: 4, won: 4, lost: 0, points: 8, nrr: '+1.24' },
    { team_id: 'demo-t2', played: 4, won: 2, lost: 2, points: 4, nrr: '+0.31' },
    { team_id: 'demo-t4', played: 4, won: 2, lost: 2, points: 4, nrr: '-0.12' },
    { team_id: 'demo-t3', played: 4, won: 0, lost: 4, points: 0, nrr: '-1.42' },
  ],
  bracket: [
    { label: 'Qualifier', detail: '1st vs 2nd', team1_id: 'demo-t1', team2_id: 'demo-t2', winner_team_id: 'demo-t1' },
    { label: 'Eliminator', detail: '3rd vs 4th', team1_id: 'demo-t4', team2_id: 'demo-t3', winner_team_id: 'demo-t4' },
    { label: 'Final', detail: 'Winner Qualifier vs Winner Eliminator', team1_id: 'demo-t1', team2_id: 'demo-t4', winner_team_id: '' },
  ],
};