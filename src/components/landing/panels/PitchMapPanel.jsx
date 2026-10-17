import React from 'react';

// Landing points for each delivery, coloured by length.
const DELIVERIES = [
  { x: 48, y: 118, length: 'full' },
  { x: 80, y: 114, length: 'full' },
  { x: 60, y: 96, length: 'good' },
  { x: 74, y: 88, length: 'good' },
  { x: 38, y: 100, length: 'good' },
  { x: 66, y: 62, length: 'good' },
  { x: 46, y: 70, length: 'short' },
  { x: 56, y: 44, length: 'short' },
  { x: 70, y: 34, length: 'short' },
];

const LENGTH_COLOUR = {
  full: '#22d3ee',
  good: '#34d399',
  short: '#fbbf24',
};

export default function PitchMapPanel() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-5">
      <svg viewBox="0 0 120 150" className="max-h-[230px] w-full">
        <rect x="32" y="15" width="56" height="120" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <line x1="40" y1="15" x2="80" y2="15" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="28" x2="84" y2="28" stroke="#475569" strokeWidth="1" />
        {DELIVERIES.map((delivery, index) => (
          <circle
            key={index}
            cx={delivery.x}
            cy={delivery.y}
            r="4"
            fill={LENGTH_COLOUR[delivery.length]}
            opacity="0.85"
          />
        ))}
      </svg>
      <div className="mt-4 flex gap-4 text-[10px] uppercase tracking-wider text-slate-500">
        <span className="text-cyan-400">Full</span>
        <span className="text-emerald-400">Good</span>
        <span className="text-amber-400">Short</span>
      </div>
    </div>
  );
}