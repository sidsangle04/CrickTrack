import React from 'react';
import { Label } from '@/components/ui/label';
import { knockoutPairs } from '@/lib/bracket';

const OPTIONS = [
  { key: 'standard', title: 'Seeds apart', hint: '1st vs 4th, 2nd vs 3rd' },
  { key: 'adjacent', title: 'As listed', hint: '1st vs 2nd, 3rd vs 4th' },
  { key: 'cross', title: 'Cross', hint: '1st vs 3rd, 2nd vs 4th' },
];

const ordinal = (n) => {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]}`;
};

const stageName = (total, index) => {
  if (total === 1) return 'Final';
  if (total === 2) return `Semifinal ${index + 1}`;
  if (total === 4) return `Quarterfinal ${index + 1}`;
  return `Match ${index + 1}`;
};

// Asks how the knockout is played once the qualifying teams are known.
export default function KnockoutPairingPicker({ value, onChange, teamCount }) {
  const count = Math.max(2, teamCount || 2);
  const pairs = knockoutPairs(count, value);

  return (
    <div>
      <Label className="text-slate-200">How the knockout is played</Label>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`p-2.5 rounded-lg text-left border transition-colors ${
              value === option.key
                ? 'bg-emerald-500/20 border-emerald-500/50'
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="text-xs font-semibold text-white">{option.title}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{option.hint}</div>
          </button>
        ))}
      </div>

      <div className="mt-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2.5 space-y-1">
        {pairs.map(([a, b], i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <span className="w-24 shrink-0 font-semibold text-emerald-400">
              {stageName(pairs.length, i)}
            </span>
            <span className="text-slate-200">
              {a <= count ? ordinal(a) : 'Bye'} vs {b <= count ? ordinal(b) : 'Bye'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}