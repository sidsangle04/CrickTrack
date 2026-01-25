import React, { useState } from 'react';
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
  
  const baseRuns = extraType === 'wide' 
    ? (matchConfig.wide_runs || 1) 
    : extraType === 'no_ball' 
    ? (matchConfig.no_ball_runs || 1)
    : 0;
  
  const totalRuns = baseRuns + additionalRuns;
  
  const handleConfirm = () => {
    onConfirm({
      extra_type: extraType,
      additional_runs: additionalRuns,
      total_runs: totalRuns
    });
    setAdditionalRuns(0);
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
          <DialogTitle className="text-xl font-bold text-center">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {(extraType === 'wide' || extraType === 'no_ball') && (
          <div className="text-center mb-4">
            <span className="text-slate-400 text-sm">Base: {baseRuns} run(s)</span>
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm text-slate-400 block mb-2 text-center">
            {extraType === 'bye' || extraType === 'leg_bye' 
              ? 'Runs taken' 
              : 'Additional runs taken'}
          </label>
          <div className="flex gap-2 justify-center">
            {[0, 1, 2, 3, 4].map(r => (
              <button
                key={r}
                onClick={() => setAdditionalRuns(r)}
                className={`w-12 h-12 rounded-xl font-bold text-lg ${
                  additionalRuns === r 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {(extraType === 'wide' || extraType === 'no_ball') && (
          <div className="text-center mb-4 p-3 rounded-lg bg-slate-800">
            <span className="text-slate-400">Total: </span>
            <span className="text-2xl font-bold text-white">{totalRuns}</span>
            <span className="text-slate-400"> run(s)</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1 border-slate-700 text-slate-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}