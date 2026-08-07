import React from 'react';
import PitchMap from '../scoring/PitchMap';

const LENGTH_ORDER = ['Full Toss', 'Yorker', 'Full', 'Good Length', 'Back of Length', 'Short', 'Bouncer'];

const LENGTH_LABELS = {
  full_toss: 'Full Toss',
  yorker: 'Yorker',
  full: 'Full',
  good_length: 'Good Length',
  good: 'Good Length',
  back_of_length: 'Back of Length',
  short: 'Short',
  bouncer: 'Bouncer',
};

function normLen(l) {
  if (!l) return null;
  const key = String(l).trim().toLowerCase().replace(/\s+/g, '_');
  return LENGTH_LABELS[key] ? key : null;
}

export default function PitchHeatmap({ deliveries = [], title = 'Pitch Map', width = 130, height = 300 }) {
  const marks = deliveries
    .filter(d => d.pitch_x != null && d.pitch_y != null && !d.is_voided)
    .map(d => ({
      px: d.pitch_x,
      py: d.pitch_y,
      runs: d.runs_bat || 0,
      is_wicket: d.is_wicket,
      length: d.length,
      line: d.line,
    }));

  // Length distribution
  const lengthCounts = {};
  marks.forEach(m => {
    const key = normLen(m.length);
    if (key) {
      const label = LENGTH_LABELS[key];
      lengthCounts[label] = (lengthCounts[label] || 0) + 1;
    }
  });

  const maxCount = Math.max(...Object.values(lengthCounts), 1);

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="font-semibold text-white mb-3">{title}</h3>
      {marks.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          No pitch data captured yet
        </div>
      ) : (
        <div className="flex gap-4 items-start flex-wrap">
          <div>
            <PitchMap pitchMarks={marks} width={width} height={height} />
            <div className="flex gap-2 mt-2 text-xs justify-center flex-wrap">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Wicket</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Boundary</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Run</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500 inline-block" /> Dot</span>
            </div>
          </div>

          <div className="flex-1 min-w-[140px]">
            <p className="text-xs text-slate-400 mb-2 font-medium">Length Distribution</p>
            <div className="space-y-1.5">
              {LENGTH_ORDER.map(len => {
                const count = lengthCounts[len] || 0;
                const pct = (count / marks.length) * 100;
                return (
                  <div key={len}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-400">{len}</span>
                      <span className="text-slate-300">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-slate-400 font-medium">Stats</p>
              {[
                { label: 'Total Deliveries', val: marks.length },
                { label: 'Wickets', val: marks.filter(m => m.is_wicket).length, color: 'text-red-400' },
                { label: 'Boundaries', val: marks.filter(m => m.runs >= 4).length, color: 'text-amber-400' },
                { label: 'Dots', val: marks.filter(m => m.runs === 0 && !m.is_wicket).length },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-medium ${color || 'text-white'}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}