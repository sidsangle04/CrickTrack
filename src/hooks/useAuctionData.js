import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DEFAULT_SETTINGS } from '@/lib/auction/bidding';

// Which slice of the auction screen each entity touches, so a single bid only
// reloads what it changed instead of the whole screen.
const PARTS = ['state', 'teams', 'players', 'bids', 'draws'];

const TOUCHED_BY = {
  Auction: ['state'],
  AuctionTeam: ['teams'],
  AuctionPlayer: ['players'],
  AuctionBid: ['bids'],
  AuctionIconDraw: ['draws']
};

// Everything the auction screens need, kept in one place and refreshed live.
export default function useAuctionData(tournamentId) {
  const queryClient = useQueryClient();
  const creating = useRef(false);

  const key = ['auction', tournamentId];

  const auctionQuery = useQuery({
    queryKey: [...key, 'state'],
    queryFn: async () => {
      const list = await base44.entities.Auction.filter(
        { tournament_id: tournamentId },
        '-created_date',
        1
      );
      return list[0] || null;
    },
    enabled: !!tournamentId
  });

  // First visit sets the auction up with the default rules.
  useEffect(() => {
    if (!tournamentId || auctionQuery.isLoading || creating.current) return;
    if (auctionQuery.data) return;
    creating.current = true;
    base44.entities.Auction.create({
      tournament_id: tournamentId,
      status: 'setup',
      ...DEFAULT_SETTINGS
    })
      .then(() => queryClient.invalidateQueries({ queryKey: key }))
      .finally(() => {
        creating.current = false;
      });
  }, [tournamentId, auctionQuery.isLoading, auctionQuery.data]);

  const teamsQuery = useQuery({
    queryKey: [...key, 'teams'],
    queryFn: () => base44.entities.AuctionTeam.filter({ tournament_id: tournamentId }),
    enabled: !!tournamentId
  });

  const playersQuery = useQuery({
    queryKey: [...key, 'players'],
    queryFn: () => base44.entities.AuctionPlayer.filter({ tournament_id: tournamentId }),
    enabled: !!tournamentId
  });

  const bidsQuery = useQuery({
    queryKey: [...key, 'bids'],
    queryFn: () =>
      base44.entities.AuctionBid.filter({ tournament_id: tournamentId }, '-created_date', 200),
    enabled: !!tournamentId
  });

  const drawsQuery = useQuery({
    queryKey: [...key, 'draws'],
    queryFn: () =>
      base44.entities.AuctionIconDraw.filter({ tournament_id: tournamentId }, '-created_date', 200),
    enabled: !!tournamentId
  });

  const tournamentQuery = useQuery({
    queryKey: ['tournament', tournamentId],
    queryFn: () => base44.entities.Tournament.get(tournamentId),
    enabled: !!tournamentId
  });

  // Live updates for every auction screen (organiser, owners, big display).
  // Events arrive in bursts (a bid writes the bid row and then the auction), so
  // they are gathered for a moment and reloaded once per slice.
  useEffect(() => {
    if (!tournamentId) return undefined;
    const pending = new Set();
    let timer = null;
    const flush = () => {
      timer = null;
      const parts = [...pending];
      pending.clear();
      parts.forEach((part) => queryClient.invalidateQueries({ queryKey: [...key, part] }));
    };
    const queue = (parts) => {
      parts.forEach((part) => pending.add(part));
      if (!timer) timer = setTimeout(flush, 600);
    };
    const unsubs = Object.entries(TOUCHED_BY).map(([name, parts]) =>
      base44.entities[name].subscribe(() => queue(parts))
    );
    return () => {
      if (timer) clearTimeout(timer);
      unsubs.forEach((u) => u && u());
    };
  }, [tournamentId]);

  const teams = [...(teamsQuery.data || [])].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  );

  return {
    auction: auctionQuery.data || null,
    teams,
    players: playersQuery.data || [],
    bids: bidsQuery.data || [],
    draws: drawsQuery.data || [],
    tournament: tournamentQuery.data || null,
    loading:
      auctionQuery.isLoading ||
      teamsQuery.isLoading ||
      playersQuery.isLoading ||
      tournamentQuery.isLoading,
    refresh: (parts) => {
      const targets = Array.isArray(parts) && parts.length ? parts : PARTS;
      targets.forEach((part) => queryClient.invalidateQueries({ queryKey: [...key, part] }));
    }
  };
}