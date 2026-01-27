import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ExtrasModal({ 
  open, 
  onClose, 
  onConfirm,
  extraType,
  matchConfig = {}
}) {
  const [additionalRuns, setAdditionalRuns] = useState(0);
  const [includeWide, setIncludeWide] = useState(false);
  
  useEffect(() => {
    if (open) {
      setAdditionalRuns(0);
      setIncludeWide(false);
    }
  }, [open, extraType]);
  
  const baseRuns = extraType === 'wide' 
    ? (matchConfig.wide_runs || 1) 
    : extraType === 'no_ball' 
    ? (matchConfig.no_ball_runs || 1)
    : 0;
  
  const wideRuns = includeWide ? (matchConfig.wide_runs || 1) : 0;
  const totalRuns = baseRuns + additionalRuns + wideRuns;
  
  const handleConfirm = () => {
    onConfirm({
      extra_type: extraType,
      additional_runs: additionalRuns,
      total_runs: totalRuns,
      include_wide: includeWide
    });
    setAdditionalRuns(0);
    setIncludeWide(false);
    onClose();
  };

  const getTitle = () => {
    switch(extraType) {
      case 'wide': return 'Wide';
      case 'no_ball': return 'No Ball';
      case 'bye': return 'Byes';
      case 'leg_bye': return 'Leg Byes';
      default: return 'Extra';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-white">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {(extraType === 'wide' || extraType === 'no_ball') && (
          <div className="text-center mb-4">
            <span className="text-slate-300 text-sm">Base: {baseRuns} run(s)</span>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm text-slate-300 block mb-2 text-center">
            {extraType === 'bye' || extraType === 'leg_bye' 
              ? 'Runs taken' 
              : 'Additional runs scored'}
          </label>
          <div className="flex gap-2 justify-center flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6].map(r => (
              <button
                key={r}
                onClick={() => setAdditionalRuns(r)}
                className={`w-11 h-11 rounded-xl font-bold text-lg transition-colors ${
                  additionalRuns === r 
                    ? r === 4 ? 'bg-blue-500 text-white' : r === 6 ? 'bg-purple-500 text-white' : 'bg-emerald-500 text-white' 
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {extraType === 'no_ball' && (
          <div className="mb-4">
            <button
              onClick={() => setIncludeWide(!includeWide)}
              className={`w-full p-3 rounded-xl font-semibold transition-colors ${
                includeWide 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              + Wide (+{matchConfig.wide_runs || 1} run)
            </button>
          </div>
        )}

        {(extraType === 'wide' || extraType === 'no_ball') && (
          <div className="text-center mb-4 p-3 rounded-lg bg-slate-800">
            <span className="text-slate-300">Total: </span>
            <span className="text-2xl font-bold text-white">{totalRuns}</span>
            <span className="text-slate-300"> run(s)</span>
            {includeWide && extraType === 'no_ball' && (
              <div className="text-xs text-amber-400 mt-1">(No Ball + Wide)</div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 border-slate-600 text-white hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}