import React from 'react';
import { Undo2 } from 'lucide-react';

export default function ScoringKeypad({ 
  onScore, 
  onExtra, 
  onWicket, 
  onUndo,
  disabled = false 
}) {
  const runButtons = [0, 1, 2, 3, 4, 5, 6];
  
  return (
    <div className="bg-slate-900 border-t border-slate-800 p-4 pb-8">
      {/* Run Buttons */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {runButtons.map(runs => (
          <button
            key={runs}
            onClick={() => onScore(runs)}
            disabled={disabled}
            className={`
              aspect-square rounded-2xl text-2xl font-bold transition-all active:scale-95
              ${runs === 4 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : ''}
              ${runs === 6 ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : ''}
              ${runs === 0 ? 'bg-slate-800 text-slate-400' : ''}
              ${[1, 2, 3, 5].includes(runs) ? 'bg-slate-700 text-white' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {runs === 0 ? '•' : runs}
          </button>
        ))}
      </div>
      
      {/* Extra Buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => onExtra('wide')}
          disabled={disabled}
          className="py-4 rounded-xl bg-amber-500/20 text-amber-400 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          Wide
        </button>
        <button
          onClick={() => onExtra('no_ball')}
          disabled={disabled}
          className="py-4 rounded-xl bg-amber-500/20 text-amber-400 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          No Ball
        </button>
        <button
          onClick={() => onExtra('bye')}
          disabled={disabled}
          className="py-4 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          Bye
        </button>
        <button
          onClick={() => onExtra('leg_bye')}
          disabled={disabled}
          className="py-4 rounded-xl bg-slate-800 text-slate-300 font-semibold text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          Leg Bye
        </button>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onWicket}
          disabled={disabled}
          className="py-4 rounded-xl bg-red-500 text-white font-bold text-lg shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          WICKET
        </button>
        <button
          onClick={onUndo}
          disabled={disabled}
          className="py-4 rounded-xl bg-slate-800 text-slate-300 font-semibold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Undo2 className="w-5 h-5" />
          Undo
        </button>
      </div>
    </div>
  );
}