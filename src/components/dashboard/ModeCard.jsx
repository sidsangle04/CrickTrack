import React from 'react';
import { Link } from 'react-router-dom';
import { useGroundShape } from '@/lib/GroundShapeContext';
import { ArrowRight, Circle, Square } from 'lucide-react';

export default function ModeCard({ modeLabel }) {
  const { setMode } = useGroundShape();

  const option = (active) =>
    `flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
      active
        ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
        : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-white'
    }`;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Scoring mode</h2>
      <p className="mt-2 text-sm text-slate-300">
        {modeLabel ? `You're set up for ${modeLabel} cricket.` : 'Pick a format to start scoring.'}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setMode('turf')} className={option(modeLabel === 'TURF')}>
          <Square className="h-4 w-4" />
          TURF
        </button>
        <button type="button" onClick={() => setMode('circular')} className={option(modeLabel === 'Standard')}>
          <Circle className="h-4 w-4" />
          Standard
        </button>
      </div>

      {modeLabel && (
        <Link
          to="/Home"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 transition-all hover:gap-3">
          Enter CrickTrack
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}