import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Check, Loader2, PlayCircle, Shuffle, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Panel, PlayerAvatar, TeamBadge } from '../Shared';
import {
  assignmentsFor,
  inBowl,
  nextDrawTurn,
  orderedTeams,
  pickRandom,
  remainingInBowl
} from '@/lib/auction/draw';

const BOWL_LABEL = { bowl1: 'Bowl 1', bowl2: 'Bowl 2' };

export default function DrawBoard({
  auction,
  teams,
  players,
  draws,
  refresh,
  canEditBowls,
  onChangeBowls,
  onStartAuction
}) {
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [reselection, setReselection] = useState(null);
  const [error, setError] = useState('');

  const order = orderedTeams(teams);
  const turn = nextDrawTurn({ auction, teams });
  const assignments = assignmentsFor({ players, teams });
  const drawn = (bowl) => inBowl(players, bowl).filter((p) => p.sold_to_team_id).length;

  const draw = async () => {
    if (!turn.team || busy) return;
    setBusy(true);
    setError('');
    try {
      const player = pickRandom(remainingInBowl(players, turn.bowl));
      if (!player) {
        setError(`No players left in ${BOWL_LABEL[turn.bowl]}.`);
        return;
      }
      await base44.entities.AuctionPlayer.update(player.id, {
        sold_to_team_id: turn.team.id,
        sold_price: 0,
        status: 'sold'
      });
      await base44.entities.AuctionIconDraw.create({
        tournament_id: auction.tournament_id,
        team_id: turn.team.id,
        team_name: turn.team.name,
        player_id: player.id,
        player_name: player.name,
        bowl: turn.bowl,
        action: 'assigned'
      });
      let round = auction.draw_round || 1;
      let index = (auction.draw_index || 0) + 1;
      if (index >= order.length) {
        round += 1;
        index = 0;
      }
      await base44.entities.Auction.update(auction.id, { draw_round: round, draw_index: index });
      setReveal({ team: turn.team, player, bowl: turn.bowl, at: Date.now() });
      refresh && refresh();
    } catch (e) {
      setError(e?.message || 'Could not draw a player.');
    } finally {
      setBusy(false);
    }
  };

  const confirmReselection = async () => {
    if (!reselection || busy) return;
    const { team, bowl, player } = reselection;
    setBusy(true);
    setError('');
    try {
      const replacement = pickRandom(
        players.filter(
          (p) => p.category === 'icon' && p.bowl === bowl && !p.sold_to_team_id && p.id !== player.id
        )
      );
      if (!replacement) {
        setError(`No players left in ${BOWL_LABEL[bowl]} to swap in.`);
        setReselection(null);
        return;
      }
      await base44.entities.AuctionPlayer.update(player.id, {
        sold_to_team_id: '',
        sold_price: 0,
        status: 'available'
      });
      await base44.entities.AuctionPlayer.update(replacement.id, {
        sold_to_team_id: team.id,
        sold_price: 0,
        status: 'sold'
      });
      await base44.entities.AuctionIconDraw.create({
        tournament_id: auction.tournament_id,
        team_id: team.id,
        team_name: team.name,
        player_id: replacement.id,
        player_name: replacement.name,
        bowl,
        action: 'replaced',
        replaced_player_id: player.id,
        replaced_player_name: player.name
      });
      setReveal({ team, player: replacement, bowl, at: Date.now() });
      setReselection(null);
      refresh && refresh();
    } catch (e) {
      setError(e?.message || 'Could not re-select the player.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {['bowl1', 'bowl2'].map((bowl) => (
          <div
            key={bowl}
            className="rounded-2xl border border-slate-700/70 bg-slate-800/50 p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                {BOWL_LABEL[bowl]}
              </p>
              <span className="text-sm font-bold text-white tabular-nums">
                {drawn(bowl)} / {teams.length}
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${teams.length ? (drawn(bowl) / teams.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {turn.done ? (
        <Panel>
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Both bowls are drawn</h3>
            <p className="text-sm text-slate-400 mb-4">
              Every team has one icon player from each bowl. Start the auction when you are ready.
            </p>
            <Button onClick={onStartAuction} className="bg-emerald-500 hover:bg-emerald-600">
              <PlayCircle className="w-4 h-4 mr-2" /> Continue to the auction
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 p-5">
          <p className="text-[11px] uppercase tracking-widest text-slate-400 mb-3 text-center">
            {BOWL_LABEL[turn.bowl]} · draw {turn.index + 1} of {order.length}
          </p>
          <div className="flex flex-col items-center gap-3">
            <TeamBadge team={turn.team} size="xl" />
            <div className="text-center">
              <p className="text-lg font-bold text-white">{turn.team?.name}</p>
              <p className="text-xs text-slate-400">
                {turn.team?.owner_name || 'Team'} draws one icon player
              </p>
            </div>
            <Button
              onClick={draw}
              disabled={busy}
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-base font-bold px-8"
            >
              {busy ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Shuffle className="w-5 h-5 mr-2" />
              )}
              Draw from {BOWL_LABEL[turn.bowl]}
            </Button>
          </div>
        </div>
      )}

      {reveal && (
        <motion.div
          key={reveal.at}
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-4 flex items-center gap-4"
        >
          <PlayerAvatar player={reveal.player} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-emerald-400">
              {BOWL_LABEL[reveal.bowl]} pick
            </p>
            <p className="text-xl font-bold text-white truncate">{reveal.player.name}</p>
            <p className="text-sm text-slate-300">joins {reveal.team.name}</p>
          </div>
          <TeamBadge team={reveal.team} size="lg" />
        </motion.div>
      )}

      <Panel
        title="Assignments"
        action={
          canEditBowls && !turn.done ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeBowls}
              className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5" /> Edit bowls
            </Button>
          ) : null
        }
      >
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {assignments.map(({ team, bowl1, bowl2 }) => (
            <div
              key={team.id}
              className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3"
              style={{ borderLeft: `4px solid ${team.color || '#10b981'}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <TeamBadge team={team} size="sm" />
                <p className="text-sm font-semibold text-white truncate">{team.name}</p>
              </div>
              {[
                { bowl: 'bowl1', player: bowl1 },
                { bowl: 'bowl2', player: bowl2 }
              ].map(({ bowl, player }) => (
                <div key={bowl} className="flex items-center gap-2 py-1">
                  <span className="text-[10px] uppercase text-slate-500 w-9 shrink-0">
                    {bowl === 'bowl1' ? 'B1' : 'B2'}
                  </span>
                  {player ? (
                    <>
                      <p className="text-xs text-white truncate flex-1">{player.name}</p>
                      <button
                        onClick={() => setReselection({ team, bowl, player })}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 shrink-0 inline-flex items-center gap-1"
                        title="Re-select this player"
                      >
                        <ArrowLeftRight className="w-3 h-3" /> Re-select
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 flex-1">Not drawn yet</p>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>

      {draws.length > 0 && (
        <Panel title="Draw history">
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {draws.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 text-xs text-slate-300 py-1 border-b border-slate-700/40 last:border-0"
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    d.action === 'replaced'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {d.action}
                </span>
                <span className="truncate flex-1">
                  <strong className="text-white">{d.player_name}</strong> → {d.team_name}
                  {d.replaced_player_name && (
                    <span className="text-slate-500"> (replaced {d.replaced_player_name})</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {BOWL_LABEL[d.bowl] || d.bowl}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Dialog open={!!reselection} onOpenChange={(open) => !open && setReselection(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Replace this icon player?</DialogTitle>
          </DialogHeader>
          {reselection && (
            <div className="text-sm text-slate-300 space-y-2">
              <p>
                <strong className="text-white">{reselection.player.name}</strong> will go back into{' '}
                {BOWL_LABEL[reselection.bowl]}, and{' '}
                <strong className="text-white">{reselection.team.name}</strong> will be given a random
                replacement from the players still in that bowl.
              </p>
              <p className="text-amber-400">
                The current assignment will be replaced. This cannot be undone.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReselection(null)} className="text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={confirmReselection}
              disabled={busy}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirm replacement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}