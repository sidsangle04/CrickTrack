import React from 'react';
import WinProbabilityBar from './WinProbabilityBar';

// How far the numbers may drift before the written explanation is treated as
// out of date and dropped — the sentence must never contradict the bar.
const INSIGHT_DRIFT = 6;

export default function LivePredictionStrip({ prediction, team1Name, team2Name, insight, venuePar }) {
  if (!prediction) return null;

  const stale = insight?.text &&
    insight.battingPct != null &&
    prediction.battingPct != null &&
    Math.abs(prediction.battingPct - insight.battingPct) > INSIGHT_DRIFT;

  return (
    <div className="px-4 pb-3">
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/70 px-3 py-2.5">
        <WinProbabilityBar
          team1Name={team1Name}
          team2Name={team2Name}
          team1Pct={prediction.team1Pct}
          why={prediction.why}
          insight={stale ? null : insight?.text}
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