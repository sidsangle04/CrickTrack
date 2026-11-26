import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gavel, Loader2, Settings, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useAuctionData from '@/hooks/useAuctionData';
import { Button } from '@/components/ui/button';
import AuctionSetup from '@/components/auction/AuctionSetup';
import IconDraft from '@/components/auction/IconDraft';
import LiveAuction from '@/components/auction/LiveAuction';
import { createPageUrl } from '../utils';
import { iconCountFor } from '@/lib/auction/draw';

const STATUS_STYLES = {
  setup: 'bg-slate-500/20 text-slate-300',
  draft: 'bg-purple-500/20 text-purple-300',
  auction: 'bg-emerald-500/20 text-emerald-300',
  paused: 'bg-amber-500/20 text-amber-300',
  completed: 'bg-blue-500/20 text-blue-300'
};

const STATUS_LABELS = {
  setup: 'Setup',
  draft: 'Icon draft',
  auction: 'Live auction',
  paused: 'Paused',
  completed: 'Completed'
};

export default function Auction() {
  const urlParams = new URLSearchParams(window.location.search);
  const tournamentId = urlParams.get('tournamentId') || '';
  const { auction, teams, players, bids, draws, tournament, loading, refresh } =
    useAuctionData(tournamentId);
  const [view, setView] = useState(null);

  if (!tournamentId) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 mb-4">Open a tournament and choose Auction to get started.</p>
        <Link to={createPageUrl('Tournaments')}>
          <Button className="bg-emerald-500 hover:bg-emerald-600">Go to tournaments</Button>
        </Link>
      </div>
    );
  }

  if (loading || !auction) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const running = ['auction', 'paused', 'completed'].includes(auction.status);
  const icons = iconCountFor(auction);
  const rawStage = running ? auction.status : view || auction.status;
  // A tournament with no icon players goes straight to the bidding.
  const stage = rawStage === 'draft' && !icons ? 'setup' : rawStage;

  const startStage = async (status) => {
    await base44.entities.Auction.update(auction.id, {
      status,
      current_player_id: '',
      current_bid: 0,
      current_bidder_team_id: ''
    });
    setView(null);
    refresh(['state']);
  };

  return (
    <div className="pb-24 md:pb-6">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Link
          to={createPageUrl('Tournaments')}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          title="Back to tournaments"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white truncate flex items-center gap-2">
            <Gavel className="w-5 h-5 text-emerald-400 shrink-0" />
            Auction
          </h1>
          <p className="text-xs text-slate-400 truncate">
            {tournament?.name || 'Tournament'} · {teams.length} teams · {players.length} players
          </p>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            STATUS_STYLES[auction.status] || STATUS_STYLES.setup
          }`}
        >
          {STATUS_LABELS[auction.status] || auction.status}
        </span>
      </div>

      {!running && (
        <div className="flex items-center gap-1.5 mb-4">
          <button
            onClick={() => setView('setup')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              stage === 'setup'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Setup
          </button>
          {icons > 0 && (
            <button
              onClick={() => setView('draft')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                stage === 'draft'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Icon draft
            </button>
          )}
        </div>
      )}

      {stage === 'setup' && (
        <AuctionSetup
          auction={auction}
          teams={teams}
          players={players}
          tournament={tournament}
          refresh={refresh}
          onStart={startStage}
        />
      )}

      {stage === 'draft' && (
        <IconDraft
          auction={auction}
          teams={teams}
          players={players}
          draws={draws}
          refresh={refresh}
          onStartAuction={() => startStage('auction')}
        />
      )}

      {running && (
        <LiveAuction
          auction={auction}
          teams={teams}
          players={players}
          bids={bids}
          refresh={refresh}
          tournament={tournament}
        />
      )}
    </div>
  );
}