import React from 'react';
import WinProbabilityBar from './WinProbabilityBar';

// Slim strip under the live score header.
export default function LivePredictionStrip({ prediction, team1Name, team2Name, insight }) {
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
      </div>
    </div>
  );
}