import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeftRight, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { PlayerAvatar, TeamBadge, ROLE_LABELS } from '@/components/auction/Shared';
import PlayerPicker from '@/components/players/PlayerPicker';
import ReplacePlayerDialog from '@/components/squad/ReplacePlayerDialog';
import swapSquadPlayer from '@/lib/squadSwap';

// The players in one tournament team — and the place to pull more in from the
// Players section.
export default function TeamSquadDialog({ team, tournament, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  // The player being swapped out of this squad.
  const [replacing, setReplacing] = useState(null);
  const mode = tournament?.ground_mode || team?.ground_mode || 'turf';

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['team-players', team?.id],
    queryFn: () => base44.entities.Player.filter({ team_id: team.id }),
    enabled: !!open && !!team?.id
  });

  // Backup players sit in the same squad as everyone else — they are simply
  // listed after the signed squad so the two groups stay easy to read.
  const signed = players.filter((p) => !p.is_extra);
  const extras = players.filter((p) => p.is_extra);
  const ordered = [...signed, ...extras];

  const { data: freePlayers = [] } = useQuery({
    queryKey: ['free-players', mode],
    queryFn: () => base44.entities.Player.list('-created_date', 500),
    enabled: !!open
  });

  const candidates = useMemo(
    () =>
      freePlayers
        .filter((p) => (p.ground_mode || 'turf') === mode)
        .filter((p) => !p.team_id)
        .filter((p) => !p.tournament_id || p.tournament_id === tournament?.id)
        .map((p) => ({
          key: p.id,
          name: p.name,
          photo_url: p.photo_url,
          role: p.role,
          playerId: p.id,
          auctionPlayerId: '',
          note: 'Free'
        })),
    [freePlayers, mode, tournament?.id]
  );

  const replacePlayer = async (choice) => {
    await swapSquadPlayer({
      tournamentId: tournament?.id,
      mode,
      team: { id: team.id },
      outgoing: { playerId: replacing.id },
      incoming: choice
    });
    setReplacing(null);
    queryClient.invalidateQueries({ queryKey: ['team-players', team.id] });
    queryClient.invalidateQueries({ queryKey: ['free-players', mode] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['auction', tournament?.id] });
  };

  const addPlayers = async (chosen) => {
    if (!chosen.length) return;
    await base44.entities.Player.bulkCreate(
      chosen.map((p) => {
        const record = {
          name: p.name,
          photo_url: p.photo_url || '',
          role: p.role || 'batsman',
          batting_style: p.batting_style || 'right_hand',
          bowling_style: p.bowling_style || 'none',
          is_captain: !!p.is_captain,
          is_wicket_keeper: !!p.is_wicket_keeper || p.role === 'wicket_keeper',
          team_id: team.id,
          ground_mode: mode,
          tournament_id: tournament?.id || ''
        };
        if (p.jersey_number != null) record.jersey_number = p.jersey_number;
        return record;
      })
    );
    queryClient.invalidateQueries({ queryKey: ['team-players', team.id] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
  };

  return (
    <>
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

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button
              onClick={() => setPickerOpen(true)}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-600 self-start"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> Add players
            </Button>
            <span className="text-[11px] text-slate-400">
              {signed.length} in squad
              {extras.length ? ` · ${extras.length} extra` : ''}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">
              No players in this team yet — add them from the Players section.
            </p>
          ) : (
            <div className="divide-y divide-slate-700/40">
              {ordered.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2">
                  <span className="text-[11px] text-slate-500 w-5 tabular-nums">{i + 1}</span>
                  <PlayerAvatar player={p} size="sm" className="!w-8 !h-8" />
                  <span className="text-sm text-white truncate flex-1">
                    {p.name}
                    {p.is_extra && (
                      <span className="text-[9px] uppercase text-sky-300 ml-1">extra</span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {ROLE_LABELS[p.role] || 'Player'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplacing(p)}
                    title="Replace this player"
                    className="shrink-0 p-1.5 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-700/50"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PlayerPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={mode}
        tournamentId={tournament?.id}
        excludeIds={players.map((p) => p.id)}
        title={`Add players to ${team?.name || 'this team'}`}
        onConfirm={addPlayers}
      />

      <ReplacePlayerDialog
        open={!!replacing}
        onOpenChange={(v) => !v && setReplacing(null)}
        teamName={team?.name}
        outgoing={replacing}
        candidates={candidates}
        onConfirm={replacePlayer}
      />
    </>
  );
}