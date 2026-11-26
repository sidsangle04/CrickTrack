import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeftRight, Plus, Trophy, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddTeamModal from '@/components/tournament/AddTeamModal';
import { Panel, PlayerAvatar, TeamBadge } from '../Shared';
import SoldCardPhotoButton from './SoldCardPhotoButton';
import SoldCard3D from './SoldCard3D';
import { teamFinance } from '@/lib/auction/squad';
import swapSquadPlayer from '@/lib/squadSwap';
import ReplacePlayerDialog from '@/components/squad/ReplacePlayerDialog';
import AddExtraPlayerDialog from '@/components/squad/AddExtraPlayerDialog';

export default function AuctionResults({ teams, players, settings, tournament }) {
  const queryClient = useQueryClient();
  // The sold card opened by tapping a player in a squad.
  const [card, setCard] = useState(null);
  // Team added by hand once the auction was over.
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [addedTeam, setAddedTeam] = useState('');
  // Player being swapped out of a squad after the auction.
  const [replacing, setReplacing] = useState(null);
  // Team taking on a backup player — no squad slot, no purse.
  const [addingExtra, setAddingExtra] = useState(null);

  const rows = teams.map((team) => ({
    team,
    finance: teamFinance({ teamId: team.id, players, settings })
  }));
  const topBuys = players
    .filter((p) => p.status === 'sold' && p.category !== 'icon' && !p.is_extra)
    .sort((a, b) => (b.sold_price || 0) - (a.sold_price || 0))
    .slice(0, 5);

  const replacePlayer = async (choice) => {
    const { team, player } = replacing;
    await swapSquadPlayer({
      tournamentId: tournament?.id,
      mode: tournament?.ground_mode || 'turf',
      team: { id: team.team_id || '', auctionTeamId: team.id },
      outgoing: {
        playerId: player.player_id,
        auctionPlayerId: player.id,
        sold_price: player.sold_price,
        category: player.category
      },
      incoming: choice
    });
    setReplacing(null);
    queryClient.invalidateQueries({ queryKey: ['auction', tournament?.id] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['team-players'] });
  };

  const addExtraPlayer = async ({ name, role }) => {
    const { team } = addingExtra;
    let teamId = team.team_id || '';
    if (!teamId && tournament?.id) {
      const rows = await base44.entities.Team.filter({
        tournament_id: tournament.id,
        name: team.name
      });
      teamId = rows[0]?.id || '';
    }
    if (!teamId) return;

    const player = await base44.entities.Player.create({
      name,
      role,
      team_id: teamId,
      ground_mode: tournament?.ground_mode || 'turf',
      tournament_id: tournament?.id || '',
      is_extra: true
    });
    await base44.entities.AuctionPlayer.create({
      tournament_id: tournament?.id || '',
      name,
      player_id: player.id,
      primary_role: role,
      category: 'gold',
      bowl: 'none',
      is_extra: true,
      status: 'sold',
      sold_to_team_id: team.id,
      sold_price: 0
    });
    queryClient.invalidateQueries({ queryKey: ['auction', tournament?.id] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['team-players'] });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-slate-900 border border-emerald-500/40 p-5 text-center">
        <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-white">Auction complete</h2>
        <p className="text-sm text-slate-300">
          {teams.length} teams ·{' '}
          {players.filter((p) => p.sold_to_team_id && !p.is_extra).length} players signed
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Tap any player to open their sold card — use ⇄ to replace them, + to add a backup
        </p>
        {tournament && (
          <Button
            onClick={() => setShowAddTeam(true)}
            size="sm"
            className="mt-3 bg-slate-900/70 text-emerald-300 hover:bg-slate-900 border border-emerald-500/40"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add a team
          </Button>
        )}
        {addedTeam && (
          <p className="text-[11px] text-emerald-300 mt-2">
            {addedTeam} added to the tournament — open the tournament's Teams tab to see the squad.
          </p>
        )}
      </div>

      {topBuys.length > 0 && (
        <Panel title="Biggest buys">
          <div className="space-y-1.5">
            {topBuys.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <PlayerAvatar player={p} size="sm" />
                <span className="text-sm text-white truncate flex-1">{p.name}</span>
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {p.sold_price}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {rows.map(({ team, finance }) => (
          <Panel key={team.id}>
            <div className="flex items-center gap-3 mb-3">
              <TeamBadge team={team} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{team.name}</p>
                <p className="text-[11px] text-slate-400">
                  {finance.counted.length}/{finance.target} players · spent {finance.spent} · left{' '}
                  {finance.purseLeft}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddingExtra({ team })}
                title="Add an extra backup player — no squad slot, no purse"
                className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-700/50"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              {finance.squad.map((p) => {
                const sale = { player: p, team, price: p.category === 'icon' ? 0 : p.sold_price };
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setCard(sale)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setCard(sale)}
                    title="Open this player's sold card"
                    className="flex items-center justify-between gap-2 text-xs border-b border-slate-700/40 last:border-0 py-1 -mx-1 px-1 rounded cursor-pointer hover:bg-slate-700/30 transition-colors"
                  >
                    <span className="text-slate-200 truncate flex-1 min-w-0">
                      {p.name}
                      {p.category === 'icon' && (
                        <span className="text-[9px] uppercase text-purple-300 ml-1">icon</span>
                      )}
                      {p.is_extra && (
                        <span className="text-[9px] uppercase text-sky-300 ml-1">extra</span>
                      )}
                    </span>
                    <span className="text-slate-400 tabular-nums shrink-0 w-16 text-right">
                      {p.is_extra ? 'EXTRA' : p.category === 'icon' ? 'ICON' : p.sold_price || 0}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReplacing({ team, player: p });
                      }}
                      title="Replace this player"
                      className="shrink-0 p-1 rounded text-slate-400 hover:text-emerald-300 hover:bg-slate-700/50"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                    <SoldCardPhotoButton sale={sale} />
                  </div>
                );
              })}
              {finance.squad.length === 0 && (
                <p className="text-xs text-slate-500">No players.</p>
              )}
            </div>
          </Panel>
        ))}
      </div>

      {card && <SoldCard3D sale={card} onDone={() => setCard(null)} />}

      <ReplacePlayerDialog
        open={!!replacing}
        onOpenChange={(v) => !v && setReplacing(null)}
        teamName={replacing?.team?.name}
        outgoing={replacing?.player}
        candidates={
          replacing
            ? players
                .filter((p) => !p.sold_to_team_id && p.id !== replacing.player.id)
                .map((p) => ({
                  key: p.id,
                  name: p.name,
                  photo_url: p.photo_url,
                  role: p.primary_role,
                  playerId: p.player_id,
                  auctionPlayerId: p.id,
                  note: p.status === 'unsold' ? 'Unsold' : 'Free'
                }))
            : []
        }
        onConfirm={replacePlayer}
      />

      <AddExtraPlayerDialog
        open={!!addingExtra}
        onOpenChange={(v) => !v && setAddingExtra(null)}
        teamName={addingExtra?.team?.name}
        onConfirm={addExtraPlayer}
      />

      {tournament && (
        <AddTeamModal
          open={showAddTeam}
          onOpenChange={setShowAddTeam}
          tournament={tournament}
          onSaved={(result) => {
            setAddedTeam(result?.team?.name || 'Team');
            queryClient.invalidateQueries(['tournament', tournament.id]);
            queryClient.invalidateQueries(['teams']);
            queryClient.invalidateQueries(['players']);
          }}
        />
      )}
    </div>
  );
}