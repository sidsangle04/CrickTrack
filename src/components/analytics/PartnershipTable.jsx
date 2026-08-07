import React from 'react';

const DARK = '#2A6BB8';
const LIGHT = '#8BB9E3';

export default function PartnershipTable({ partnerships, playersMap, teamName }) {
  const pships = [...partnerships].sort((a, b) => a.wicket_number - b.wicket_number);

  if (pships.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 border border-slate-200 text-center text-slate-500 text-sm">
        No partnership data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 text-center">
        <span className="text-sm font-semibold tracking-wide text-slate-700">
          {(teamName || 'TEAM').toUpperCase()} — INNINGS
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {pships.map(p => {
          const b1 = playersMap[p.batter1_id]?.name || 'Batter 1';
          const b2 = playersMap[p.batter2_id]?.name || 'Batter 2';
          const r1 = p.batter1_runs || 0;
          const r2 = p.batter2_runs || 0;
          const balls1 = p.batter1_balls || 0;
          const balls2 = p.batter2_balls || 0;
          const total = p.runs || 0;
          const denom = r1 + r2;
          const w1 = denom > 0 ? (r1 / denom) * 100 : 50;
          const w2 = denom > 0 ? (r2 / denom) * 100 : 50;
          const notOut = p.is_active;

          return (
            <div key={p.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
              <div className="text-right">
                <div className="text-sm font-medium text-slate-800">{b1}</div>
                <div className="text-xs text-slate-500">{r1} ({balls1})</div>
              </div>

              <div className="flex flex-col items-center min-w-[120px]">
                <div className="text-base font-bold text-slate-800">{total}{notOut ? '*' : ''}</div>
                <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 mt-1.5">
                  <div style={{ width: `${w1}%`, backgroundColor: DARK }} />
                  <div style={{ width: `${w2}%`, backgroundColor: LIGHT }} />
                </div>
              </div>

              <div className="text-left">
                <div className="text-sm font-medium text-slate-800">{b2}</div>
                <div className="text-xs text-slate-500">{r2} ({balls2})</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}