import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Swords } from 'lucide-react';
import { useGroundShape } from '@/lib/GroundShapeContext';
import H2HStatCards from '@/components/compare/H2HStatCards';
import DominanceMeter from '@/components/compare/DominanceMeter';
import CoachInsight from '@/components/compare/CoachInsight';

// Dismissal types credited to the bowler (run outs / retirements don't count)
const BOWLER_CREDITED = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'];

export default function PlayerComparison() {
  const [batterId, setBatterId] = useState('');
  const [bowlerId, setBowlerId] = useState('');
  const { mode } = useGroundShape();

  const { data: allPlayers = [], isLoading: playersLoading } = useQuery({
    queryKey: ['all-players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['all-deliveries-analytics'],
    queryFn: () => base44.entities.Delivery.filter({ is_voided: false })
  });

  const { data: allMatches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: () => base44.entities.Match.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });
  const teamsMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t])), [teams]);

  const modeMatchIds = useMemo(() => {
    const s = new Set();
    allMatches.forEach(m => { if ((m.ground_mode || 'turf') === mode) s.add(m.id); });
    return s;
  }, [allMatches, mode]);

  const modePlayers = useMemo(
    () => allPlayers.filter(p => (p.ground_mode || 'turf') === mode),
    [allPlayers, mode]
  );

  const modeDeliveries = useMemo(
    () => allDeliveries.filter(d => modeMatchIds.has(d.match_id)),
    [allDeliveries, modeMatchIds]
  );

  // Sort candidates so players who have actually batted/bowled appear first
  const batterCandidates = useMemo(() => {
    const batted = new Set(modeDeliveries.map(d => d.striker_id));
    return [...modePlayers].sort((a, b) => (batted.has(b.id) ? 1 : 0) - (batted.has(a.id) ? 1 : 0));
  }, [modePlayers, modeDeliveries]);

  const bowlerCandidates = useMemo(() => {
    const bowled = new Set(modeDeliveries.map(d => d.bowler_id));
    return [...modePlayers].sort((a, b) => (bowled.has(b.id) ? 1 : 0) - (bowled.has(a.id) ? 1 : 0));
  }, [modePlayers, modeDeliveries]);

  const batter = modePlayers.find(p => p.id === batterId);
  const bowler = modePlayers.find(p => p.id === bowlerId);

  const h2h = useMemo(() => {
    if (!batterId || !bowlerId) return null;
    const d = modeDeliveries.filter(x => x.striker_id === batterId && x.bowler_id === bowlerId);
    if (d.length === 0) return { empty: true };

    const ballsFaced = d.filter(x => !x.is_wide).length;
    const legalBalls = d.filter(x => x.is_legal_delivery !== false).length;
    const runsBat = d.reduce((s, x) => s + (x.runs_bat || 0), 0);
    const conceded = d.reduce((s, x) =>
      s + (x.runs_total || 0) - (x.bye_runs || 0) - (x.leg_bye_runs || 0) - (x.penalty_runs || 0), 0);
    const dots = d.filter(x => (x.runs_total || 0) === 0 && !x.is_wicket).length;
    const fours = d.filter(x => (x.runs_bat || 0) === 4).length;
    const sixes = d.filter(x => (x.runs_bat || 0) === 6).length;
    const wkts = d.filter(x => x.is_wicket && x.player_out_id === batterId && BOWLER_CREDITED.includes(x.wicket_type));
    const matches = new Set(d.map(x => x.match_id)).size;

    const strikeRate = ballsFaced > 0 ? (runsBat / ballsFaced) * 100 : 0;
    const economy = legalBalls > 0 ? (conceded / legalBalls) * 6 : 0;
    const boundaryPct = ballsFaced > 0 ? ((fours + sixes) / ballsFaced) * 100 : 0;
    const dotPct = ballsFaced > 0 ? (dots / ballsFaced) * 100 : 0;

    // Weighted duel score: every run (plus boundary bonuses) banks points for
    // the batter; every dot ball banks points for the bowler, and a dismissal
    // is worth roughly 25 runs of dominance.
    const batterPoints = runsBat + fours * 2 + sixes * 4;
    const bowlerPoints = wkts.length * 25 + dots * 1.5;
    const total = batterPoints + bowlerPoints;
    const batterShare = total > 0 ? (batterPoints / total) * 100 : 50;
    const verdict = batterShare >= 60 ? 'batter' : batterShare <= 40 ? 'bowler' : 'even';

    return {
      empty: false,
      matches, ballsFaced, legalBalls, runsBat, conceded, dots, fours, sixes,
      wickets: wkts.length, wicketTypes: wkts.map(x => x.wicket_type),
      strikeRate, economy, boundaryPct, dotPct, batterShare, verdict
    };
  }, [batterId, bowlerId, modeDeliveries]);

  if (playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Batter vs Bowler</h1>
        <p className="text-slate-400 text-sm">Who's winning the duel? Pick a batter and a bowler to see every ball they've faced off.</p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-400">Batter</span>
          </div>
          <Select value={batterId} onValueChange={setBatterId}>
            <SelectTrigger className="bg-slate-800 border-emerald-500/40 text-white">
              <SelectValue placeholder="Select a batter" />
            </SelectTrigger>
            <SelectContent>
              {batterCandidates.filter(p => p.id !== bowlerId).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {teamsMap[p.team_id]?.short_name || '?'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-sm text-slate-400">Bowler</span>
          </div>
          <Select value={bowlerId} onValueChange={setBowlerId}>
            <SelectTrigger className="bg-slate-800 border-rose-500/40 text-white">
              <SelectValue placeholder="Select a bowler" />
            </SelectTrigger>
            <SelectContent>
              {bowlerCandidates.filter(p => p.id !== batterId).map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — {teamsMap[p.team_id]?.short_name || '?'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(!batterId || !bowlerId) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Swords className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Set up the duel</h3>
          <p className="text-slate-400 text-sm">Choose a batter and a bowler to see who has dominated their match-up.</p>
        </div>
      )}

      {h2h?.empty && batter && bowler && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Swords className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No head-to-head yet</h3>
          <p className="text-slate-400 text-sm max-w-md">
            {batter.name} has never faced {bowler.name} with the bat in {mode === 'circular' ? 'Circular' : 'TURF'} mode.
            Score or import a match between their teams and the duel will appear here.
          </p>
        </div>
      )}

      {h2h && !h2h.empty && batter && bowler && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-emerald-400">{batter.name}</div>
              <div className="text-xs text-slate-400">{teamsMap[batter.team_id]?.name || 'Unknown Team'}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{batter.role?.replace('_', ' ')}</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-rose-400">{bowler.name}</div>
              <div className="text-xs text-slate-400">{teamsMap[bowler.team_id]?.name || 'Unknown Team'}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{bowler.role?.replace('_', ' ')}</div>
            </div>
          </div>

          <H2HStatCards h2h={h2h} batterName={batter.name} bowlerName={bowler.name} />
          <DominanceMeter share={h2h.batterShare} batterName={batter.name} bowlerName={bowler.name} />
          <CoachInsight h2h={h2h} batterName={batter.name} bowlerName={bowler.name} />
        </>
      )}
    </div>
  );
}