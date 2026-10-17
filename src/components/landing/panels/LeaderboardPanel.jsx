import React from 'react';

const LEADERS = [
  { name: 'A. Sharma', team: 'CrickTrack CC', runs: 812, average: '47.8' },
  { name: 'J. Whitmore', team: 'Riverside', runs: 704, average: '39.1' },
  { name: 'R. Patel', team: 'CrickTrack CC', runs: 655, average: '43.7' },
  { name: 'D. Okafor', team: 'Oakfield', runs: 598, average: '35.2' },
];

export default function LeaderboardPanel() {
  return (
    <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-950 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-slate-500">Season runs</p>
        <p className="text-[11px] text-slate-500">14 matches</p>
      </div>

      <div className="space-y-2.5">
        {LEADERS.map((player, index) => (
          <div key={player.name} className="flex items-center gap-3">
            <span className="w-4 text-xs font-semibold text-slate-500">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-100">{player.name}</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-slate-500">
                {player.team}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-400">{player.runs}</p>
              <p className="text-[10px] text-slate-500">avg {player.average}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}