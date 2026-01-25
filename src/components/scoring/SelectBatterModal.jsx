import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, Circle } from 'lucide-react';

export default function SelectBatterModal({ 
  open, 
  onClose, 
  onSelect,
  availableBatters = [],
  playersMap = {},
  title = 'Select Next Batter'
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {availableBatters.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No batters available
            </div>
          ) : (
            availableBatters.map((batter, index) => (
              <button
                key={batter.player_id}
                onClick={() => {
                  onSelect(batter.player_id);
                  onClose();
                }}
                className="w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-semibold">
                    {playersMap[batter.player_id]?.name || 'Unknown'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}