import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function CareerTotals({ playerA, playerB, careerA, careerB, modeLabel }) {
  if (!careerA || !careerB) return null;

  const rows = [
    { label: 'Runs scored', a: careerA.batting.runs, b: careerB.batting.runs },
    { label: 'Wickets taken', a: careerA.bowling.wickets, b: careerB.bowling.wickets },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 mb-6">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        Career Totals
      </h3>

      <div className="flex justify-between text-sm font-semibold mb-4">
        <span className="text-emerald-400">{playerA.name}</span>
        <span className="text-rose-400">{playerB.name}</span>
      </div>

      <div className="space-y-3">
        {rows.map(({ label, a, b }) => (
          <div key={label} className="flex items-center gap-4">
            <span className={`text-xl font-bold w-16 ${a > b ? 'text-emerald-400' : 'text-slate-300'}`}>{a}</span>
            <span className="text-xs text-slate-500 text-center flex-1">{label}</span>
            <span className={`text-xl font-bold w-16 text-right ${b > a ? 'text-rose-400' : 'text-slate-300'}`}>{b}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-4">
        Each player's own runs and wickets in {modeLabel} mode — the higher figure is highlighted.
      </p>
    </div>
  );
}