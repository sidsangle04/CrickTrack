import React from 'react';

const INNINGS_ONE = '14,112 46,98 78,84 110,70 142,58 174,44 206,34';
const INNINGS_TWO = '14,118 46,108 78,96 110,86 142,74 174,64 206,50';

export default function WormGraphPanel() {
  return (
    <div className="flex h-full w-full flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-5">
      <svg viewBox="0 0 220 130" className="max-h-[210px] w-full">
        <line x1="14" y1="118" x2="212" y2="118" stroke="#334155" strokeWidth="1" />
        <line x1="14" y1="20" x2="14" y2="118" stroke="#334155" strokeWidth="1" />
        {[0, 1, 2, 3].map((step) => (
          <line
            key={step}
            x1="14"
            y1={20 + step * 24.5}
            x2="212"
            y2={20 + step * 24.5}
            stroke="#1e293b"
            strokeWidth="1"
          />
        ))}
        <polyline
          points={INNINGS_ONE}
          fill="none"
          stroke="#34d399"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points={INNINGS_TWO}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-4 flex justify-center gap-5 text-[10px] uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-emerald-400" />
          CrickTrack CC
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full bg-cyan-400" />
          Visitors
        </span>
      </div>
    </div>
  );
}