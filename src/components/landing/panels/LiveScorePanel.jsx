import React from 'react';

const BATTERS = [
  { name: 'A. Sharma', runs: 68, balls: 41, onStrike: true },
  { name: 'R. Patel', runs: 24, balls: 19, onStrike: false },
];

const THIS_OVER = ['1', '4', 'W', '.', '2', '6'];

const ballStyle = (ball) => {
  if (ball === 'W') return 'bg-red-500/20 text-red-300';
  if (ball === '4' || ball === '6') return 'bg-amber-500/20 text-amber-300';
  return 'bg-slate-700/60 text-slate-300';
};

export default function LiveScorePanel() {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 p-5">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">CrickTrack CC</p>
          <p className="text-[11px] text-emerald-400">16.3 ov</p>
        </div>
        <p className="mt-1 text-3xl font-bold text-white">
          142<span className="text-slate-400">/4</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">Need 58 off 21 balls</p>
      </div>

      <div className="space-y-2">
        {BATTERS.map((batter) => (
          <div key={batter.name} className="flex items-center justify-between text-sm">
            <span className="text-slate-200">
              {batter.name}
              {batter.onStrike && <span className="text-emerald-400"> *</span>}
            </span>
            <span className="text-slate-300">
              {batter.runs} <span className="text-xs text-slate-500">({batter.balls})</span>
            </span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-slate-500">This over</p>
        <div className="mt-2 flex gap-1.5">
          {THIS_OVER.map((ball, index) => (
            <span
              key={index}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${ballStyle(ball)}`}>
              {ball}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}