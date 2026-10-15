import React from 'react';
import { Medal, FileText } from 'lucide-react';

const BATTING_STATS = [
  { key: 'runs', label: 'Runs', weight: 2 },
  { key: 'average', label: 'Average', weight: 3 },
  { key: 'strikeRate', label: 'Strike Rate', weight: 2 },
  { key: 'highScore', label: 'High Score', weight: 1 },
  { key: 'innings', label: 'Innings', weight: 1 },
  { key: 'boundaries', label: 'Fours + Sixes', weight: 1 },
  { key: 'fifties', label: '50s + 100s', weight: 1 },
  { key: 'dotPct', label: 'Dot Ball %', weight: 1, lowerIsBetter: true },
];

const BOWLING_STATS = [
  { key: 'wickets', label: 'Wickets', weight: 3 },
  { key: 'economy', label: 'Economy', weight: 2, lowerIsBetter: true },
  { key: 'average', label: 'Average', weight: 2, lowerIsBetter: true },
  { key: 'strikeRate', label: 'Balls / Wicket', weight: 1, lowerIsBetter: true },
  { key: 'maidens', label: 'Maidens', weight: 1 },
  { key: 'dots', label: 'Dot Balls', weight: 1 },
  { key: 'fiveWickets', label: '5-Wicket Hauls', weight: 1 },
];

function StatRow({ label, a, b, lowerIsBetter }) {
  const numA = parseFloat(a) || 0;
  const numB = parseFloat(b) || 0;
  const max = Math.max(numA, numB, 0.01);
  const aWins = lowerIsBetter ? numA < numB : numA > numB;
  const bWins = lowerIsBetter ? numB < numA : numB > numA;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm font-semibold ${aWins ? 'text-emerald-400' : 'text-slate-400'}`}>{a}</span>
        <span className="text-xs text-slate-500 text-center px-2">{label}</span>
        <span className={`text-sm font-semibold ${bWins ? 'text-rose-400' : 'text-slate-400'}`}>{b}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 flex justify-end">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(numA / max) * 100}%`, backgroundColor: aWins ? '#10b981' : '#334155' }}
          />
        </div>
        <div className="w-px bg-slate-600" />
        <div className="flex-1">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${(numB / max) * 100}%`, backgroundColor: bWins ? '#f43f5e' : '#334155' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function CareerCompare({ type, statsA, statsB, playerA, playerB }) {
  const stats = type === 'bowling' ? BOWLING_STATS : BATTING_STATS;
  const title = type === 'bowling' ? 'Bowling Head-to-Head' : 'Batting Head-to-Head';

  // Weighted scoring: each stat win banks its weight for that player
  let pointsA = 0, pointsB = 0;
  const leadsA = [], leadsB = [];
  stats.forEach(({ key, label, weight, lowerIsBetter }) => {
    const numA = parseFloat(statsA[key]);
    const numB = parseFloat(statsB[key]);
    if (Number.isNaN(numA) || Number.isNaN(numB)) return;
    const aWins = lowerIsBetter ? numA < numB : numA > numB;
    const bWins = lowerIsBetter ? numB < numA : numB > numA;
    if (aWins) { pointsA += weight; leadsA.push(label); }
    else if (bWins) { pointsB += weight; leadsB.push(label); }
  });

  const totalPoints = pointsA + pointsB;
  const shareA = totalPoints > 0 ? (pointsA / totalPoints) * 100 : 50;
  const winner = pointsA > pointsB ? playerA.name : pointsB > pointsA ? playerB.name : null;

  let headline, body;
  if (!totalPoints) {
    headline = 'Nothing to split them yet';
    body = `Neither player has recorded ${type} stats in this mode yet.`;
  } else if (!winner) {
    headline = 'Dead even on the stats card';
    body = `${playerA.name} and ${playerB.name} finish level at ${pointsA}–${pointsB} across the key ${type} metrics — a genuine toss-up between them.`;
  } else {
    const loser = winner === playerA.name ? playerB.name : playerA.name;
    const winnerLeads = winner === playerA.name ? leadsA : leadsB;
    const loserLeads = winner === playerA.name ? leadsB : leadsA;
    headline = `${winner} has the better ${type} record`;
    body = `On the weighted card ${winner} takes it ${Math.max(pointsA, pointsB)}–${Math.min(pointsA, pointsB)}, leading in ${winnerLeads.join(', ')}` +
      (loserLeads.length ? `, while ${loser} holds the edge in ${loserLeads.join(', ')}.` : '.');
  }

  return (
    <>
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 mb-6">
        <h3 className="font-semibold text-white mb-4">{title}</h3>
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span className="text-emerald-400">{playerA.name}</span>
          <span className="text-rose-400">{playerB.name}</span>
        </div>
        {stats.map(({ key, label, lowerIsBetter }) => (
          <StatRow key={key} label={label} a={statsA[key] ?? 0} b={statsB[key] ?? 0} lowerIsBetter={lowerIsBetter} />
        ))}
      </div>

      {/* Verdict + report */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-xl p-5 border border-amber-500/30">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Medal className="w-4 h-4 text-amber-400" />
          Verdict & Report
        </h3>
        <div className="text-amber-400 font-semibold text-sm mb-2">{headline}</div>
        <p className="text-slate-300 text-sm leading-relaxed mb-3 flex items-start gap-2">
          <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          {body}
        </p>
        {totalPoints > 0 && (
          <div className="relative h-3 rounded-full overflow-hidden bg-rose-500/70">
            <div
              className="absolute inset-y-0 left-0 bg-emerald-500/80 transition-all duration-500"
              style={{ width: `${Math.round(shareA)}%` }}
            />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70" />
          </div>
        )}
        {totalPoints > 0 && (
          <div className="flex justify-between mt-2 text-xs font-medium">
            <span className="text-emerald-400">{playerA.name} · {Math.round(shareA)}%</span>
            <span className="text-rose-400">{playerB.name} · {100 - Math.round(shareA)}%</span>
          </div>
        )}
      </div>
    </>
  );
}