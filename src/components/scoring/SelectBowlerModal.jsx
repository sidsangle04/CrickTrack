import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronRight, AlertTriangle } from 'lucide-react';

export default function SelectBowlerModal({ 
  open, 
  onClose, 
  onSelect,
  bowlingTeamPlayers = [],
  bowlerStats = {},
  playersMap = {},
  maxOversPerBowler,
  lastBowlerId,
  title = 'Select Bowler'
}) {
  const getOversDisplay = (playerId) => {
    const stats = bowlerStats[playerId];
    if (!stats) return '0.0';
    return `${stats.overs}.${stats.balls % 6}`;
  };

  const canBowl = (playerId) => {
    if (!maxOversPerBowler) return true;
    const stats = bowlerStats[playerId];
    if (!stats) return true;
    return stats.overs < maxOversPerBowler;
  };

  const isLastBowler = (playerId) => playerId === lastBowlerId;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {bowlingTeamPlayers.map(playerId => {
            const player = playersMap[playerId];
            const stats = bowlerStats[playerId];
            const canBowlNow = canBowl(playerId);
            const isLast = isLastBowler(playerId);
            
            return (
              <button
                key={playerId}
                onClick={() => {
                  if (canBowlNow && !isLast) {
                    onSelect(playerId);
                    onClose();
                  }
                }}
                disabled={!canBowlNow || isLast}
                className={`w-full p-4 rounded-xl flex items-center justify-between transition-colors ${
                  !canBowlNow || isLast
                    ? 'bg-slate-800/50 opacity-50 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <span className="font-semibold block">
                      {player?.name || 'Unknown'}
                    </span>
                    {stats && (
                      <span className="text-sm text-slate-400">
                        {stats.wickets}-{stats.runs_conceded} ({getOversDisplay(playerId)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isLast && (
                    <span className="text-xs text-amber-400 bg-amber-400/20 px-2 py-1 rounded">
                      Last Over
                    </span>
                  )}
                  {!canBowlNow && (
                    <span className="text-xs text-red-400 bg-red-400/20 px-2 py-1 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Max Overs
                    </span>
                  )}
                  {canBowlNow && !isLast && (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}