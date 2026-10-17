import React from 'react';
import { Swords } from 'lucide-react';

const PLAYER_A = { name: 'A. Rahman', team: 'Riverside CC' };
const PLAYER_B = { name: 'D. Cole', team: 'Oakfield XI' };

// Sample figures, the kind the app builds from a season of scored balls.
const ROWS = [
  { label: 'Runs', a: 412, b: 388, format: (v) => v },
  { label: 'Strike rate', a: 128, b: 96, format: (v) => v },
  { label: 'Average', a: 41.2, b: 27.7, format: (v) => v },
  { label: 'Best', a: 84, b: 63, format: (v) => v },
];

const max = Math.max(...ROWS.flatMap((r) => [r.a, r.b]));

export default function ComparisonPanel() {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
        <Swords className="h-3.5 w-3.5" />
        Head to head
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[PLAYER_A, PLAYER_B].map((p, i) => (
          <div
            key={p.name}
            className={`rounded-xl border p-3 ${
              i === 0
                ? 'border-emerald-500/40 bg-emerald-500/10'
                : 'border-slate-700/60 bg-slate-800/50'
            }`}>
            <p className="truncate text-sm font-semibold text-white">{p.name}</p>
            <p className="truncate text-[11px] text-slate-400">{p.team}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {ROWS.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-500">
              <span className="font-semibold text-slate-300">{row.format(row.a)}</span>
              <span>{row.label}</span>
              <span className="font-semibold text-slate-300">{row.format(row.b)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              <div className="flex flex-1 justify-end">
                <div
                  className="h-1.5 rounded-full bg-emerald-400"
                  style={{ width: `${(row.a / max) * 100}%` }}
                />
              </div>
              <div className="flex flex-1 justify-start">
                <div
                  className="h-1.5 rounded-full bg-cyan-400"
                  style={{ width: `${(row.b / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}