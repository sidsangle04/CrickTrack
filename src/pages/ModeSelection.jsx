import React from 'react';
import { useGroundShape } from '@/lib/GroundShapeContext';
import { Square, Circle, ChevronRight } from 'lucide-react';

const LOGO_URL = 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

export default function ModeSelection() {
  const { setMode } = useGroundShape();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-10">
        <img
          src={LOGO_URL}
          alt="CrickTrack"
          className="h-16 w-auto mx-auto mb-4 rounded-xl shadow-lg bg-slate-950 p-1.5"
        />
        <h1 className="text-3xl font-bold text-white tracking-tight">CrickTrack</h1>
        <p className="text-slate-400 text-sm mt-1">Tag | Analyse | Elevate</p>
        <p className="text-slate-300 text-sm mt-4">Choose your format to begin</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 max-w-3xl w-full">
        {/* TURF card */}
        <button
          onClick={() => setMode('turf')}
          className="group relative overflow-hidden rounded-3xl p-8 text-left bg-gradient-to-br from-emerald-500/15 to-emerald-700/5 border border-emerald-500/30 hover:border-emerald-400/60 transition-all hover:scale-[1.02]"
        >
          <div className="absolute -right-6 -top-6 opacity-20 text-emerald-400 group-hover:opacity-40 transition-opacity">
            <Square className="w-40 h-40" strokeWidth={1} />
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mb-5">
              <Square className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">TURF</h2>
            <p className="text-sm text-slate-300 mb-1">Rectangular ground scoring</p>
            <p className="text-xs text-slate-400 mb-6">Leather, tape &amp; tennis cricket with full analytics.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400 group-hover:gap-2.5 transition-all">
              Enter TURF <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </button>

        {/* Standard (circular) card */}
        <button
          onClick={() => setMode('circular')}
          className="group relative overflow-hidden rounded-3xl p-8 text-left bg-gradient-to-br from-cyan-500/15 to-cyan-700/5 border border-cyan-500/30 hover:border-cyan-400/60 transition-all hover:scale-[1.02]"
        >
          <div className="absolute -right-6 -top-6 opacity-20 text-cyan-400 group-hover:opacity-40 transition-opacity">
            <Circle className="w-40 h-40" strokeWidth={1} />
          </div>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mb-5">
              <Circle className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1.5">Standard</h2>
            <p className="text-sm text-slate-300 mb-1">Standard ground scoring</p>
            <p className="text-xs text-slate-400 mb-6">General cricket on a circular field, standard fielding zones.</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 group-hover:gap-2.5 transition-all">
              Enter Standard <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mt-10 text-center max-w-md">
        Each mode keeps its own teams, players, matches and stats. You can switch modes anytime from the header.
      </p>
    </div>
  );
}