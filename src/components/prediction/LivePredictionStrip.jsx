import React from 'react';
import WinProbabilityBar from './WinProbabilityBar';

// Slim strip under the live score header.
export default function LivePredictionStrip({ prediction, team1Name, team2Name, insight, venuePar }) {
  if (!prediction) return null;

  return (
    <div className="px-4 pb-3">
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-2.5">
        <WinProbabilityBar
          team1Name={team1Name}
          team2Name={team2Name}
          team1Pct={prediction.team1Pct}
          why={prediction.why}
          insight={insight}
          compact
        />
        {venuePar && (
          <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase tracking-wide">
              Venue par
            </span>
            <span className="text-xs text-white font-bold">{venuePar.average}</span>
            <span className="text-[11px] text-slate-500">
              avg 1st-innings score · {venuePar.count} match{venuePar.count === 1 ? '' : 'es'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}