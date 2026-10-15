import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeftRight } from 'lucide-react';
import { useGroundShape } from '@/lib/GroundShapeContext';
import PlayerSearchSelect from '@/components/compare/PlayerSearchSelect';
import H2HStatCards from '@/components/compare/H2HStatCards';
import DominanceMeter from '@/components/compare/DominanceMeter';
import CoachInsight from '@/components/compare/CoachInsight';
import CareerCompare from '@/components/compare/CareerCompare';
import CareerTotals from '@/components/compare/CareerTotals';
import HeadToHeadSection from '@/components/compare/HeadToHeadSection';
import HeadToHeadVerdict from '@/components/compare/HeadToHeadVerdict';
import { buildHeadToHead } from '@/lib/headToHead';

// Dismissal types credited to the bowler (run outs / retirements don't count)
const BOWLER_CREDITED = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'];

export default function PlayerComparison() {
  const [playerAId, setPlayerAId] = useState('');
  const [playerBId, setPlayerBId] = useState('');
  const { mode } = useGroundShape();

  const { data: allPlayers = [], isLoading: playersLoading } = useQuery({
    queryKey: ['all-players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['all-deliveries-analytics'],
    queryFn: () => base44.entities.Delivery.filter({ is_voided: false })
  });

  const { data: allBatterInnings = [] } = useQuery({
    queryKey: ['all-batter-analytics'],
    queryFn: () => base44.entities.BatterInnings.list()
  });

  const { data: allBowlerInnings = [] } = useQuery({
    queryKey: ['all-bowler-analytics'],
    queryFn: () => base44.entities.BowlerInnings.list()
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

  const modeMatches = useMemo(
    () => allMatches.filter(m => (m.ground_mode || 'turf') === mode),
    [allMatches, mode]
  );

  const modePlayers = useMemo(
    () => allPlayers.filter(p => (p.ground_mode || 'turf') === mode),
    [allPlayers, mode]
  );

  const modeDeliveries = useMemo(
    () => allDeliveries.filter(d => modeMatchIds.has(d.match_id)),
    [allDeliveries, modeMatchIds]
  );

  const modeBatterInnings = useMemo(
    () => allBatterInnings.filter(b => modeMatchIds.has(b.match_id)),
    [allBatterInnings, modeMatchIds]
  );

  const modeBowlerInnings = useMemo(
    () => allBowlerInnings.filter(b => modeMatchIds.has(b.match_id)),
    [allBowlerInnings, modeMatchIds]
  );

  const playerA = modePlayers.find(p => p.id === playerAId);
  const playerB = modePlayers.find(p => p.id === playerBId);

  // Match-up mode from the pair's roles:
  //  - exactly one pure bowler  -> batter vs bowler duel
  //  - both pure bowlers        -> bowling career comparison
  //  - neither a pure bowler    -> batting career comparison
  const isBowlerRole = (p) => p?.role === 'bowler';
  const matchup = useMemo(() => {
    if (!playerA || !playerB) return null;
    const aB = isBowlerRole(playerA), bB = isBowlerRole(playerB);
    if (aB && bB) return { type: 'bowler-vs-bowler' };
    if (aB || bB) {
      const batter = aB ? playerB : playerA;
      const bowler = aB ? playerA : playerB;
      return { type: 'duel', batter, bowler };
    }
    return { type: 'batter-vs-batter' };
  }, [playerA, playerB]);

  // ---- Batter vs bowler: ball-by-ball duel ----
  const h2h = useMemo(() => {
    if (matchup?.type !== 'duel') return null;
    const { batter, bowler } = matchup;
    const d = modeDeliveries.filter(x => x.striker_id === batter.id && x.bowler_id === bowler.id);
    if (d.length === 0) return { empty: true };

    const ballsFaced = d.filter(x => !x.is_wide).length;
    const legalBalls = d.filter(x => x.is_legal_delivery !== false).length;
    const runsBat = d.reduce((s, x) => s + (x.runs_bat || 0), 0);
    const conceded = d.reduce((s, x) =>
      s + (x.runs_total || 0) - (x.bye_runs || 0) - (x.leg_bye_runs || 0) - (x.penalty_runs || 0), 0);
    const dots = d.filter(x => (x.runs_total || 0) === 0 && !x.is_wicket).length;
    const fours = d.filter(x => (x.runs_bat || 0) === 4).length;
    const sixes = d.filter(x => (x.runs_bat || 0) === 6).length;
    const wkts = d.filter(x => x.is_wicket && x.player_out_id === batter.id && BOWLER_CREDITED.includes(x.wicket_type));
    const matches = new Set(d.map(x => x.match_id)).size;

    const strikeRate = ballsFaced > 0 ? (runsBat / ballsFaced) * 100 : 0;
    const economy = legalBalls > 0 ? (conceded / legalBalls) * 6 : 0;
    const boundaryPct = ballsFaced > 0 ? ((fours + sixes) / ballsFaced) * 100 : 0;
    const dotPct = ballsFaced > 0 ? (dots / ballsFaced) * 100 : 0;

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
  }, [matchup, modeDeliveries]);

  // ---- Career stats for same-type comparisons ----
  const getCareer = (playerId) => {
    const batting = modeBatterInnings.filter(b => b.player_id === playerId);
    const bowling = modeBowlerInnings.filter(b => b.player_id === playerId);

    const batRuns = batting.reduce((s, b) => s + (b.runs || 0), 0);
    const batBalls = batting.reduce((s, b) => s + (b.balls_faced || 0), 0);
    const batOuts = batting.reduce((s, b) => s + (b.is_out ? 1 : 0), 0);
    const batFours = batting.reduce((s, b) => s + (b.fours || 0), 0);
    const batSixes = batting.reduce((s, b) => s + (b.sixes || 0), 0);
    const batDots = batting.reduce((s, b) => s + (b.dots || 0), 0);

    const bowlWkts = bowling.reduce((s, b) => s + (b.wickets || 0), 0);
    const bowlRuns = bowling.reduce((s, b) => s + (b.runs_conceded || 0), 0);
    const bowlBalls = bowling.reduce((s, b) => s + (b.overs || 0) * 6 + (b.balls || 0), 0);
    const bowlMaidens = bowling.reduce((s, b) => s + (b.maidens || 0), 0);
    const bowlDots = bowling.reduce((s, b) => s + (b.dots || 0), 0);

    return {
      batting: {
        innings: batting.length,
        runs: batRuns,
        average: +(batOuts > 0 ? batRuns / batOuts : batRuns).toFixed(1),
        strikeRate: +(batBalls > 0 ? (batRuns / batBalls) * 100 : 0).toFixed(1),
        highScore: batting.length ? Math.max(...batting.map(b => b.runs || 0)) : 0,
        fours: batFours,
        sixes: batSixes,
        boundaries: batFours + batSixes,
        fifties: batting.filter(b => (b.runs || 0) >= 50).length,
        dotPct: +(batBalls > 0 ? (batDots / batBalls) * 100 : 0).toFixed(1),
      },
      bowling: {
        innings: bowling.length,
        wickets: bowlWkts,
        economy: +(bowlBalls > 0 ? (bowlRuns / bowlBalls) * 6 : 0).toFixed(2),
        average: +(bowlWkts > 0 ? bowlRuns / bowlWkts : 999).toFixed(1),
        strikeRate: +(bowlWkts > 0 ? bowlBalls / bowlWkts : 999).toFixed(1),
        maidens: bowlMaidens,
        dots: bowlDots,
        fiveWickets: bowling.filter(b => (b.wickets || 0) >= 5).length,
      }
    };
  };

  const careerA = useMemo(() => (playerA ? getCareer(playerA.id) : null), [playerA, modeBatterInnings, modeBowlerInnings]);
  const careerB = useMemo(() => (playerB ? getCareer(playerB.id) : null), [playerB, modeBatterInnings, modeBowlerInnings]);

  const headToHead = useMemo(() => {
    if (!playerA || !playerB) return null;
    return buildHeadToHead({
      playerA,
      playerB,
      deliveries: modeDeliveries,
      batterInnings: modeBatterInnings,
      bowlerInnings: modeBowlerInnings,
      matches: modeMatches,
    });
  }, [playerA, playerB, modeDeliveries, modeBatterInnings, modeBowlerInnings, modeMatches]);

  const modeLabel = mode === 'circular' ? 'Standard' : 'TURF';

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
        <h1 className="text-2xl font-bold text-white mb-1">Compare Players</h1>
        <p className="text-slate-400 text-sm">
          Any matchup — batter vs bowler shows their ball-by-ball duel; two batters or two bowlers get a career-stats report.
        </p>
      </div>

      {/* Searchable selectors */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-400">Player 1</span>
          </div>
          <PlayerSearchSelect
            value={playerAId}
            onChange={setPlayerAId}
            players={modePlayers.filter(p => p.id !== playerBId)}
            teamsMap={teamsMap}
            placeholder="Search a player..."
            accentClass="border-emerald-500/40 hover:border-emerald-500/70"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <span className="text-sm text-slate-400">Player 2</span>
          </div>
          <PlayerSearchSelect
            value={playerBId}
            onChange={setPlayerBId}
            players={modePlayers.filter(p => p.id !== playerAId)}
            teamsMap={teamsMap}
            placeholder="Search a player..."
            accentClass="border-rose-500/40 hover:border-rose-500/70"
          />
        </div>
      </div>

      {(!playerA || !playerB) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <ArrowLeftRight className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Pick two players</h3>
          <p className="text-slate-400 text-sm">Search and select any two players to compare them.</p>
        </div>
      )}

      {playerA && playerB && matchup && (
        <>
          {/* Player header cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-emerald-400">{playerA.name}</div>
              <div className="text-xs text-slate-400">{teamsMap[playerA.team_id]?.name || 'Unknown Team'}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{playerA.role?.replace('_', ' ')}</div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-rose-400">{playerB.name}</div>
              <div className="text-xs text-slate-400">{teamsMap[playerB.team_id]?.name || 'Unknown Team'}</div>
              <div className="text-xs text-slate-500 mt-1 capitalize">{playerB.role?.replace('_', ' ')}</div>
            </div>
          </div>

          <CareerTotals
            playerA={playerA}
            playerB={playerB}
            careerA={careerA}
            careerB={careerB}
            modeLabel={modeLabel}
          />

          {/* Batter vs bowler duel */}
          {matchup.type === 'duel' && h2h?.empty && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                <ArrowLeftRight className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No head-to-head yet</h3>
              <p className="text-slate-400 text-sm max-w-md">
                {matchup.batter.name} has never faced {matchup.bowler.name} with the bat in {mode === 'circular' ? 'Standard' : 'TURF'} mode.
                Score or import a match between their teams and the duel will appear here.
              </p>
            </div>
          )}

          {matchup.type === 'duel' && h2h && !h2h.empty && (
            <>
              <div className="mb-4 text-center text-sm font-medium text-cyan-400">
                Batter vs Bowler · ball-by-ball duel
              </div>
              <H2HStatCards h2h={h2h} batterName={matchup.batter.name} bowlerName={matchup.bowler.name} />
              <DominanceMeter share={h2h.batterShare} batterName={matchup.batter.name} bowlerName={matchup.bowler.name} />
              <CoachInsight h2h={h2h} batterName={matchup.batter.name} bowlerName={matchup.bowler.name} />
            </>
          )}

          {/* Two batters / two bowlers: career stats report */}
          {matchup.type === 'batter-vs-batter' && (
            <>
              <div className="mb-4 text-center text-sm font-medium text-cyan-400">
                Batter vs Batter · career record
              </div>
              <CareerCompare
                type="batting"
                statsA={careerA.batting}
                statsB={careerB.batting}
                playerA={playerA}
                playerB={playerB}
              />
            </>
          )}

          {matchup.type === 'bowler-vs-bowler' && (
            <>
              <div className="mb-4 text-center text-sm font-medium text-cyan-400">
                Bowler vs Bowler · career record
              </div>
              <CareerCompare
                type="bowling"
                statsA={careerA.bowling}
                statsB={careerB.bowling}
                playerA={playerA}
                playerB={playerB}
              />
            </>
          )}

          {/* Record against each other, then the head-to-head verdict */}
          {headToHead && headToHead.sharedCount > 0 && (
            <HeadToHeadSection h2h={headToHead} playerA={playerA} playerB={playerB} />
          )}
          {headToHead && (
            <HeadToHeadVerdict h2h={headToHead} playerA={playerA} playerB={playerB} />
          )}
        </>
      )}
    </div>
  );
}