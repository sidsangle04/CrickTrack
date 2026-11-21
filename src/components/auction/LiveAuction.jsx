import React, { useState } from 'react';
import {
  Gavel,
  Loader2,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  UserPlus
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Panel } from './Shared';
import { auctionTotals, bidProblem, teamFinance } from '@/lib/auction/squad';
import { nextBidAmount } from '@/lib/auction/bidding';
import CurrentPlayerCard from './live/CurrentPlayerCard';
import TeamBidCard from './live/TeamBidCard';
import BidHistory from './live/BidHistory';
import SquadBoard from './live/SquadBoard';
import NominateModal from './live/NominateModal';
import BigScreen from './live/BigScreen';
import AuctionResults from './live/AuctionResults';
import SettingsPanel from './setup/SettingsPanel';

export default function LiveAuction({ auction, teams, players, bids, refresh }) {
  const [nominateOpen, setNominateOpen] = useState(false);
  const [actingTeamId, setActingTeamId] = useState('');
  const [bigScreen, setBigScreen] = useState(false);
  const [flash, setFlash] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmFinal, setConfirmFinal] = useState(false);

  const completed = auction.status === 'completed';
  const paused = auction.status === 'paused';
  const currentPlayer = players.find((p) => p.id === auction.current_player_id) || null;
  const bidderTeam = teams.find((t) => t.id === auction.current_bidder_team_id) || null;
  const nextAmount = nextBidAmount(auction.current_bid, auction);
  const totals = auctionTotals({ teams, players, settings: auction });
  const unsoldCount = players.filter((p) => p.status === 'unsold').length;

  const showFlash = (payload) => {
    const at = Date.now();
    setFlash({ ...payload, at });
    setTimeout(() => setFlash((f) => (f && f.at === at ? null : f)), 4200);
  };

  const updateAuction = (data) => base44.entities.Auction.update(auction.id, data);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      refresh && refresh();
    } catch (e) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const placeBid = (teamId) =>
    run(async () => {
      if (!currentPlayer) return;
      const finance = teamFinance({ teamId, players, settings: auction });
      const problem = bidProblem({ amount: nextAmount, finance });
      if (problem) {
        setError(problem);
        return;
      }
      const team = teams.find((t) => t.id === teamId);
      await base44.entities.AuctionBid.create({
        tournament_id: auction.tournament_id,
        player_id: currentPlayer.id,
        player_name: currentPlayer.name,
        team_id: teamId,
        team_name: team?.name || '',
        amount: nextAmount
      });
      await updateAuction({ current_bid: nextAmount, current_bidder_team_id: teamId });
    });

  const nominate = (player) =>
    run(async () => {
      setNominateOpen(false);
      await updateAuction({
        current_player_id: player.id,
        current_bid: 0,
        current_bidder_team_id: ''
      });
    });

  const markSold = () =>
    run(async () => {
      if (!currentPlayer || !auction.current_bidder_team_id) return;
      await base44.entities.AuctionPlayer.update(currentPlayer.id, {
        status: 'sold',
        sold_to_team_id: auction.current_bidder_team_id,
        sold_price: auction.current_bid
      });
      await updateAuction({
        current_player_id: '',
        current_bid: 0,
        current_bidder_team_id: ''
      });
      showFlash({
        type: 'sold',
        player: currentPlayer,
        team: bidderTeam,
        price: auction.current_bid
      });
    });

  const markUnsold = () =>
    run(async () => {
      if (!currentPlayer) return;
      await base44.entities.AuctionPlayer.update(currentPlayer.id, {
        status: 'unsold',
        sold_to_team_id: '',
        sold_price: 0
      });
      await updateAuction({
        current_player_id: '',
        current_bid: 0,
        current_bidder_team_id: ''
      });
      showFlash({ type: 'unsold', player: currentPlayer });
    });

  const reopenUnsold = () =>
    run(() =>
      base44.entities.AuctionPlayer.updateMany(
        { tournament_id: auction.tournament_id, status: 'unsold' },
        { $set: { status: 'available' } }
      )
    );

  const togglePause = () => run(() => updateAuction({ status: paused ? 'auction' : 'paused' }));

  const finalise = () =>
    run(async () => {
      if (!totals.allComplete) {
        setConfirmFinal(true);
        return;
      }
      await updateAuction({ status: 'completed' });
    });

  const overrideFinalise = () =>
    run(async () => {
      setConfirmFinal(false);
      await updateAuction({ status: 'completed' });
    });

  if (completed) {
    return (
      <div className="space-y-4">
        <AuctionResults teams={teams} players={players} settings={auction} />
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => updateAuction({ status: 'auction' }).then(() => refresh && refresh())}
            className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reopen the auction
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-3 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              paused ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {paused ? 'Paused' : 'Live'}
          </span>
          <Select
            value={actingTeamId || 'all'}
            onValueChange={(v) => setActingTeamId(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-slate-950 border-slate-700 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="all">Auctioneer · all teams</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  Bidding as {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={togglePause}
          className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
        >
          {paused ? <Play className="w-4 h-4 mr-1.5" /> : <Pause className="w-4 h-4 mr-1.5" />}
          {paused ? 'Resume' : 'Pause'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBigScreen(true)}
          className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
        >
          <Maximize2 className="w-4 h-4 mr-1.5" /> Big screen
        </Button>
        <Button
          size="sm"
          onClick={finalise}
          disabled={busy}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
        >
          <Trophy className="w-4 h-4 mr-1.5" /> Finalise
        </Button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {paused && <SettingsPanel auction={auction} refresh={refresh} />}

      {flash && !bigScreen && (
        <div
          className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${
            flash.type === 'sold' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {flash.type === 'sold'
            ? `SOLD · ${flash.player?.name} to ${flash.team?.name} for ${flash.price}`
            : `UNSOLD · ${flash.player?.name}`}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3 order-2 lg:order-1">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">
            Teams · purse & squad
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {teams.map((team) => {
              const finance = teamFinance({ teamId: team.id, players, settings: auction });
              const blocked = paused
                ? 'Paused'
                : !currentPlayer
                ? 'No player'
                : actingTeamId && actingTeamId !== team.id
                ? 'Not bidding'
                : bidProblem({ amount: nextAmount, finance });
              return (
                <TeamBidCard
                  key={team.id}
                  team={team}
                  finance={finance}
                  nextAmount={nextAmount}
                  isHighest={auction.current_bidder_team_id === team.id}
                  blocked={blocked}
                  onBid={placeBid}
                />
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 order-1 lg:order-2 space-y-3">
          <CurrentPlayerCard
            player={currentPlayer}
            bid={auction.current_bid}
            bidderTeam={bidderTeam}
            nextAmount={nextAmount}
            onNominate={() => setNominateOpen(true)}
            locked={paused || busy}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              onClick={() => setNominateOpen(true)}
              disabled={paused || busy || !!currentPlayer}
              variant="outline"
              className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> Nominate
            </Button>
            <Button
              onClick={markSold}
              disabled={paused || busy || !bidderTeam}
              className="bg-emerald-500 hover:bg-emerald-600 font-bold"
            >
              <Gavel className="w-4 h-4 mr-1.5" /> Sold
            </Button>
            <Button
              onClick={markUnsold}
              disabled={paused || busy || !currentPlayer}
              variant="outline"
              className="border-slate-700 bg-slate-950 text-red-300 hover:bg-slate-800"
            >
              Unsold
            </Button>
            <Button
              onClick={reopenUnsold}
              disabled={paused || busy || !unsoldCount}
              variant="outline"
              className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Unsold ({unsoldCount})
            </Button>
          </div>

          <Panel>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {totals.rows.filter((r) => r.finance.complete).length} of {teams.length} teams at
                full squad
              </span>
              <span>Squad size {auction.required_squad_size || 8}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{
                  width: `${
                    teams.length
                      ? (totals.rows.filter((r) => r.finance.complete).length / teams.length) * 100
                      : 0
                  }%`
                }}
              />
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-3 order-3 space-y-3">
          <BidHistory bids={bids} teams={teams} playerId={currentPlayer?.id} />
          <SquadBoard teams={teams} players={players} settings={auction} />
        </div>
      </div>

      <NominateModal
        open={nominateOpen}
        onOpenChange={setNominateOpen}
        players={players}
        onNominate={nominate}
      />

      {bigScreen && (
        <BigScreen
          auction={auction}
          players={players}
          teams={teams}
          flash={flash}
          onClose={() => setBigScreen(false)}
        />
      )}

      <Dialog open={confirmFinal} onOpenChange={setConfirmFinal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Not every team is complete</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-300 space-y-2">
            {totals.shortfall.map(({ team, finance }) => (
              <p key={team.id}>
                <strong className="text-white">{team.name}</strong> has {finance.squad.length} of{' '}
                {finance.target} players.
              </p>
            ))}
            <p className="text-amber-400">
              Finalising now closes the auction with these squads as they are.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmFinal(false)} className="text-slate-300">
              Keep bidding
            </Button>
            <Button
              onClick={overrideFinalise}
              disabled={busy}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trophy className="w-4 h-4 mr-2" />
              )}
              Finalise anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}