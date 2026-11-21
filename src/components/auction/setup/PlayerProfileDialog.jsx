import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  BOWLING_LABELS,
  CATEGORY_LABELS,
  PlayerAvatar,
  ROLE_LABELS
} from '../Shared';

export default function PlayerProfileDialog({ player, open, onOpenChange }) {
  if (!player) return null;
  const rows = [
    { label: 'Age', value: player.age },
    {
      label: 'Batting',
      value:
        player.batting_style === 'left_hand'
          ? 'Left hand'
          : player.batting_style === 'right_hand'
          ? 'Right hand'
          : ''
    },
    { label: 'Bowling', value: BOWLING_LABELS[player.bowling_style] || '' },
    { label: 'Role', value: ROLE_LABELS[player.primary_role] || '' },
    { label: 'Category', value: CATEGORY_LABELS[player.category] || '' },
    { label: 'Experience', value: player.experience || '' }
  ].filter((r) => r.value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{player.name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <PlayerAvatar player={player} size="lg" />
          <div className="min-w-0">
            <p className="text-sm text-white">{player.name}</p>
            <p className="text-xs text-slate-400">
              {CATEGORY_LABELS[player.category] || 'Uncategorised'}
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-3 text-sm">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-white text-right">{r.value}</span>
            </div>
          ))}
          {!rows.length && <p className="text-sm text-slate-500">No extra details recorded.</p>}
        </div>
        {player.signature_url && (
          <div>
            <p className="text-xs text-slate-400 mb-1">Signature</p>
            <img
              src={player.signature_url}
              alt={`${player.name} signature`}
              className="h-16 rounded-lg bg-white/90 p-2 object-contain"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}