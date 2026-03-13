import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BOWLING_TYPES = [
  { key: 'pace_fast', label: 'Fast', icon: '🔥', type: 'pace', sub: 'fast' },
  { key: 'pace_medium', label: 'Medium Fast', icon: '💨', type: 'pace', sub: 'medium_fast' },
  { key: 'off_spin', label: 'Off Spin', icon: '🌀', type: 'spin', sub: 'off_spin' },
  { key: 'leg_spin', label: 'Leg Spin', icon: '🌀', type: 'spin', sub: 'leg_spin' },
];

export default function BowlerProfileModal({ open, bowlerName, onConfirm }) {
  const [hand, setHand] = useState(null);
  const [bowlingKey, setBowlingKey] = useState(null);

  const selectedType = BOWLING_TYPES.find(t => t.key === bowlingKey);

  // Auto-classify Chinaman
  const getLabel = () => {
    if (!selectedType) return null;
    if (hand === 'left' && selectedType.sub === 'leg_spin') return 'Chinaman (Left-arm Wrist Spin)';
    return selectedType.label;
  };

  const handleConfirm = () => {
    if (!hand || !selectedType) return;
    onConfirm({
      hand,
      type: selectedType.type,
      sub_type: selectedType.sub,
      label: getLabel(),
    });
    setHand(null);
    setBowlingKey(null);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center">Bowler Profile</DialogTitle>
          {bowlerName && <p className="text-center text-slate-400 text-sm mt-1">{bowlerName}</p>}
        </DialogHeader>

        <div className="space-y-4">
          {/* Hand */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Bowling Hand</p>
            <div className="grid grid-cols-2 gap-2">
              {['right', 'left'].map(h => (
                <button
                  key={h}
                  onClick={() => setHand(h)}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                    hand === h
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-emerald-500/50'
                  }`}
                >
                  {h === 'right' ? '🤜' : '🤛'} {h} Arm
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium">Bowling Type</p>
            <div className="grid grid-cols-2 gap-2">
              {BOWLING_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setBowlingKey(t.key)}
                  className={`py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    bowlingKey === t.key
                      ? 'bg-amber-500 border-amber-500 text-black'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-amber-500/50'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chinaman hint */}
          {hand === 'left' && bowlingKey === 'leg_spin' && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 text-center">
              🎯 Auto-classified as Chinaman
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={!hand || !bowlingKey}
            className="w-full bg-emerald-500 hover:bg-emerald-600"
          >
            Confirm &amp; Start Over
          </Button>

          <Button
            variant="ghost"
            onClick={() => onConfirm(null)}
            className="w-full text-slate-500 text-sm"
          >
            Skip (no profile)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}