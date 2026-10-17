import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const STRENGTHS = ['Scores heavily through cover', 'Comfortable against spin', 'Quick between the wickets'];
const WEAKNESSES = ['Short ball outside off', 'Slow first ten balls of an innings'];

export default function InsightTagsPanel() {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5">
      <h3 className="text-sm font-semibold text-white">Strengths &amp; weaknesses</h3>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
        Read from the ball-by-ball detail
      </p>

      <ul className="mt-4 space-y-2">
        {STRENGTHS.map((s) => (
          <li key={s} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            {s}
          </li>
        ))}
        {WEAKNESSES.map((w) => (
          <li key={w} className="flex items-start gap-2 text-sm text-slate-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}