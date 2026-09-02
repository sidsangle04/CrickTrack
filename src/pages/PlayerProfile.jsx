import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Loader2, BarChart2, Zap, Target } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroundShape } from '@/lib/GroundShapeContext';
import ProfileHeader from '@/components/profile/ProfileHeader';
import OverviewTab from '@/components/profile/OverviewTab';
import BattingTab from '@/components/profile/BattingTab';
import BowlingTab from '@/components/profile/BowlingTab';

export default function PlayerProfile() {
  const { mode, groundShape } = useGroundShape();
  const playerId = new URLSearchParams(window.location.search).get('playerId');

  const { data: player, isLoading: playerLoading, isError: playerError } = useQuery({
    queryKey: ['player-profile', playerId],
    queryFn: () => base44.entities.Player.get(playerId),
    enabled: !!playerId,
  });
  const { data: teams = [] } = useQuery({
    queryKey: ['teams-analytics'],
    queryFn: () => base44.entities.Team.list(),
  });
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players-analytics'],
    queryFn: () => base44.entities.Player.list(),
  });
  const { data: matches = [] } = useQuery({
    queryKey: ['matches-analytics', mode],
    queryFn: () => base44.entities.Match.list('-created_date', 500),
  });
  const { data: batterInnings = [] } = useQuery({
    queryKey: ['batter-innings-profile', playerId],
    queryFn: () => base44.entities.BatterInnings.filter({ player_id: playerId }),
    enabled: !!playerId,
  });
  const { data: bowlerInnings = [] } = useQuery({
    queryKey: ['bowler-innings-profile', playerId],
    queryFn: () => base44.entities.BowlerInnings.filter({ player_id: playerId }),
    enabled: !!playerId,
  });
  const { data: strikerDeliveries = [] } = useQuery({
    queryKey: ['striker-deliveries-profile', playerId],
    queryFn: () => base44.entities.Delivery.filter({ striker_id: playerId }, '-created_date', 500),
    enabled: !!playerId,
  });
  const { data: bowlerDeliveries = [] } = useQuery({
    queryKey: ['bowler-deliveries-profile', playerId],
    queryFn: () => base44.entities.Delivery.filter({ bowler_id: playerId }, '-created_date', 500),
    enabled: !!playerId,
  });
  const { data: partnerships = [] } = useQuery({
    queryKey: ['partnerships-profile', playerId],
    queryFn: () => base44.entities.Partnership.list(),
    enabled: !!playerId,
  });

  // Strict mode isolation: only data from matches in the active ground mode.
  const modeMatchIds = useMemo(() => {
    const s = new Set();
    matches.forEach(m => { if ((m.ground_mode || 'turf') === mode) s.add(m.id); });
    return s;
  }, [matches, mode]);

  const scopedBatterInnings = useMemo(() => batterInnings.filter(b => modeMatchIds.has(b.match_id)), [batterInnings, modeMatchIds]);
  const scopedBowlerInnings = useMemo(() => bowlerInnings.filter(b => modeMatchIds.has(b.match_id)), [bowlerInnings, modeMatchIds]);
  const scopedStrikerDeliveries = useMemo(() => strikerDeliveries.filter(d => modeMatchIds.has(d.match_id)), [strikerDeliveries, modeMatchIds]);
  const scopedBowlerDeliveries = useMemo(() => bowlerDeliveries.filter(d => modeMatchIds.has(d.match_id)), [bowlerDeliveries, modeMatchIds]);
  const scopedPartnerships = useMemo(
    () => partnerships
      .filter(p => modeMatchIds.has(p.match_id) && (p.batter1_id === playerId || p.batter2_id === playerId))
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 5),
    [partnerships, modeMatchIds, playerId]
  );

  const matchIds = useMemo(() => {
    const s = new Set();
    scopedBatterInnings.forEach(b => s.add(b.match_id));
    scopedBowlerInnings.forEach(b => s.add(b.match_id));
    return s;
  }, [scopedBatterInnings, scopedBowlerInnings]);

  const teamsMap = useMemo(() => teams.reduce((a, t) => ({ ...a, [t.id]: t }), {}), [teams]);
  const playersMap = useMemo(() => allPlayers.reduce((a, p) => ({ ...a, [p.id]: p }), {}), [allPlayers]);
  const team = player ? teamsMap[player.team_id] : null;

  if (!playerId) {
    return (
      <div className="pb-24 md:pb-6">
        <Link to={createPageUrl('Players')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Players
        </Link>
        <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 text-center text-slate-500 text-sm">
          No player selected. Pick a player from the Players directory.
        </div>
      </div>
    );
  }

  if (playerLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (playerError || !player) {
    return (
      <div className="pb-24 md:pb-6">
        <Link to={createPageUrl('Players')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Players
        </Link>
        <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 text-center text-slate-500 text-sm">
          Player not found.
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6">
      <Link to={createPageUrl('Players')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Players
      </Link>

      <ProfileHeader player={player} team={team} matchCount={matchIds.size} />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full bg-slate-800/50 p-1 rounded-xl mb-5">
          <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs">
            <BarChart2 className="w-3.5 h-3.5 mr-1" />Overview
          </TabsTrigger>
          <TabsTrigger value="batting" className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs">
            <Zap className="w-3.5 h-3.5 mr-1" />Batting
          </TabsTrigger>
          <TabsTrigger value="bowling" className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs">
            <Target className="w-3.5 h-3.5 mr-1" />Bowling
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            batterInnings={scopedBatterInnings}
            bowlerInnings={scopedBowlerInnings}
            partnerships={scopedPartnerships}
            playersMap={playersMap}
          />
        </TabsContent>

        <TabsContent value="batting">
          <BattingTab
            strikerDeliveries={scopedStrikerDeliveries}
            batterInnings={scopedBatterInnings}
            groundShape={groundShape}
          />
        </TabsContent>

        <TabsContent value="bowling">
          <BowlingTab
            bowlerDeliveries={scopedBowlerDeliveries}
            bowlerInnings={scopedBowlerInnings}
            groundShape={groundShape}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}