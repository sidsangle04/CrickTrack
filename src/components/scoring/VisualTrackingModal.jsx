import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin, Target } from 'lucide-react';
import GroundMap, { classifyShot } from './GroundMap';
import PitchMap, { classifyPitch } from './PitchMap';

const SPIN_VARIATIONS = [
  { key: 'googly', label: 'Googly' },
  { key: 'doosra', label: 'Doosra' },
  { key: 'carrom', label: 'Carrom' },
  { key: 'top_spinner', label: 'Top Spin' },
  { key: 'slider', label: 'Slider' },
  { key: 'arm_ball', label: 'Arm Ball' },
];

const PACE_VARIATIONS = [
  { key: 'inswinger', label: 'Inswing' },
  { key: 'outswinger', label: 'Outswing' },
  { key: 'reverse_swing', label: 'Reverse' },
  { key: 'leg_cutter', label: 'Leg Cut' },
  { key: 'off_cutter', label: 'Off Cut' },
  { key: 'slower_ball', label: 'Slower' },
  { key: 'knuckleball', label: 'Knuckle' },
];

export default function VisualTrackingModal({ open, onClose, onConfirm, runs, isWicket, bowlerType }) {
  const [step, setStep] = useState('ground'); // 'ground' | 'pitch'
  const [shotData, setShotData] = useState(null);
  const [pitchData, setPitchData] = useState(null);
  const [variation, setVariation] = useState(null);

  const handleGroundClick = (data) => {
    setShotData(data);
  };

  const handlePitchClick = (data) => {
    setPitchData(data);
  };

  const handleNext = () => {
    if (step === 'ground') setStep('pitch');
  };

  const handleSubmit = () => {
    onConfirm({
      shot_x: shotData?.x,
      shot_y: shotData?.y,
      shot_region: shotData?.region,
      shot_side: shotData?.side,
      shot_distance: shotData?.distance,
      pitch_x: pitchData?.px,
      pitch_y: pitchData?.py,
      line: pitchData?.line,
      length: pitchData?.length,
      delivery_variation: variation,
    });
    // reset
    setShotData(null);
    setPitchData(null);
    setVariation(null);
    setStep('ground');
  };

  const handleSkip = () => {
    onConfirm({});
    setShotData(null);
    setPitchData(null);
    setVariation(null);
    setStep('ground');
  };

  const variations = bowlerType === 'spin' ? SPIN_VARIATIONS : PACE_VARIATIONS;

  const getRunLabel = () => {
    if (isWicket) return 'W';
    if (runs === 4) return '4';
    if (runs === 6) return '6';
    return runs?.toString() || '0';
  };

  const getRunColor = () => {
    if (isWicket) return 'bg-red-500/20 text-red-400 border-red-500/40';
    if (runs === 4 || runs === 6) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    return 'bg-slate-700/50 text-slate-300 border-slate-600';
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white p-0 max-w-sm w-full mx-auto [&>button]:hidden">
        <DialogHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-base font-semibold">
              {step === 'ground' ? 'Shot Location' : 'Ball Landing'}
            </DialogTitle>
            <span className={`px-2 py-0.5 rounded border text-sm font-bold ${getRunColor()}`}>
              {getRunLabel()}
            </span>
          </div>
          <button onClick={handleSkip} className="text-slate-500 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-2 px-4 mb-2">
          <div className={`flex-1 h-1 rounded-full transition-all ${step === 'ground' || step === 'pitch' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          <div className={`flex-1 h-1 rounded-full transition-all ${step === 'pitch' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
        </div>

        <div className="px-4 pb-4">
          {step === 'ground' && (
            <>
              <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Click where the ball went on the field
              </p>
              <div className="flex justify-center">
                <GroundMap
                  onShot={handleGroundClick}
                  shots={shotData ? [{ ...shotData, runs, is_wicket: isWicket }] : []}
                  size={260}
                />
              </div>

              {shotData && (
                <div className="mt-3 p-2 bg-slate-800 rounded-lg text-xs flex gap-3 flex-wrap">
                  <span className="text-emerald-400 font-medium">{shotData.region}</span>
                  <span className="text-slate-400 capitalize">{shotData.side} side</span>
                  <span className="text-slate-400 capitalize">{shotData.distance}</span>
                </div>
              )}

              {/* Variations */}
              {bowlerType && (
                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-2">Variation (optional)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {variations.map(v => (
                      <button
                        key={v.key}
                        onClick={() => setVariation(variation === v.key ? null : v.key)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          variation === v.key
                            ? 'bg-amber-500 border-amber-500 text-black'
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-amber-500/50'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={handleSkip} className="flex-1 border-slate-700 text-slate-400 text-sm">
                  Skip
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!shotData}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-sm"
                >
                  Next: Pitch Map →
                </Button>
              </div>
            </>
          )}

          {step === 'pitch' && (
            <>
              <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Click where the ball pitched
              </p>
              <div className="flex gap-4 items-start justify-center">
                <PitchMap
                  onPitch={handlePitchClick}
                  pitchMarks={pitchData ? [{ ...pitchData, runs, is_wicket: isWicket }] : []}
                  width={130}
                  height={300}
                />

                {pitchData && (
                  <div className="flex flex-col gap-2 justify-center pt-12">
                    <div className="p-2 bg-slate-800 rounded-lg text-xs">
                      <div className="text-slate-400 mb-0.5">Length</div>
                      <div className="text-emerald-400 font-medium">{pitchData.length}</div>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg text-xs">
                      <div className="text-slate-400 mb-0.5">Line</div>
                      <div className="text-blue-400 font-medium">{pitchData.line}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setStep('ground')} className="flex-1 border-slate-700 text-slate-400 text-sm">
                  ← Back
                </Button>
                <Button
                  onClick={pitchData ? handleSubmit : handleSkip}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-sm"
                >
                  {pitchData ? 'Save & Continue' : 'Skip & Continue'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}