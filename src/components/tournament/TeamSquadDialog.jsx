import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { TeamBadge, ROLE_LABELS } from '@/components/auction/Shared';

// The players in one tournament team.
export default function TeamSquadDialog({ team, open, onOpenChange }) {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['team-players', team?.id],
    queryFn: () => base44.entities.Player.filter({ team_id: team.id }),
    enabled: !!open && !!team?.id
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <TeamBadge
              team={{ name: team?.name, color: team?.primary_color, logo_url: team?.logo_url }}
              size="md"
            />
            <span className="truncate">{team?.name}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : players.length === 0 ? (
          <p className="text-sm text-slate-400 py-4">No players in this team yet.</p>
        ) : (
          <div className="divide-y divide-slate-700/40">
            {players.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <span className="text-[11px] text-slate-500 w-5 tabular-nums">{i + 1}</span>
                <span className="text-sm text-white truncate flex-1">{p.name}</span>
                <span className="text-[11px] text-slate-400 shrink-0">
                  {ROLE_LABELS[p.role] || 'Player'}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}