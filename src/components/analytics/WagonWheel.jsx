import React from 'react';
import GroundMap from '../scoring/GroundMap';

export default function WagonWheel({ deliveries = [], title = 'Wagon Wheel', size = 280 }) {
  const shots = deliveries
    .filter(d => d.shot_x != null && d.shot_y != null && !d.is_voided)
    .map(d => ({
      x: d.shot_x,
      y: d.shot_y,
      runs: d.runs_bat || 0,
      is_wicket: d.is_wicket,
      region: d.shot_region,
    }));

  const totalShots = shots.length;
  const boundaries = shots.filter(s => s.runs === 4 || s.runs === 6).length;
  const dots = shots.filter(s => s.runs === 0 && !s.is_wicket).length;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="font-semibold text-white mb-3">{title}</h3>
      {totalShots === 0 ? (
        <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
          No shot data captured yet
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-3">
            <GroundMap shots={shots} size={size} />
          </div>
          <div className="flex gap-3 justify-center text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-slate-400">1-3 ({shots.filter(s => s.runs > 0 && s.runs < 4).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-slate-400">4s ({shots.filter(s => s.runs === 4).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-slate-400">6s ({shots.filter(s => s.runs === 6).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-slate-400">W ({shots.filter(s => s.is_wicket).length})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-slate-400">Dots ({dots})</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-700/50 rounded-lg p-2">
              <div className="text-lg font-bold text-white">{totalShots}</div>
              <div className="text-xs text-slate-400">Shots</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2">
              <div className="text-lg font-bold text-emerald-400">{boundaries}</div>
              <div className="text-xs text-slate-400">Boundaries</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2">
              <div className="text-lg font-bold text-slate-300">{dots}</div>
              <div className="text-xs text-slate-400">Dots</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}