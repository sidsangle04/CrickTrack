import React from 'react';
import { Sparkles } from 'lucide-react';
import WinProbabilityBar from './WinProbabilityBar';

function DriverRow({ label, left, right }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-slate-500">{label}</span>
      <span className="flex-1 text-emerald-400">{left}</span>
      <span className="flex-1 text-right text-cyan-400">{right}</span>
    </div>
  );
}

const formText = (f) => (f.played ? `${f.wins}–${f.played - f.wins} (last ${f.played})` : 'No matches yet');

export default function PreMatchPredictionCard({ prediction, team1Name, team2Name, loading }) {
  if (loading && !prediction) {
    return (
      <div className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4 text-sm text-slate-400">
        Working out the win chances…
      </div>
    );
  }
  if (!prediction) return null;

  const d = prediction.drivers;

  return (
    <div className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Win Prediction</h3>
      </div>

      <WinProbabilityBar team1Name={team1Name} team2Name={team2Name} team1Pct={prediction.team1Pct} />

      <div className="mt-3 space-y-1.5 text-xs">
        <DriverRow label="XI rating" left={d.ratings1} right={d.ratings2} />
        <DriverRow label="Bat vs bowl" left={`${d.batting1} v ${d.bowling2}`} right={`${d.batting2} v ${d.bowling1}`} />
        <DriverRow label="Recent form" left={formText(d.form1)} right={formText(d.form2)} />
        <DriverRow
          label="Head-to-head"
          left={d.h2h1 !== null ? d.h2h1 : '—'}
          right={d.h2h2 !== null ? d.h2h2 : '—'}
        />
      </div>

      <p className="mt-3 text-[10px] text-slate-500">
        Built from these players' past matches, their record against this opposition and both teams' recent results.
      </p>
    </div>
  );
}