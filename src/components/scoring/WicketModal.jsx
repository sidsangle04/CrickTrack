import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const DISMISSAL_TYPES = [
{ value: 'bowled', label: 'Bowled', needsFielder: false },
{ value: 'caught', label: 'Caught', needsFielder: true },
{ value: 'lbw', label: 'LBW', needsFielder: false },
{ value: 'run_out', label: 'Run Out', needsFielder: true, needsRunoutEnd: true },
{ value: 'stumped', label: 'Stumped', needsFielder: true },
{ value: 'hit_wicket', label: 'Hit Wicket', needsFielder: false },
{ value: 'retired_hurt', label: 'Retired Hurt', needsFielder: false, noBowlerCredit: true },
{ value: 'retired_out', label: 'Retired Out', needsFielder: false, noBowlerCredit: true }];


export default function WicketModal({
  open,
  onClose,
  onConfirm,
  striker,
  nonStriker,
  strikerName,
  nonStrikerName,
  bowlingTeamPlayers = [],
  playersMap = {}
}) {
  const [step, setStep] = useState(1);
  const [dismissalType, setDismissalType] = useState(null);
  const [playerOutId, setPlayerOutId] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [runoutEnd, setRunoutEnd] = useState(null);
  const [runsBeforeWicket, setRunsBeforeWicket] = useState(0);

  const resetAndClose = () => {
    setStep(1);
    setDismissalType(null);
    setPlayerOutId(null);
    setFielderId(null);
    setRunoutEnd(null);
    setRunsBeforeWicket(0);
    onClose();
  };

  const selectedDismissal = DISMISSAL_TYPES.find((d) => d.value === dismissalType);

  const handleDismissalSelect = (type) => {
    setDismissalType(type);
    const dismissal = DISMISSAL_TYPES.find((d) => d.value === type);

    if (type === 'run_out') {
      setStep(2); // Select who is out
    } else {
      setPlayerOutId(striker);
      if (dismissal?.needsFielder) {
        setStep(3); // Select fielder
      } else {
        handleConfirm(striker, null, type);
      }
    }
  };

  const handlePlayerOutSelect = (playerId, end) => {
    setPlayerOutId(playerId);
    setRunoutEnd(end);
    if (selectedDismissal?.needsFielder) {
      setStep(3);
    } else {
      handleConfirm(playerId, null, dismissalType);
    }
  };

  const handleFielderSelect = (fId) => {
    setFielderId(fId);
    handleConfirm(playerOutId, fId, dismissalType);
  };

  const handleConfirm = (outId, fId, type) => {
    onConfirm({
      wicket_type: type,
      player_out_id: outId,
      fielder_id: fId,
      runout_end: runoutEnd,
      runs_before_wicket: runsBeforeWicket,
      is_run_out: type === 'run_out'
    });
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {step === 1 && 'Dismissal Type'}
            {step === 2 && 'Who is Out?'}
            {step === 3 && 'Select Fielder'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 &&
        <>
            {/* Runs before wicket for run outs */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 block mb-2">Runs completed before wicket</label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((r) =>
              <button
                key={r}
                onClick={() => setRunsBeforeWicket(r)}
                className={`flex-1 py-2 rounded-lg font-bold ${
                runsBeforeWicket === r ?
                'bg-emerald-500 text-white' :
                'bg-slate-800 text-slate-300'}`
                }>

                    {r}
                  </button>
              )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DISMISSAL_TYPES.map((type) =>
            <button
              key={type.value}
              onClick={() => handleDismissalSelect(type.value)}
              className="p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-left transition-colors">

                  <span className="font-semibold">{type.label}</span>
                </button>
            )}
            </div>
          </>
        }

        {step === 2 &&
        <div className="space-y-3">
            <button
            onClick={() => handlePlayerOutSelect(striker, 'striker')}
            className="w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-between">

              <div>
                <span className="font-semibold">{strikerName}</span>
                <span className="text-slate-400 text-sm ml-2">(Striker)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button
            onClick={() => handlePlayerOutSelect(nonStriker, 'non_striker')}
            className="w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-between">

              <div>
                <span className="font-semibold">{nonStrikerName}</span>
                <span className="text-slate-400 text-sm ml-2">(Non-striker)</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        }

        {step === 3 &&
        <div className="max-h-80 overflow-y-auto space-y-2">
            {bowlingTeamPlayers.map((pId) =>
          <button
            key={pId}
            onClick={() => handleFielderSelect(pId)}
            className="w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-between">

                <span className="font-semibold">{playersMap[pId]?.name || 'Unknown'}</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
          )}
          </div>
        }

        <Button
          variant="outline"
          onClick={resetAndClose} className="bg-slate-700 text-slate-50 mt-4 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:bg-accent hover:text-accent-foreground h-9 border-slate-700">


          Cancel
        </Button>
      </DialogContent>
    </Dialog>);

}