import React from 'react';

// Scoring shots plotted from the striker's end, coloured by value.
const SHOTS = [
  { x: 128, y: 52, runs: 6 },
  { x: 122, y: 96, runs: 4 },
  { x: 100, y: 126, runs: 2 },
  { x: 44, y: 128, runs: 1 },
  { x: 16, y: 92, runs: 4 },
  { x: 14, y: 44, runs: 1 },
  { x: 40, y: 18, runs: 6 },
  { x: 78, y: 12, runs: 2 },
  { x: 118, y: 26, runs: 1 },
  { x: 60, y: 122, runs: 3 },
];

const colour = (runs) => {
  if (runs >= 6) return '#fbbf24';
  if (runs === 4) return '#22d3ee';
  return '#34d399';
};

export default function WagonWheelPanel() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-5">
      <svg viewBox="0 0 140 140" className="max-h-[230px] w-full">
        <circle cx="70" cy="70" r="62" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        <circle
          cx="70"
          cy="70"
          r="40"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        {SHOTS.map((shot, index) => (
          <line
            key={index}
            x1="70"
            y1="70"
            x2={shot.x}
            y2={shot.y}
            stroke={colour(shot.runs)}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.9"
          />
        ))}
        <circle cx="70" cy="70" r="3" fill="#e2e8f0" />
      </svg>
    </div>
  );
}