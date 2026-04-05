import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin, Target, CheckCircle } from 'lucide-react';
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

function getTurfZone(x, y) {
  if (y >= 0) return x < 0 ? 'Front Left' : 'Front Right';
  if (x < -0.3) return 'Back Left';
  if (x > 0.3) return 'Back Right';
  return 'Back Center';
}

// Step 1: Pitch map
// Step 2: Ground map
// Step 3: Outcome + catch drop

export default function VisualTrackingModal({
  open, onClose, onConfirm, runs, isWicket, bowlerType, fieldingTeamPlayers = [], playersMap = {}
}) {
  const [step, setStep] = useState('pitch'); // 'pitch' | 'ground' | 'outcome'
  const [shotData, setShotData] = useState(null);
  const [pitchData, setPitchData] = useState(null);
  const [variation, setVariation] = useState(null);
  const [isCatchDrop, setIsCatchDrop] = useState(false);
  const [droppedBy, setDroppedBy] = useState(null);

  const reset = () => {
    setShotData(null);
    setPitchData(null);
    setVariation(null);
    setIsCatchDrop(false);
    setDroppedBy(null);
    setStep('pitch');
  };

  const handleSubmit = () => {
    const turfZone = shotData ? getTurfZone(shotData.x, shotData.y) : null;
    onConfirm({
      shot_x: shotData?.x,
      shot_y: shotData?.y,
      shot_region: shotData?.region,
      shot_side: shotData?.side,
      shot_distance: shotData?.distance,
      turf_zone: turfZone,
      pitch_x: pitchData?.px,
      pitch_y: pitchData?.py,
      line: pitchData?.line,
      length: pitchData?.length,
      delivery_variation: variation,
      is_catch_drop: isCatchDrop,
      dropped_by: isCatchDrop ? droppedBy : null,
    });
    reset();
  };

  const handleSkip = () => {
    onConfirm({});
    reset();
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

  const stepIndex = { pitch: 0, ground: 1, outcome: 2 };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white p-0 max-w-sm w-full mx-auto [&>button]:hidden">
        <DialogHeader className="px-4 pt-4 pb-2 flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <DialogTitle className="text-base font-semibold">
              {step === 'pitch' ? 'Ball Landing' : step === 'ground' ? 'Shot Location' : 'Delivery Details'}
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
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-all ${
                i <= stepIndex[step] ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="px-4 pb-4">

          {/* Step 1: Pitch Map */}
          {step === 'pitch' && (
            <>
              <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Click where the ball pitched
              </p>
              <div className="flex gap-4 items-start justify-center">
                <PitchMap
                  onPitch={setPitchData}
                  pitchMarks={pitchData ? [{ ...pitchData, runs, is_wicket: isWicket }] : []}
                  width={130}
                  height={290}
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
                <Button variant="outline" onClick={handleSkip} className="flex-1 border-slate-700 text-slate-400 text-sm">
                  Skip All
                </Button>
                <Button
                  onClick={() => setStep('ground')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-sm"
                >
                  {pitchData ? 'Next: Shot →' : 'Skip →'}
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Ground Map */}
          {step === 'ground' && (
            <>
              <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Click where the ball went on the field
              </p>
              <div className="flex justify-center">
                <GroundMap
                  onShot={setShotData}
                  shots={shotData ? [{ ...shotData, runs, is_wicket: isWicket }] : []}
                  size={260}
                />
              </div>

              {shotData && (
                <div className="mt-3 p-2 bg-slate-800 rounded-lg text-xs flex gap-3 flex-wrap">
                  <span className="text-emerald-400 font-medium">{shotData.region}</span>
                  <span className="text-slate-400 capitalize">{shotData.side} side</span>
                  <span className="text-slate-400 capitalize">{getTurfZone(shotData.x, shotData.y)}</span>
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
                <Button variant="outline" onClick={() => setStep('pitch')} className="flex-1 border-slate-700 text-slate-400 text-sm">
                  ← Back
                </Button>
                <Button
                  onClick={() => setStep('outcome')}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-sm"
                >
                  {shotData ? 'Next: Details →' : 'Skip →'}
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Outcome Details + Catch Drop */}
          {step === 'outcome' && (
            <>
              <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Confirm delivery details
              </p>

              {/* Summary */}
              <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 mb-4 space-y-1.5 text-xs">
                {pitchData && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Length</span>
                    <span className="text-emerald-400">{pitchData.length} · {pitchData.line}</span>
                  </div>
                )}
                {shotData && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Zone</span>
                    <span className="text-blue-400">{getTurfZone(shotData.x, shotData.y)} · {shotData.region}</span>
                  </div>
                )}
                {variation && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Variation</span>
                    <span className="text-amber-400 capitalize">{variation.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>

              {/* Catch Drop Toggle */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-2 font-medium">Catch Dropped?</p>
                <button
                  onClick={() => { setIsCatchDrop(!isCatchDrop); setDroppedBy(null); }}
                  className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    isCatchDrop
                      ? 'bg-orange-500/20 border-orange-500/60 text-orange-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {isCatchDrop ? '🫳 Catch Dropped!' : 'No Catch Drop'}
                </button>

                {isCatchDrop && fieldingTeamPlayers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-slate-500 mb-2">Who dropped it?</p>
                    <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                      {fieldingTeamPlayers.map(p => (
                        <button
                          key={p.id}
                          onClick={() => setDroppedBy(p.id === droppedBy ? null : p.id)}
                          className={`px-3 py-2 rounded-lg text-xs text-left border transition-all ${
                            droppedBy === p.id
                              ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('ground')} className="flex-1 border-slate-700 text-slate-400 text-sm">
                  ← Back
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-sm">
                  Save & Continue ✓
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}