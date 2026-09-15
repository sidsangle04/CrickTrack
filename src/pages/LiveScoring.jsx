import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Loader2, AlertTriangle } from 'lucide-react';

import ScoreHeader from '../components/scoring/ScoreHeader';
import BatterCard from '../components/scoring/BatterCard';
import BowlerCard from '../components/scoring/BowlerCard';
import ThisOver from '../components/scoring/ThisOver';
import ScoringKeypad from '../components/scoring/ScoringKeypad';
import WicketModal from '../components/scoring/WicketModal';
import ExtrasModal from '../components/scoring/ExtrasModal';
import SelectBatterModal from '../components/scoring/SelectBatterModal';
import SelectBowlerModal from '../components/scoring/SelectBowlerModal';
import VisualTrackingModal from '../components/scoring/VisualTrackingModal';
import BowlerProfileModal from '../components/scoring/BowlerProfileModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FollowOnModal from '../components/scoring/FollowOnModal';
import {
  isTestMatch,
  getMaxWickets,
  getBattingTeamForInnings,
  getBowlingTeamForInnings,
  getSecondBattingTeamId,
  getFourthInningsTarget,
  evaluateTestOutcome,
  oversRemaining
} from '../lib/testCricket';

export default function LiveScoring() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [extraType, setExtraType] = useState(null);
  const [showSelectBatter, setShowSelectBatter] = useState(false);
  const [showSelectBowler, setShowSelectBowler] = useState(false);
  const [showEndInningsDialog, setShowEndInningsDialog] = useState(false);
  const [showMenuDialog, setShowMenuDialog] = useState(false);
  const [showFollowOnDialog, setShowFollowOnDialog] = useState(false);
  const [followOnLead, setFollowOnLead] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);
  const [showVisualTracking, setShowVisualTracking] = useState(false);
  const [pendingDelivery, setPendingDelivery] = useState(null);
  const [bowlerProfile, setBowlerProfile] = useState({}); // { [playerId]: { hand, type } }
  const [showBowlerProfile, setShowBowlerProfile] = useState(false);
  const [pendingBowlerId, setPendingBowlerId] = useState(null);

  // Serialises delivery/undo processing so rapid taps can't race on stale
  // React state (the source of mismatched scores and bad undos).
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const setProcessingLocked = (v) => {
    processingRef.current = v;
    setProcessing(v);
  };

  // Serial background queue for delivery writes. The UI updates optimistically
  // the instant a ball is tapped; the database writes then run one at a time in
  // tap order so rapid taps can't clobber each other's updates.
  const writeChainRef = useRef(Promise.resolve());

  // How many write tasks are still queued. Reconciliation with the server only
  // runs once this drops back to zero — refetching after every ball while more
  // taps are still in flight repaints stale server state, which makes the
  // on-screen score jump backwards before the next write lands.
  const pendingWritesRef = useRef(0);

  // Runs a write task on the serial background queue. The UI is already
  // updated optimistically; the reconcile refetch only fires when the whole
  // queue has drained, so it can never repaint a stale score.
  const queueWrites = (task, reconcile) => {
    pendingWritesRef.current += 1;
    writeChainRef.current = writeChainRef.current
      .then(async () => {
        try {
          await task();
        } catch (e) {
          // Swallow — the reconcile refetch reports the true server state.
        }
      })
      .finally(async () => {
        pendingWritesRef.current -= 1;
        if (pendingWritesRef.current === 0 && reconcile) {
          // Brief grace period so an immediate next tap joins the queue
          // before we ask the server for its state back.
          setTimeout(() => {
            if (pendingWritesRef.current === 0) {
              Promise.resolve(reconcile()).catch(() => {});
            }
          }, 300);
        }
      });
  };

  // Maps an optimistic partnership id to the real record id once the background
  // create lands (follow-up partnership updates in the queue resolve through it).
  const tempPshipIdsRef = useRef({});

  // Same pattern for batter/bowler stats records and deliveries created
  // optimistically — later queue writes resolve the real ids through these.
  const tempBatterIdsRef = useRef({});
  const tempBowlerIdsRef = useRef({});
  const tempDeliveryIdsRef = useRef({});

  // Session stack of balls processed in the current innings, in tap order.
  // This is the authoritative "last ball" for undo: the over cache can be
  // momentarily repainted by a background refetch without the newest ball
  // (or with stale ids), which used to make undo grab the wrong delivery.
  const deliveryStackRef = useRef([]);

  // Freshest scoring state straight from the query cache — always current,
  // even between rapid taps before React re-renders.
  const getLiveState = () => {
    const allInnings = queryClient.getQueryData(['innings', matchId]) || [];
    const innings = allInnings.find((inn) => inn.status === 'in_progress') ||
      allInnings.find((inn) => inn.status === 'not_started') ||
      allInnings[allInnings.length - 1];
    return {
      allInnings,
      innings,
      batters: queryClient.getQueryData(['batter-innings', innings?.id]) || [],
      bowlers: queryClient.getQueryData(['bowler-innings', innings?.id]) || [],
      pships: queryClient.getQueryData(['partnerships', innings?.id]) || []
    };
  };

  // Optimistically patches the current innings on screen (instant UI) and
  // persists the update on the background write queue, then quietly refetches.
  const applyInningsPatch = (patch) => {
    const live = getLiveState();
    const liveInnings = live.innings;
    if (!liveInnings) return;
    queryClient.setQueryData(['innings', matchId],
      live.allInnings.map((i) => i.id === liveInnings.id ? { ...i, ...patch } : i));
    queueWrites(() => base44.entities.Innings.update(liveInnings.id, patch), refetchAll);
  };

  const { data: match, isLoading: matchLoading, refetch: refetchMatch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const matches = await base44.entities.Match.filter({ id: matchId });
      return matches[0];
    },
    enabled: !!matchId,
    refetchOnWindowFocus: false
  });

  const { data: allInnings = [], refetch: refetchInnings } = useQuery({
    queryKey: ['innings', matchId],
    queryFn: () => base44.entities.Innings.filter({ match_id: matchId }),
    enabled: !!matchId,
    refetchOnWindowFocus: false
  });

  // Find current innings - prioritize in_progress, then not_started (including super overs)
  const currentInnings = allInnings.find((inn) => inn.status === 'in_progress') ||
  allInnings.find((inn) => inn.status === 'not_started') ||
  allInnings[allInnings.length - 1];

  const { data: currentOverDeliveries = [], refetch: refetchDeliveries } = useQuery({
    queryKey: ['deliveries', currentInnings?.id, currentInnings?.current_over_number],
    queryFn: () => currentInnings ?
    base44.entities.Delivery.filter({
      innings_id: currentInnings.id,
      over_number: currentInnings.current_over_number,
      is_voided: false
    }) :
    [],
    enabled: !!currentInnings?.id,
    refetchOnWindowFocus: false
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: batterInnings = [], refetch: refetchBatterInnings } = useQuery({
    queryKey: ['batter-innings', currentInnings?.id],
    queryFn: () => currentInnings ?
    base44.entities.BatterInnings.filter({ innings_id: currentInnings.id }) :
    [],
    enabled: !!currentInnings?.id,
    refetchOnWindowFocus: false
  });

  const { data: bowlerInnings = [], refetch: refetchBowlerInnings } = useQuery({
    queryKey: ['bowler-innings', currentInnings?.id],
    queryFn: () => currentInnings ?
    base44.entities.BowlerInnings.filter({ innings_id: currentInnings.id }) :
    [],
    enabled: !!currentInnings?.id,
    refetchOnWindowFocus: false
  });

  const { data: partnerships = [], refetch: refetchPartnerships } = useQuery({
    queryKey: ['partnerships', currentInnings?.id],
    queryFn: () => currentInnings ?
    base44.entities.Partnership.filter({ innings_id: currentInnings.id }) :
    [],
    enabled: !!currentInnings?.id,
    refetchOnWindowFocus: false
  });

  const teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
  const playersMap = allPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
  const batterInningsMap = batterInnings.reduce((acc, b) => ({ ...acc, [b.player_id]: b }), {});
  const bowlerInningsMap = bowlerInnings.reduce((acc, b) => ({ ...acc, [b.player_id]: b }), {});

  const team1Name = teamsMap[match?.team1_id]?.name || 'Team 1';
  const team2Name = teamsMap[match?.team2_id]?.name || 'Team 2';

  const currentStriker = batterInningsMap[currentInnings?.current_striker_id];
  const currentNonStriker = batterInningsMap[currentInnings?.current_non_striker_id];
  const currentBowler = bowlerInningsMap[currentInnings?.current_bowler_id];

  const battingTeamPlayingXI = currentInnings?.batting_team_id === match?.team1_id ?
  match?.team1_playing_xi || [] :
  match?.team2_playing_xi || [];

  const bowlingTeamPlayingXI = currentInnings?.bowling_team_id === match?.team1_id ?
  match?.team1_playing_xi || [] :
  match?.team2_playing_xi || [];

  const isTest = isTestMatch(match);
  const maxOvers = currentInnings?.is_super_over ? 1 : (isTest ? Infinity : (match?.overs_per_innings || 20));
  const maxWickets = currentInnings?.is_super_over ? 2 : getMaxWickets(match);

  useEffect(() => {
    if (!currentInnings) return;
    if (pendingAction) return; // Don't override if already in selection flow

    if (currentInnings.status === 'not_started') {
      setShowSelectBatter(true);
      setPendingAction('select_opener_1');
    } else if (currentInnings.status === 'in_progress' && !currentInnings.current_striker_id && !currentInnings.current_non_striker_id) {
      setShowSelectBatter(true);
      setPendingAction('select_opener_1');
    }
  }, [currentInnings?.id, currentInnings?.status]);

  // A new innings invalidates the session delivery stack — undo only ever
  // applies within the innings being scored.
  useEffect(() => {
    deliveryStackRef.current = [];
  }, [currentInnings?.id]);

  const refetchAll = async () => {
    await Promise.all([
    refetchMatch(),
    refetchInnings(),
    refetchDeliveries(),
    refetchBatterInnings(),
    refetchBowlerInnings(),
    refetchPartnerships()]
    );
  };

  // Lighter refetch — only the per-innings data that a delivery changes.
  // Match/teams/players don't change per ball, so we skip them for speed.
  const refetchScoring = async () => {
    await Promise.all([
      refetchInnings(),
      refetchDeliveries(),
      refetchBatterInnings(),
      refetchBowlerInnings(),
      refetchPartnerships()
    ]);
  };

  // Optimistic scoring: the ball is computed and painted on screen synchronously
  // (score, over, striker rotation, this-over strip and the batter/bowler cards),
  // while the database writes run afterwards on a serial background queue. Flow
  // changes (wicket / end of over / end of innings) hold the keypad until their
  // prompt appears, exactly as before.
  const processDelivery = (deliveryData) => {
    if (processingRef.current) return;

    // Always compute on the freshest cached state — rapid taps chain correctly
    // even before React re-renders.
    const live = getLiveState();
    const currentInnings = live.innings;
    if (!currentInnings?.current_striker_id || !currentInnings?.current_bowler_id) return;
    const batterInningsList = live.batters;
    const bowlerInningsList = live.bowlers;
    const partnershipsList = live.pships;
    const batterInningsMap = batterInningsList.reduce((acc, b) => ({ ...acc, [b.player_id]: b }), {});
    const bowlerInningsMap = bowlerInningsList.reduce((acc, b) => ({ ...acc, [b.player_id]: b }), {});
    const now = new Date().toISOString();
    const tempId = `tmp-${now}`;

    const isLegal = !deliveryData.is_wide && !deliveryData.is_no_ball;
    const runsScoredByBat = deliveryData.is_bye || deliveryData.is_leg_bye ? 0 : deliveryData.runs_bat || 0;
    const totalRuns = runsScoredByBat + (
    deliveryData.wide_runs || 0) + (
    deliveryData.no_ball_runs || 0) + (
    deliveryData.bye_runs || 0) + (
    deliveryData.leg_bye_runs || 0);

    // The ball is recorded locally first (for the instant on-screen update),
    // then persisted by the background write queue below.
    const writeThunks = [];
    const deliveryRecord = {
      match_id: matchId,
      innings_id: currentInnings.id,
      over_number: currentInnings.current_over_number,
      ball_in_over: isLegal ? currentInnings.current_ball_in_over + 1 : currentInnings.current_ball_in_over,
      striker_id: currentInnings.current_striker_id,
      non_striker_id: currentInnings.current_non_striker_id,
      bowler_id: currentInnings.current_bowler_id,
      runs_bat: deliveryData.runs_bat || 0,
      runs_total: totalRuns,
      is_wide: deliveryData.is_wide || false,
      wide_runs: deliveryData.wide_runs || 0,
      is_no_ball: deliveryData.is_no_ball || false,
      no_ball_runs: deliveryData.no_ball_runs || 0,
      is_bye: deliveryData.is_bye || false,
      bye_runs: deliveryData.bye_runs || 0,
      is_leg_bye: deliveryData.is_leg_bye || false,
      leg_bye_runs: deliveryData.leg_bye_runs || 0,
      is_wicket: deliveryData.is_wicket || false,
      wicket_type: deliveryData.wicket_type,
      player_out_id: deliveryData.player_out_id,
      fielder_id: deliveryData.fielder_id,
      runout_end: deliveryData.runout_end,
      is_legal_delivery: isLegal,
      is_boundary: deliveryData.runs_bat === 4,
      is_six: deliveryData.runs_bat === 6,
      is_dot_ball: isLegal && totalRuns === 0,
      // Visual tracking fields
      shot_x: deliveryData.shot_x,
      shot_y: deliveryData.shot_y,
      shot_region: deliveryData.shot_region,
      shot_side: deliveryData.shot_side,
      shot_distance: deliveryData.shot_distance,
      pitch_x: deliveryData.pitch_x,
      pitch_y: deliveryData.pitch_y,
      line: deliveryData.line,
      length: deliveryData.length,
      delivery_variation: deliveryData.delivery_variation,
      bowler_hand: deliveryData.bowler_hand,
      bowler_type: deliveryData.bowler_type,
      turf_zone: deliveryData.turf_zone,
      is_catch_drop: deliveryData.is_catch_drop || false,
      dropped_by: deliveryData.dropped_by,
      timestamp: now
    };
    writeThunks.push(() => base44.entities.Delivery.create(deliveryRecord).then((created) => {
      tempDeliveryIdsRef.current[tempId] = created.id;
      // Keep the stack entry pointing at the real record id so a later undo
      // removes it from the (by then refetched) over cache correctly.
      const stackEntry = deliveryStackRef.current.find((d) => d.id === tempId);
      if (stackEntry) stackEntry.id = created.id;
    }));

    const strikerStats = batterInningsMap[currentInnings.current_striker_id];
    let strikerUpdate = null;
    if (strikerStats && !deliveryData.is_wide) {
      // For bye/leg bye: count ball faced but no runs to batter
      const isByeOrLegBye = deliveryData.is_bye || deliveryData.is_leg_bye;
      strikerUpdate = {
        runs: (strikerStats.runs || 0) + (isByeOrLegBye ? 0 : runsScoredByBat),
        balls_faced: (strikerStats.balls_faced || 0) + (isLegal || deliveryData.is_no_ball ? 1 : 0),
        fours: (strikerStats.fours || 0) + (!isByeOrLegBye && runsScoredByBat === 4 ? 1 : 0),
        sixes: (strikerStats.sixes || 0) + (!isByeOrLegBye && runsScoredByBat === 6 ? 1 : 0),
        dots: (strikerStats.dots || 0) + (isByeOrLegBye ? 0 : (runsScoredByBat === 0 && isLegal ? 1 : 0))
      };
      writeThunks.push(() => base44.entities.BatterInnings.update(tempBatterIdsRef.current[strikerStats.id] || strikerStats.id, strikerUpdate));
    }

    const bowlerStats = bowlerInningsMap[currentInnings.current_bowler_id];
    let bowlerUpdate = null;
    if (bowlerStats) {
      const newBalls = (bowlerStats.balls || 0) + (isLegal ? 1 : 0);
      const newOvers = Math.floor(newBalls / 6);
      // Bowler runs conceded should NOT include byes and leg byes
      const isByeOrLegBye = deliveryData.is_bye || deliveryData.is_leg_bye;
      const bowlerRunsConceded = (isByeOrLegBye ? 0 : runsScoredByBat) + (deliveryData.wide_runs || 0) + (deliveryData.no_ball_runs || 0);
      bowlerUpdate = {
        balls: newBalls,
        overs: newOvers,
        runs_conceded: (bowlerStats.runs_conceded || 0) + bowlerRunsConceded,
        wickets: (bowlerStats.wickets || 0) + (deliveryData.is_wicket && !deliveryData.is_run_out ? 1 : 0),
        wides: (bowlerStats.wides || 0) + (deliveryData.is_wide ? 1 : 0),
        no_balls: (bowlerStats.no_balls || 0) + (deliveryData.is_no_ball ? 1 : 0),
        dots: (bowlerStats.dots || 0) + (isLegal && bowlerRunsConceded === 0 && !isByeOrLegBye ? 1 : 0),
        fours_conceded: (bowlerStats.fours_conceded || 0) + (!isByeOrLegBye && runsScoredByBat === 4 ? 1 : 0),
        sixes_conceded: (bowlerStats.sixes_conceded || 0) + (!isByeOrLegBye && runsScoredByBat === 6 ? 1 : 0)
      };
      writeThunks.push(() => base44.entities.BowlerInnings.update(tempBowlerIdsRef.current[bowlerStats.id] || bowlerStats.id, bowlerUpdate));
    }

    // Partnership tracking — find the active partnership from the live cache,
    // accumulate, and collect the write as a thunk for the background queue.
    const activePship = partnershipsList.find((p) => p.is_active);
    const ballFaced = isLegal || deliveryData.is_no_ball;
    let partnershipThunk;
    let optimisticPship = null;
    if (activePship) {
      const strikerIsBatter1 = activePship.batter1_id === currentInnings.current_striker_id;
      const partnershipUpdate = {
        runs: (activePship.runs || 0) + totalRuns,
        balls: (activePship.balls || 0) + (isLegal ? 1 : 0)
      };
      if (strikerIsBatter1) {
        partnershipUpdate.batter1_runs = (activePship.batter1_runs || 0) + runsScoredByBat;
        partnershipUpdate.batter1_balls = (activePship.batter1_balls || 0) + (ballFaced ? 1 : 0);
      } else {
        partnershipUpdate.batter2_runs = (activePship.batter2_runs || 0) + runsScoredByBat;
        partnershipUpdate.batter2_balls = (activePship.batter2_balls || 0) + (ballFaced ? 1 : 0);
      }
      if (deliveryData.is_wicket) {
        partnershipUpdate.is_active = false;
        partnershipUpdate.how_ended = deliveryData.wicket_type;
      }
      partnershipThunk = () => base44.entities.Partnership.update(tempPshipIdsRef.current[activePship.id] || activePship.id, partnershipUpdate);
      optimisticPship = { ...activePship, ...partnershipUpdate };
    } else {
      const pshipCreateFields = {
        match_id: matchId,
        innings_id: currentInnings.id,
        wicket_number: (currentInnings.total_wickets || 0) + 1,
        batter1_id: currentInnings.current_striker_id,
        batter2_id: currentInnings.current_non_striker_id,
        is_active: !deliveryData.is_wicket,
        runs: totalRuns,
        balls: isLegal ? 1 : 0,
        batter1_runs: runsScoredByBat,
        batter1_balls: ballFaced ? 1 : 0,
        batter2_runs: 0,
        batter2_balls: 0,
        how_ended: deliveryData.is_wicket ? deliveryData.wicket_type : null
      };
      partnershipThunk = () => base44.entities.Partnership.create(pshipCreateFields).then((created) => {
        tempPshipIdsRef.current[tempId] = created.id;
      });
      optimisticPship = { id: tempId, ...pshipCreateFields };
    }

    let newBallInOver = currentInnings.current_ball_in_over + (isLegal ? 1 : 0);
    let newOverNumber = currentInnings.current_over_number;
    let newStrikerId = currentInnings.current_striker_id;
    let newNonStrikerId = currentInnings.current_non_striker_id;

    const runsForStrikeChange = runsScoredByBat + (deliveryData.bye_runs || 0) + (deliveryData.leg_bye_runs || 0);
    if (runsForStrikeChange % 2 === 1) {
      newStrikerId = currentInnings.current_non_striker_id;
      newNonStrikerId = currentInnings.current_striker_id;
    }

    let needNewBowler = false;
    if (newBallInOver >= 6) {
      newBallInOver = 0;
      newOverNumber += 1;
      const temp = newStrikerId;
      newStrikerId = newNonStrikerId;
      newNonStrikerId = temp;
      needNewBowler = true;
    }

    let needNewBatter = false;
    let outBatterWrite = null;
    if (deliveryData.is_wicket) {
      const playerOutId = deliveryData.player_out_id;
      const outBatterStats = batterInningsMap[playerOutId];
      if (outBatterStats) {
        outBatterWrite = {
          id: outBatterStats.id,
          fields: {
            is_out: true,
            dismissal_type: deliveryData.wicket_type,
            dismissed_by_bowler_id: deliveryData.is_run_out ? null : currentInnings.current_bowler_id,
            dismissed_by_fielder_id: deliveryData.fielder_id,
            status: 'out'
          }
        };
        writeThunks.push(() => base44.entities.BatterInnings.update(tempBatterIdsRef.current[outBatterWrite.id] || outBatterWrite.id, outBatterWrite.fields));
      }

      // Simply null out the position of the dismissed player after all rotations
      // The new batter will take the position that is null
      if (playerOutId === newStrikerId) {
        newStrikerId = null;
      } else if (playerOutId === newNonStrikerId) {
        newNonStrikerId = null;
      }
      needNewBatter = true;
    }

    const newTotalRuns = (currentInnings.total_runs || 0) + totalRuns;
    const newTotalWickets = (currentInnings.total_wickets || 0) + (deliveryData.is_wicket ? 1 : 0);
    const newTotalBalls = (currentInnings.total_balls || 0) + (isLegal ? 1 : 0);

    const inningsUpdate = {
      total_runs: newTotalRuns,
      total_wickets: newTotalWickets,
      total_balls: newTotalBalls,
      total_overs: Math.floor(newTotalBalls / 6),
      current_ball_in_over: newBallInOver,
      current_over_number: newOverNumber,
      extras_wide: (currentInnings.extras_wide || 0) + (deliveryData.wide_runs || 0),
      extras_no_ball: (currentInnings.extras_no_ball || 0) + (deliveryData.no_ball_runs || 0),
      extras_byes: (currentInnings.extras_byes || 0) + (deliveryData.bye_runs || 0),
      extras_leg_byes: (currentInnings.extras_leg_byes || 0) + (deliveryData.leg_bye_runs || 0),
      status: 'in_progress'
    };

    // Always update striker/non-striker - set to null if dismissed
    if (newStrikerId) {
      inningsUpdate.current_striker_id = newStrikerId;
    } else if (deliveryData.is_wicket) {
      // Clear the striker position if they were dismissed
      inningsUpdate.current_striker_id = null;
    }
    if (newNonStrikerId) {
      inningsUpdate.current_non_striker_id = newNonStrikerId;
    } else if (deliveryData.is_wicket) {
      // Clear the non-striker position if they were dismissed
      inningsUpdate.current_non_striker_id = null;
    }

    writeThunks.push(partnershipThunk);
    writeThunks.push(() => base44.entities.Innings.update(currentInnings.id, inningsUpdate));

    const localMaxWickets = currentInnings.is_super_over ? 2 : getMaxWickets(match);
    const localMaxOvers = currentInnings.is_super_over ? 1 : (isTest ? Infinity : (match?.overs_per_innings || 20));
    const isAllOut = newTotalWickets >= localMaxWickets;
    const isOversComplete = !isTest && newOverNumber >= localMaxOvers && newBallInOver === 0;
    // Target is set to inn1 + 1. Team2 wins if they score >= target (i.e. > inn1 score).
    // Exact tie (inn2 == inn1) is handled at overs_complete/all_out via endInnings.
    const isTargetReached = currentInnings.target && newTotalRuns >= currentInnings.target;

    // Test: match-wide over cap (not per-innings). Triggers when an over completes
    // and the global ball budget is exhausted.
    let testOverLimitReached = false;
    if (isTest && match?.is_over_limited && needNewBowler) {
      const priorBalls = live.allInnings.filter((i) => i.id !== currentInnings.id).reduce((s, i) => s + (i.total_balls || 0), 0);
      if (priorBalls + newTotalBalls >= (match.total_match_overs || 0) * 6) testOverLimitReached = true;
    }
    const endOfInnings = isAllOut || isOversComplete || isTargetReached || testOverLimitReached;

    // ---- 1) Instant UI: paint the ball on screen synchronously ----
    const overKey = ['deliveries', currentInnings.id, currentInnings.current_over_number];
    const overNow = queryClient.getQueryData(overKey) || [];
    queryClient.setQueryData(overKey, [...overNow, { ...deliveryRecord, id: tempId }]);
    deliveryStackRef.current.push({ ...deliveryRecord, id: tempId });

    queryClient.setQueryData(['innings', matchId],
      live.allInnings.map((i) => i.id === currentInnings.id ? { ...i, ...inningsUpdate } : i));

    queryClient.setQueryData(['batter-innings', currentInnings.id],
      batterInningsList.map((b) => {
        if (strikerStats && strikerUpdate && b.id === strikerStats.id) return { ...b, ...strikerUpdate };
        if (outBatterWrite && b.id === outBatterWrite.id) return { ...b, ...outBatterWrite.fields };
        return b;
      }));

    if (bowlerStats && bowlerUpdate) {
      queryClient.setQueryData(['bowler-innings', currentInnings.id],
        bowlerInningsList.map((b) => b.id === bowlerStats.id ? { ...b, ...bowlerUpdate } : b));
    }

    queryClient.setQueryData(['partnerships', currentInnings.id],
      activePship
        ? partnershipsList.map((p) => p.id === activePship.id ? optimisticPship : p)
        : [...partnershipsList, optimisticPship]);

    // ---- 2) Flow change: the next prompt appears instantly (the modal gates
    // further scoring; the writes land on the background queue meanwhile) ----
    if (endOfInnings) {
      setProcessingLocked(true);
      queueWrites(async () => {
        try {
          await Promise.all(writeThunks.map((thunk) => thunk()));
          await refetchScoring();
          await endInnings(isAllOut ? 'all_out' : (testOverLimitReached || isOversComplete) ? 'overs_complete' : 'target_reached');
        } finally {
          setProcessingLocked(false);
        }
      });
      return;
    }
    if (needNewBatter && newTotalWickets < localMaxWickets) {
      // If over also ended, need bowler after batter
      setPendingAction(needNewBowler ? 'new_batter_then_bowler' : 'new_batter');
      setShowSelectBatter(true);
      setProcessingLocked(true); // released once the new batter is chosen
    } else if (needNewBowler) {
      setPendingAction('new_bowler');
      setShowSelectBowler(true);
      setProcessingLocked(true); // released once the new bowler is chosen
    }

    // ---- 3) Background persist, one ball at a time in tap order ----
    // The reconcile refetch fires only once the queue is idle (see
    // queueWrites), so it can't repaint a stale score over balls that
    // are still being written.
    queueWrites(() => Promise.all(writeThunks.map((thunk) => thunk())), refetchScoring);
  };

  const endInnings = async (reason) => {
    await base44.entities.Innings.update(currentInnings.id, {
      status: 'completed',
      end_reason: reason
    });

    // Finalize any still-active partnership for this innings
    const finalActivePships = await base44.entities.Partnership.filter({ innings_id: currentInnings.id, is_active: true });
    if (finalActivePships.length > 0) {
      await base44.entities.Partnership.bulkUpdate(
        finalActivePships.map(p => ({ id: p.id, is_active: false, how_ended: p.how_ended || reason }))
      );
    }

    const updatedInnings = await base44.entities.Innings.filter({ match_id: matchId });
    
    // Test cricket has its own multi-innings flow (follow-on, declare, draw).
    if (isTest && !currentInnings.is_super_over) {
      return endInningsTest(reason, updatedInnings);
    }

    // Handle Super Over completion
    if (currentInnings.is_super_over) {
      const superOverInnings = updatedInnings.filter(i => i.is_super_over && i.super_over_number === currentInnings.super_over_number);
      const completedSuperOvers = superOverInnings.filter(i => i.status === 'completed');
      
      if (completedSuperOvers.length === 1) {
        // First innings of super over done, start second
        await base44.entities.Innings.create({
          match_id: matchId,
          innings_number: currentInnings.innings_number + 1,
          batting_team_id: currentInnings.bowling_team_id,
          bowling_team_id: currentInnings.batting_team_id,
          is_super_over: true,
          super_over_number: currentInnings.super_over_number,
          target: currentInnings.total_runs + 1,
          status: 'not_started'
        });
        await refetchAll();
        setShowSelectBatter(true);
        setPendingAction('select_opener_1');
      } else if (completedSuperOvers.length >= 2) {
        // Both super over innings done
        const superOverForThisRound = superOverInnings.filter(i => i.status === 'completed');
        const so1 = superOverForThisRound.sort((a, b) => a.innings_number - b.innings_number)[0];
        const so2 = superOverForThisRound.sort((a, b) => a.innings_number - b.innings_number)[1];
        
        if (so2.total_runs > so1.total_runs) {
          // so2 chased and crossed so1's score
          const winnerName = teamsMap[so2.batting_team_id]?.name || 'Team 2';
          await base44.entities.Match.update(matchId, {
            status: 'completed',
            winner_id: so2.batting_team_id,
            result: `${winnerName} won in Super Over`
          });
          navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
        } else if (so1.total_runs > so2.total_runs) {
          // so2 failed to cross so1's score
          const winnerName = teamsMap[so1.batting_team_id]?.name || 'Team 1';
          await base44.entities.Match.update(matchId, {
            status: 'completed',
            winner_id: so1.batting_team_id,
            result: `${winnerName} won in Super Over`
          });
          navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
        } else {
          // Super over tied (exact same score), start another
          setShowEndInningsDialog(true);
        }
      }
      return;
    }
    
    // Handle regular innings
    const completedRegularInnings = updatedInnings.filter((i) => !i.is_super_over && i.status === 'completed');

    if (completedRegularInnings.length >= 2) {
      const inn1 = completedRegularInnings.find((i) => i.innings_number === 1);
      const inn2 = completedRegularInnings.find((i) => i.innings_number === 2);

      if (inn2.total_runs > inn1.total_runs) {
        // Team 2 wins - they scored more than team 1
        const winnerName = teamsMap[inn2.batting_team_id]?.name || 'Team 2';
        const margin = maxWickets - inn2.total_wickets;
        await base44.entities.Match.update(matchId, {
          status: 'completed',
          winner_id: inn2.batting_team_id,
          result: `${winnerName} won by ${margin} wickets`
        });
        navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
      } else if (inn1.total_runs > inn2.total_runs) {
        // Team 1 wins - team 2 scored less
        const winnerName = teamsMap[inn1.batting_team_id]?.name || 'Team 1';
        const margin = inn1.total_runs - inn2.total_runs;
        await base44.entities.Match.update(matchId, {
          status: 'completed',
          winner_id: inn1.batting_team_id,
          result: `${winnerName} won by ${margin} runs`
        });
        navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
      } else {
        // Exact same score = Tied, ask for super over
        setShowEndInningsDialog(true);
      }
    } else {
      await base44.entities.Match.update(matchId, {
        status: 'innings_break',
        current_innings: 2,
        batting_team_id: currentInnings.bowling_team_id,
        bowling_team_id: currentInnings.batting_team_id
      });

      const latestInn1 = updatedInnings.find(i => i.innings_number === 1 && !i.is_super_over);
      await base44.entities.Innings.create({
        match_id: matchId,
        innings_number: 2,
        batting_team_id: currentInnings.bowling_team_id,
        bowling_team_id: currentInnings.batting_team_id,
        target: (latestInn1?.total_runs ?? currentInnings.total_runs) + 1,
        status: 'not_started'
      });

      await refetchAll();
      setShowSelectBatter(true);
      setPendingAction('select_opener_1');
    }
  };

  const endInningsTest = async (reason, updatedInnings) => {
    const justEnded = updatedInnings.find((i) => i.id === currentInnings.id) || currentInnings;
    const freshMatches = await base44.entities.Match.filter({ id: matchId });
    const freshMatch = freshMatches[0];

    // 1) Did this innings produce a definitive result?
    const outcome = evaluateTestOutcome(freshMatch, updatedInnings, justEnded, team1Name, team2Name);
    if (outcome) {
      await base44.entities.Match.update(matchId, { status: 'completed', winner_id: outcome.winner_id || '', result: outcome.result });
      navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
      return;
    }

    // 2) Match-wide over limit exhausted without a result => draw.
    if (freshMatch?.is_over_limited && oversRemaining(freshMatch, updatedInnings) <= 0) {
      await base44.entities.Match.update(matchId, { status: 'completed', winner_id: '', result: 'Match Drawn (Overs Limit Reached)' });
      navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
      return;
    }

    // 3) After Team B's 1st innings, offer the follow-on (only if Team A leads).
    if (justEnded.innings_number === 2) {
      const a1 = updatedInnings.find((i) => i.innings_number === 1)?.total_runs || 0;
      const lead = a1 - (justEnded.total_runs || 0);
      if (lead > 0) {
        setFollowOnLead(lead);
        setShowFollowOnDialog(true);
        await refetchAll();
        return;
      }
      // Not leading => standard sequence continues below.
    }

    // 4) No more innings and no result => draw.
    if (justEnded.innings_number >= 4) {
      await base44.entities.Match.update(matchId, { status: 'completed', winner_id: '', result: 'Match Drawn' });
      navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
      return;
    }

    // 5) Start the next innings (1→2 or 3→4). Keep match.batting_team_id as the
    //    first batting team so the sequence helpers resolve correctly.
    const nextNum = justEnded.innings_number + 1;
    const nextBatting = getBattingTeamForInnings(freshMatch, nextNum);
    const nextBowling = getBowlingTeamForInnings(freshMatch, nextNum);
    const target = nextNum === 4 ? getFourthInningsTarget(freshMatch, updatedInnings) : null;
    await base44.entities.Match.update(matchId, { current_innings: nextNum });
    await base44.entities.Innings.create({
      match_id: matchId,
      innings_number: nextNum,
      batting_team_id: nextBatting,
      bowling_team_id: nextBowling,
      target,
      status: 'not_started'
    });
    await refetchAll();
    setShowSelectBatter(true);
    setPendingAction('select_opener_1');
  };

  const handleFollowOn = async (enforce) => {
    setShowFollowOnDialog(false);
    await base44.entities.Match.update(matchId, { follow_on_enforced: enforce, current_innings: 3 });
    const freshMatches = await base44.entities.Match.filter({ id: matchId });
    const freshMatch = freshMatches[0];
    const nextBatting = getBattingTeamForInnings(freshMatch, 3);
    const nextBowling = getBowlingTeamForInnings(freshMatch, 3);
    await base44.entities.Innings.create({
      match_id: matchId,
      innings_number: 3,
      batting_team_id: nextBatting,
      bowling_team_id: nextBowling,
      status: 'not_started'
    });
    await refetchAll();
    setShowSelectBatter(true);
    setPendingAction('select_opener_1');
  };

  const startSuperOver = async () => {
    const superOverNum = (match.super_over_count || 0) + 1;
    
    // Get the last completed super over to determine who bats first
    // If this is the first super over, team1 bats first
    // Otherwise alternate based on previous super over result
    const updatedInnings = await base44.entities.Innings.filter({ match_id: matchId });
    const lastSuperOver = updatedInnings
      .filter(i => i.is_super_over && i.status === 'completed')
      .sort((a, b) => b.innings_number - a.innings_number)[0];
    
    // For first super over, team1 bats. For subsequent, alternate
    const battingTeamId = lastSuperOver ? lastSuperOver.bowling_team_id : match.team1_id;
    const bowlingTeamId = lastSuperOver ? lastSuperOver.batting_team_id : match.team2_id;

    await base44.entities.Match.update(matchId, {
      status: 'super_over',
      super_over_count: superOverNum
    });

    await base44.entities.Innings.create({
      match_id: matchId,
      innings_number: 3 + (superOverNum - 1) * 2,
      batting_team_id: battingTeamId,
      bowling_team_id: bowlingTeamId,
      is_super_over: true,
      super_over_number: superOverNum,
      status: 'not_started'
    });

    await refetchAll();
    setShowEndInningsDialog(false);
    setShowSelectBatter(true);
    setPendingAction('select_opener_1');
  };

  // Open visual tracking, then process after.
  // Quick Scoring (enable_visual_tagging === false) skips the tagging modal
  // and logs the ball with just the outcome in one tap.
  const triggerDelivery = (deliveryData) => {
    if (processingRef.current) return;
    if (match?.enable_visual_tagging === false) {
      const profile = bowlerProfile[currentInnings?.current_bowler_id] || {};
      processDelivery({
        ...deliveryData,
        bowler_hand: profile.hand,
        bowler_type: profile.type
      });
      return;
    }
    setPendingDelivery(deliveryData);
    setShowVisualTracking(true);
  };

  const handleVisualConfirm = (visualData) => {
    setShowVisualTracking(false);
    if (pendingDelivery) {
      const currentBowlerId = currentInnings?.current_bowler_id;
      const profile = bowlerProfile[currentBowlerId] || {};
      processDelivery({
        ...pendingDelivery,
        ...visualData,
        bowler_hand: profile.hand,
        bowler_type: profile.type,
      });
      setPendingDelivery(null);
    }
  };

  const handleScore = (runs) => {
    triggerDelivery({
      runs_bat: runs,
      is_boundary: runs === 4,
      is_six: runs === 6
    });
  };

  const handleExtra = (type) => {
    setExtraType(type);
    setShowExtrasModal(true);
  };

  const handleExtraConfirm = (extraData) => {
    let deliveryData;
    if (extraData.extra_type === 'wide') {
      deliveryData = { is_wide: true, wide_runs: match.wide_runs || 1, runs_bat: extraData.additional_runs };
    } else if (extraData.extra_type === 'no_ball') {
      deliveryData = { is_no_ball: true, no_ball_runs: match.no_ball_runs || 1, runs_bat: extraData.additional_runs, is_wide: extraData.include_wide || false, wide_runs: extraData.include_wide ? match.wide_runs || 1 : 0 };
    } else if (extraData.extra_type === 'bye') {
      deliveryData = { is_bye: true, bye_runs: extraData.additional_runs };
    } else if (extraData.extra_type === 'leg_bye') {
      deliveryData = { is_leg_bye: true, leg_bye_runs: extraData.additional_runs };
    }
    if (deliveryData) triggerDelivery(deliveryData);
  };

  const handleWicket = () => {
    setShowWicketModal(true);
  };

  const handleWicketConfirm = (wicketData) => {
    triggerDelivery({
      runs_bat: wicketData.runs_before_wicket || 0,
      is_wicket: true,
      wicket_type: wicketData.wicket_type,
      player_out_id: wicketData.player_out_id,
      fielder_id: wicketData.fielder_id,
      runout_end: wicketData.runout_end,
      is_run_out: wicketData.is_run_out
    });
  };

  const handleSwapStrike = () => {
    if (processingRef.current) return;
    const liveInnings = getLiveState().innings;
    if (!liveInnings?.current_striker_id || !liveInnings?.current_non_striker_id) return;
    // Instant: swap on screen now, persist on the background queue
    applyInningsPatch({
      current_striker_id: liveInnings.current_non_striker_id,
      current_non_striker_id: liveInnings.current_striker_id
    });
  };

  // Instant undo: the reversal is computed from the freshest cached state and
  // painted on screen synchronously; the database writes run behind it on the
  // serial queue (resolving temp record ids once their creates have landed).
  const handleUndo = () => {
    if (processingRef.current) return;
    const live = getLiveState();
    const liveInnings = live.innings;
    if (!liveInnings) return;
    const liveBatterInningsMap = live.batters.reduce((acc, b) => ({ ...acc, [b.player_id]: b }), {});
    const liveBowlerInningsMap = live.bowlers.reduce((acc, b) => ({ ...acc, [b.player_id]: b }), {});
    const livePartnerships = live.pships;

    // The most recently tapped ball comes off the session delivery stack —
    // the exact ball the scorer just logged, immune to background refetches.
    // The cache-based lookup below remains only as a fallback for balls
    // scored before a page reload (when the stack is empty).
    let lastDelivery = deliveryStackRef.current.pop() || null;
    if (!lastDelivery) {
      const currentOverBalls = (queryClient.getQueryData(['deliveries', liveInnings.id, liveInnings.current_over_number]) || [])
        .filter((d) => !d.is_voided);
      lastDelivery = currentOverBalls[currentOverBalls.length - 1] ||
        ((queryClient.getQueryData(['deliveries', liveInnings.id, liveInnings.current_over_number - 1]) || [])
          .filter((d) => !d.is_voided).pop() || null);
    }
    if (!lastDelivery) return;

    const isLegal = lastDelivery.is_legal_delivery;
    let newBallInOver = liveInnings.current_ball_in_over - (isLegal ? 1 : 0);
    let newOverNumber = liveInnings.current_over_number;

    if (newBallInOver < 0) {
      newBallInOver = 5;
      newOverNumber -= 1;
    }

    const isByeOrLegBye = lastDelivery.is_bye || lastDelivery.is_leg_bye;
    const undoRunsByBat = isByeOrLegBye ? 0 : (lastDelivery.runs_bat || 0);
    const newTotalBalls = liveInnings.total_balls - (isLegal ? 1 : 0);

    // If this delivery completed the over, the app advanced to a new over and
    // prompted for a new bowler. Undoing it must hand the ball back to the
    // previous bowler and drop the new bowler's fresh (0/0) spell.
    const overCompletedByThisBall = isLegal && liveInnings.current_ball_in_over === 0;
    const previousBowlerId = lastDelivery.bowler_id;
    const newBowlerId = liveInnings.current_bowler_id;
    const revertBowler = overCompletedByThisBall && newBowlerId && newBowlerId !== previousBowlerId;

    const inningsUndo = {
      total_runs: liveInnings.total_runs - lastDelivery.runs_total,
      total_wickets: liveInnings.total_wickets - (lastDelivery.is_wicket ? 1 : 0),
      total_balls: newTotalBalls,
      total_overs: Math.floor(newTotalBalls / 6),
      current_ball_in_over: newBallInOver,
      current_over_number: newOverNumber,
      current_striker_id: lastDelivery.striker_id,
      current_non_striker_id: lastDelivery.non_striker_id,
      extras_wide: liveInnings.extras_wide - (lastDelivery.wide_runs || 0),
      extras_no_ball: liveInnings.extras_no_ball - (lastDelivery.no_ball_runs || 0),
      extras_byes: liveInnings.extras_byes - (lastDelivery.bye_runs || 0),
      extras_leg_byes: liveInnings.extras_leg_byes - (lastDelivery.leg_bye_runs || 0)
    };
    if (revertBowler) {
      inningsUndo.current_bowler_id = previousBowlerId;
    }

    // ---- Reversals, computed from the live state ----
    const batterUpdates = [];
    if (!lastDelivery.is_wide) {
      const strikerStats = liveBatterInningsMap[lastDelivery.striker_id];
      if (strikerStats) {
        const wasOut = lastDelivery.is_wicket && lastDelivery.player_out_id === lastDelivery.striker_id;
        batterUpdates.push({
          record: strikerStats,
          fields: {
            runs: (strikerStats.runs || 0) - undoRunsByBat,
            balls_faced: (strikerStats.balls_faced || 0) - (isLegal || lastDelivery.is_no_ball ? 1 : 0),
            fours: (strikerStats.fours || 0) - (lastDelivery.is_boundary ? 1 : 0),
            sixes: (strikerStats.sixes || 0) - (lastDelivery.is_six ? 1 : 0),
            dots: (strikerStats.dots || 0) - (isByeOrLegBye ? 0 : (undoRunsByBat === 0 && isLegal ? 1 : 0)),
            is_out: wasOut ? false : strikerStats.is_out,
            dismissal_type: wasOut ? null : strikerStats.dismissal_type,
            dismissed_by_bowler_id: wasOut ? null : strikerStats.dismissed_by_bowler_id,
            dismissed_by_fielder_id: wasOut ? null : strikerStats.dismissed_by_fielder_id,
            status: wasOut ? 'batting' : strikerStats.status
          }
        });
      }
    }

    // Reverse a non-striker run-out dismissal (the out batter isn't the striker)
    if (lastDelivery.is_wicket && lastDelivery.player_out_id && lastDelivery.player_out_id !== lastDelivery.striker_id) {
      const outStats = liveBatterInningsMap[lastDelivery.player_out_id];
      if (outStats) {
        batterUpdates.push({
          record: outStats,
          fields: { is_out: false, dismissal_type: null, dismissed_by_bowler_id: null, dismissed_by_fielder_id: null, status: 'batting' }
        });
      }
    }

    // Reverse bowler stats — byes/leg-byes don't count against the bowler
    let bowlerUpdate = null;
    const bowlerStats = liveBowlerInningsMap[lastDelivery.bowler_id];
    if (bowlerStats) {
      const newBalls = (bowlerStats.balls || 0) - (isLegal ? 1 : 0);
      const bowlerRunsConceded = (isByeOrLegBye ? 0 : undoRunsByBat) + (lastDelivery.wide_runs || 0) + (lastDelivery.no_ball_runs || 0);
      bowlerUpdate = {
        record: bowlerStats,
        fields: {
          balls: newBalls,
          overs: Math.floor(newBalls / 6),
          runs_conceded: (bowlerStats.runs_conceded || 0) - bowlerRunsConceded,
          wickets: (bowlerStats.wickets || 0) - (lastDelivery.is_wicket && !lastDelivery.runout_end ? 1 : 0),
          wides: (bowlerStats.wides || 0) - (lastDelivery.is_wide ? 1 : 0),
          no_balls: (bowlerStats.no_balls || 0) - (lastDelivery.is_no_ball ? 1 : 0),
          dots: (bowlerStats.dots || 0) - (isLegal && bowlerRunsConceded === 0 && !isByeOrLegBye ? 1 : 0),
          fours_conceded: (bowlerStats.fours_conceded || 0) - (!isByeOrLegBye && undoRunsByBat === 4 ? 1 : 0),
          sixes_conceded: (bowlerStats.sixes_conceded || 0) - (!isByeOrLegBye && undoRunsByBat === 6 ? 1 : 0)
        }
      };
    }

    // Reverse the partnership contribution
    const undoPartnership = livePartnerships.find(p =>
      (p.batter1_id === lastDelivery.striker_id && p.batter2_id === lastDelivery.non_striker_id) ||
      (p.batter1_id === lastDelivery.non_striker_id && p.batter2_id === lastDelivery.striker_id)
    );
    let pshipUndo = null;
    if (undoPartnership) {
      const undoStrikerIsBatter1 = undoPartnership.batter1_id === lastDelivery.striker_id;
      const undoBallFaced = lastDelivery.is_legal_delivery || lastDelivery.is_no_ball;
      const fields = {
        runs: (undoPartnership.runs || 0) - (lastDelivery.runs_total || 0),
        balls: (undoPartnership.balls || 0) - (lastDelivery.is_legal_delivery ? 1 : 0)
      };
      if (undoStrikerIsBatter1) {
        fields.batter1_runs = (undoPartnership.batter1_runs || 0) - undoRunsByBat;
        fields.batter1_balls = (undoPartnership.batter1_balls || 0) - (undoBallFaced ? 1 : 0);
      } else {
        fields.batter2_runs = (undoPartnership.batter2_runs || 0) - undoRunsByBat;
        fields.batter2_balls = (undoPartnership.batter2_balls || 0) - (undoBallFaced ? 1 : 0);
      }
      if (lastDelivery.is_wicket) {
        fields.is_active = true;
        fields.how_ended = null;
      }
      pshipUndo = { record: undoPartnership, fields };
    }

    // Reversing a wicket also means the incoming batter never came to the
    // crease. Their fresh (0/0, batting) stats record and any 0/0 partnership
    // created for them are orphaned — remove them so they can be chosen again.
    let deleteBatterRecord = null;
    let deletePshipRecord = null;
    if (lastDelivery.is_wicket) {
      const incomingBatterId = [liveInnings.current_striker_id, liveInnings.current_non_striker_id].find(
        (id) => id && id !== lastDelivery.striker_id && id !== lastDelivery.non_striker_id
      );
      if (incomingBatterId) {
        const incomingStats = liveBatterInningsMap[incomingBatterId];
        if (incomingStats && (incomingStats.runs || 0) === 0 && (incomingStats.balls_faced || 0) === 0 && incomingStats.status === 'batting') {
          deleteBatterRecord = incomingStats;
        }
        const stalePship = livePartnerships.find((p) =>
          p.is_active &&
          (p.batter1_id === incomingBatterId || p.batter2_id === incomingBatterId) &&
          (p.runs || 0) === 0 && (p.balls || 0) === 0
        );
        if (stalePship) {
          deletePshipRecord = stalePship;
        }
      }
    }

    // Drop the fresh 0/0 spell of a bowler chosen after the over rolled back
    let deleteBowlerRecord = null;
    if (revertBowler) {
      const newBowlerStats = liveBowlerInningsMap[newBowlerId];
      if (newBowlerStats && (newBowlerStats.balls || 0) === 0 && (newBowlerStats.runs_conceded || 0) === 0 && (newBowlerStats.wickets || 0) === 0) {
        deleteBowlerRecord = newBowlerStats;
      }
    }

    // ---- 1) Instant UI: reverse everything in the cache synchronously ----
    const lastOverKey = ['deliveries', liveInnings.id, lastDelivery.over_number];
    queryClient.setQueryData(lastOverKey,
      (queryClient.getQueryData(lastOverKey) || []).filter((d) => d.id !== lastDelivery.id));

    queryClient.setQueryData(['innings', matchId],
      live.allInnings.map((i) => i.id === liveInnings.id ? { ...i, ...inningsUndo } : i));

    const batterFieldMap = {};
    batterUpdates.forEach((u) => { batterFieldMap[u.record.id] = u.fields; });
    queryClient.setQueryData(['batter-innings', liveInnings.id],
      live.batters
        .filter((b) => !(deleteBatterRecord && b.id === deleteBatterRecord.id))
        .map((b) => batterFieldMap[b.id] ? { ...b, ...batterFieldMap[b.id] } : b));

    if (bowlerUpdate || deleteBowlerRecord) {
      queryClient.setQueryData(['bowler-innings', liveInnings.id],
        live.bowlers
          .filter((b) => !(deleteBowlerRecord && b.id === deleteBowlerRecord.id))
          .map((b) => (bowlerUpdate && b.id === bowlerUpdate.record.id) ? { ...b, ...bowlerUpdate.fields } : b));
    }

    queryClient.setQueryData(['partnerships', liveInnings.id],
      livePartnerships
        .filter((p) => !(deletePshipRecord && p.id === deletePshipRecord.id))
        .map((p) => (pshipUndo && p.id === pshipUndo.record.id) ? { ...p, ...pshipUndo.fields } : p));

    // ---- 2) Background persist on the serial queue, then reconcile ----
    queueWrites(async () => {
      const writes = [
        base44.entities.Delivery.update(tempDeliveryIdsRef.current[lastDelivery.id] || lastDelivery.id, {
          is_voided: true,
          void_reason: 'Undo by scorer'
        }),
        base44.entities.Innings.update(liveInnings.id, inningsUndo)
      ];
      batterUpdates.forEach((u) =>
        writes.push(base44.entities.BatterInnings.update(tempBatterIdsRef.current[u.record.id] || u.record.id, u.fields)));
      if (bowlerUpdate) {
        writes.push(base44.entities.BowlerInnings.update(tempBowlerIdsRef.current[bowlerUpdate.record.id] || bowlerUpdate.record.id, bowlerUpdate.fields));
      }
      if (pshipUndo) {
        writes.push(base44.entities.Partnership.update(tempPshipIdsRef.current[pshipUndo.record.id] || pshipUndo.record.id, pshipUndo.fields));
      }
      if (deleteBatterRecord) {
        writes.push(base44.entities.BatterInnings.delete(tempBatterIdsRef.current[deleteBatterRecord.id] || deleteBatterRecord.id));
      }
      if (deleteBowlerRecord) {
        writes.push(base44.entities.BowlerInnings.delete(tempBowlerIdsRef.current[deleteBowlerRecord.id] || deleteBowlerRecord.id));
      }
      if (deletePshipRecord) {
        writes.push(base44.entities.Partnership.delete(tempPshipIdsRef.current[deletePshipRecord.id] || deletePshipRecord.id));
      }
      await Promise.all(writes);
    }, refetchAll);
  };

  const handleSelectBatter = (playerId) => {
    const currentPendingAction = pendingAction;
    const live = getLiveState();
    const liveInnings = live.innings;
    if (!liveInnings) return;

    // Optimistically add the batter's stats record — the crease updates on
    // screen instantly and the real record is created on the background queue.
    const existingStats = live.batters.find((b) => b.player_id === playerId);
    if (!existingStats) {
      const tempBatId = `tmp-bat-${Date.now()}`;
      const optimisticStats = {
        id: tempBatId,
        match_id: matchId,
        innings_id: liveInnings.id,
        player_id: playerId,
        batting_position: live.batters.length + 1,
        status: 'batting',
        runs: 0, balls_faced: 0, fours: 0, sixes: 0, dots: 0, singles: 0, twos: 0, threes: 0,
        strike_rate: 0, is_out: false
      };
      queryClient.setQueryData(['batter-innings', liveInnings.id], [...live.batters, optimisticStats]);
      queueWrites(async () => {
        const created = await base44.entities.BatterInnings.create({
          match_id: matchId,
          innings_id: liveInnings.id,
          player_id: playerId,
          batting_position: optimisticStats.batting_position,
          status: 'batting'
        });
        tempBatterIdsRef.current[tempBatId] = created.id;
      });
    }

    if (currentPendingAction === 'select_opener_1') {
      applyInningsPatch({ current_striker_id: playerId, status: 'in_progress' });
      setPendingAction('select_opener_2');
    } else if (currentPendingAction === 'select_opener_2') {
      applyInningsPatch({ current_non_striker_id: playerId });
      setShowSelectBatter(false);
      setPendingAction('select_opening_bowler');
      setShowSelectBowler(true);
    } else if (currentPendingAction === 'new_batter' || currentPendingAction === 'new_batter_then_bowler') {
      // The empty crease is the null slot (strike already rotated on the ball)
      const patch = liveInnings.current_striker_id
        ? { current_non_striker_id: playerId }
        : { current_striker_id: playerId };
      applyInningsPatch(patch);
      setShowSelectBatter(false);
      if (currentPendingAction === 'new_batter_then_bowler') {
        setPendingAction('new_bowler');
        setShowSelectBowler(true);
      } else {
        setPendingAction(null);
        setProcessingLocked(false); // wicket flow complete — scoring resumes
      }
    } else if (currentPendingAction === 'change_striker' || currentPendingAction === 'change_non_striker') {
      // Replace a batter picked by mistake who hasn't faced a ball: swap the
      // crease slot and drop their fresh (0/0) stats record so they can be
      // picked again later.
      const slotKey = currentPendingAction === 'change_striker' ? 'current_striker_id' : 'current_non_striker_id';
      const outgoingStats = live.batters.find((b) => b.player_id === liveInnings[slotKey]);
      if (outgoingStats && (outgoingStats.balls_faced || 0) === 0 && (outgoingStats.runs || 0) === 0) {
        queryClient.setQueryData(['batter-innings', liveInnings.id],
          (queryClient.getQueryData(['batter-innings', liveInnings.id]) || [])
            .filter((b) => b.id !== outgoingStats.id));
        queueWrites(() => base44.entities.BatterInnings.delete(
          tempBatterIdsRef.current[outgoingStats.id] || outgoingStats.id));
      }
      applyInningsPatch({ [slotKey]: playerId });
      setShowSelectBatter(false);
      setPendingAction(null);
      setProcessingLocked(false);
    }
  };

  const handleSelectBowler = (playerId) => {
    const live = getLiveState();
    const liveInnings = live.innings;
    if (!liveInnings) return;
    const currentPendingAction = pendingAction;

    // Correcting a bowler picked by mistake before the over started: drop the
    // outgoing bowler's fresh (all-zero) stats record so the scorecard stays
    // clean and he can be picked again later. An injury change keeps the
    // outgoing bowler's stats — the balls he bowled stand.
    let deleteOutgoingRecord = null;
    if (currentPendingAction === 'change_bowler') {
      const outgoing = live.bowlers.find((b) => b.player_id === liveInnings.current_bowler_id);
      if (outgoing && (outgoing.balls || 0) === 0 && (outgoing.runs_conceded || 0) === 0 && (outgoing.wickets || 0) === 0) {
        deleteOutgoingRecord = outgoing;
      }
    }

    // Optimistically add the bowler's stats record — the bowler card updates
    // instantly and the real record is created on the background queue.
    const existingStats = live.bowlers.find((b) => b.player_id === playerId);
    if (!existingStats) {
      const tempBowlId = `tmp-bowl-${Date.now()}`;
      const optimisticStats = {
        id: tempBowlId,
        match_id: matchId,
        innings_id: liveInnings.id,
        player_id: playerId,
        overs: 0, balls: 0, runs_conceded: 0, wickets: 0, maidens: 0, economy: 0,
        wides: 0, no_balls: 0, dots: 0, fours_conceded: 0, sixes_conceded: 0,
        current_over_runs: 0, spell_overs: []
      };
      queryClient.setQueryData(['bowler-innings', liveInnings.id], [...live.bowlers, optimisticStats]);
      queueWrites(async () => {
        const created = await base44.entities.BowlerInnings.create({
          match_id: matchId,
          innings_id: liveInnings.id,
          player_id: playerId
        });
        tempBowlerIdsRef.current[tempBowlId] = created.id;
      });
    }

    if (deleteOutgoingRecord) {
      queryClient.setQueryData(['bowler-innings', liveInnings.id],
        (queryClient.getQueryData(['bowler-innings', liveInnings.id]) || [])
          .filter((b) => b.id !== deleteOutgoingRecord.id));
      queueWrites(() => base44.entities.BowlerInnings.delete(
        tempBowlerIdsRef.current[deleteOutgoingRecord.id] || deleteOutgoingRecord.id));
    }

    applyInningsPatch({ current_bowler_id: playerId });

    setShowSelectBowler(false);
    setPendingAction(null);
    setProcessingLocked(false); // over/new-bowler flow complete — scoring resumes

    // Show bowler profile modal if not already profiled (skipped in Quick Scoring)
    if (match?.enable_visual_tagging !== false && !bowlerProfile[playerId]) {
      setPendingBowlerId(playerId);
      setShowBowlerProfile(true);
    }
  };

  const handleBowlerProfileConfirm = (profile) => {
    if (profile && pendingBowlerId) {
      setBowlerProfile(prev => ({ ...prev, [pendingBowlerId]: profile }));
    }
    setShowBowlerProfile(false);
    setPendingBowlerId(null);
  };

  // Correct a bowler picked by mistake — only before the over has started.
  const handleChangeBowler = () => {
    if (processingRef.current) return;
    setPendingAction('change_bowler');
    setShowSelectBowler(true);
  };

  // Bowler injured mid-over: a replacement finishes this over's remaining
  // balls. Stats accrue per ball to whoever is the current bowler, so the
  // injured bowler keeps what he bowled (e.g. 0.2) and the replacement's
  // count keeps growing with everything he bowls afterwards.
  const handleBowlerInjured = () => {
    if (processingRef.current) return;
    setPendingAction('bowler_injured');
    setShowSelectBowler(true);
  };

  // Correct a batter picked by mistake — only while they haven't faced a ball.
  const handleChangeBatter = (slot) => {
    if (processingRef.current) return;
    setPendingAction(slot); // 'change_striker' | 'change_non_striker'
    setShowSelectBatter(true);
  };

  const availableBatters = battingTeamPlayingXI.
  filter((pId) => {
    const stats = batterInningsMap[pId];
    if (!stats) return true;
    return stats.status === 'yet_to_bat';
  }).
  filter((pId) => pId !== currentInnings?.current_striker_id && pId !== currentInnings?.current_non_striker_id).
  map((pId) => ({ player_id: pId }));

  // A batter who hasn't faced a ball can still be swapped (wrong pick).
  const strikerChangeable = currentInnings?.status === 'in_progress' && currentStriker &&
    (currentStriker.balls_faced || 0) === 0 && (currentStriker.runs || 0) === 0;
  const nonStrikerChangeable = currentInnings?.status === 'in_progress' && currentNonStriker &&
    (currentNonStriker.balls_faced || 0) === 0 && (currentNonStriker.runs || 0) === 0;

  // The bowler can be corrected only before the over's first ball, or
  // replaced mid-over if injured.
  const overHasDeliveries = currentOverDeliveries.some((d) => !d.is_voided);
  const bowlerChangeable = currentInnings?.status === 'in_progress' && !!currentInnings?.current_bowler_id && !overHasDeliveries;
  const bowlerInjuryAllowed = currentInnings?.status === 'in_progress' && !!currentInnings?.current_bowler_id && overHasDeliveries;

  if (matchLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>);

  }

  if (!match) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Match not found</h2>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Go to Home
          </Button>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <ScoreHeader
        match={match}
        innings={currentInnings}
        allInnings={allInnings}
        team1Name={team1Name}
        team2Name={team2Name}
        onMenuOpen={() => setShowMenuDialog(true)} />


      <div className="px-4 py-3">
        <div className="flex gap-3 mb-3">
          <BatterCard
            batter={currentStriker}
            isStriker={true}
            playerName={playersMap[currentInnings?.current_striker_id]?.name} />

          <BatterCard
            batter={currentNonStriker}
            isStriker={false}
            playerName={playersMap[currentInnings?.current_non_striker_id]?.name} />

        </div>

        {/* Change a batter picked by mistake (only before they face a ball) */}
        {(strikerChangeable || nonStrikerChangeable) && !processing && (
          <div className="flex gap-2 mb-3">
            {strikerChangeable && (
              <button
                onClick={() => handleChangeBatter('change_striker')}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors">
                Change Striker
              </button>
            )}
            {nonStrikerChangeable && (
              <button
                onClick={() => handleChangeBatter('change_non_striker')}
                className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors">
                Change Non-Striker
              </button>
            )}
          </div>
        )}
        
        {/* Swap Strike Button */}
        {currentInnings?.current_striker_id && currentInnings?.current_non_striker_id && (
          <button
            onClick={handleSwapStrike}
            disabled={processing}
            className="w-full mb-3 py-2 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3L4 7l4 4"/>
              <path d="M4 7h16"/>
              <path d="m16 21 4-4-4-4"/>
              <path d="M20 17H4"/>
            </svg>
            Swap Strike
          </button>
        )}
        <BowlerCard
          bowler={currentBowler}
          playerName={playersMap[currentInnings?.current_bowler_id]?.name} />

        {/* Correct the bowler before the over starts, or replace an injured one mid-over */}
        {(bowlerChangeable || bowlerInjuryAllowed) && !processing && (
          <div className="flex gap-2 mt-3">
            {bowlerChangeable && (
              <button
                onClick={handleChangeBowler}
                className="flex-1 py-2 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors">
                Change Bowler
              </button>
            )}
            {bowlerInjuryAllowed && (
              <button
                onClick={handleBowlerInjured}
                className="flex-1 py-2 px-4 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/25 transition-colors">
                Bowler Injured — Replace
              </button>
            )}
          </div>
        )}

      </div>

      <ThisOver deliveries={currentOverDeliveries.filter((d) => !d.is_voided)} />

      <div className="flex-1" />

      <ScoringKeypad
        onScore={handleScore}
        onExtra={handleExtra}
        onWicket={handleWicket}
        onUndo={handleUndo}
        disabled={processing || !currentInnings?.current_striker_id || !currentInnings?.current_bowler_id} />


      <WicketModal
        open={showWicketModal}
        onClose={() => setShowWicketModal(false)}
        onConfirm={handleWicketConfirm}
        striker={currentInnings?.current_striker_id}
        nonStriker={currentInnings?.current_non_striker_id}
        strikerName={playersMap[currentInnings?.current_striker_id]?.name}
        nonStrikerName={playersMap[currentInnings?.current_non_striker_id]?.name}
        bowlingTeamPlayers={bowlingTeamPlayingXI}
        playersMap={playersMap} />


      <ExtrasModal
        open={showExtrasModal}
        onClose={() => setShowExtrasModal(false)}
        onConfirm={handleExtraConfirm}
        extraType={extraType}
        matchConfig={match} />


      <SelectBatterModal
        open={showSelectBatter}
        onClose={() => {
          // Change flows are cancellable; scoring flows stay gated until picked
          if (pendingAction === 'change_striker' || pendingAction === 'change_non_striker') {
            setShowSelectBatter(false);
            setPendingAction(null);
          }
        }}
        onSelect={handleSelectBatter}
        availableBatters={availableBatters}
        playersMap={playersMap}
        title={pendingAction === 'change_striker' || pendingAction === 'change_non_striker'
          ? 'Change Batter'
          : pendingAction?.includes('opener') ? 'Select Opening Batter' : 'Select Next Batter'} />


      <SelectBowlerModal
        open={showSelectBowler}
        onClose={() => {
          // Change/injury flows are cancellable; scoring flows stay gated until picked
          if (pendingAction === 'change_bowler' || pendingAction === 'bowler_injured') {
            setShowSelectBowler(false);
            setPendingAction(null);
          }
        }}
        onSelect={handleSelectBowler}
        bowlingTeamPlayers={bowlingTeamPlayingXI}
        bowlerStats={bowlerInningsMap}
        playersMap={playersMap}
        maxOversPerBowler={match?.max_overs_per_bowler}
        lastBowlerId={currentInnings?.current_bowler_id}
        title={pendingAction === 'select_opening_bowler'
          ? 'Select Opening Bowler'
          : pendingAction === 'bowler_injured'
          ? 'Bowler Injured — Select Replacement'
          : pendingAction === 'change_bowler'
          ? 'Change Bowler'
          : 'Select Bowler'} />


      <FollowOnModal
        open={showFollowOnDialog}
        teamAName={teamsMap[match?.batting_team_id]?.name || 'Team A'}
        teamBName={teamsMap[getSecondBattingTeamId(match)]?.name || 'Team B'}
        lead={followOnLead}
        onEnforce={() => handleFollowOn(true)}
        onDecline={() => handleFollowOn(false)}
      />

      <Dialog open={showEndInningsDialog} onOpenChange={setShowEndInningsDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-center">Match Tied!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-slate-400">Both teams scored the same. Would you like to start a Super Over?</p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                base44.entities.Match.update(matchId, {
                  status: 'completed',
                  result: 'Match Tied'
                });
                navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
              }}
              className="flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">

              End as Tie
            </Button>
            <Button
              onClick={startSuperOver}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600">

              Super Over
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BowlerProfileModal
        open={showBowlerProfile}
        bowlerName={playersMap[pendingBowlerId]?.name}
        onConfirm={handleBowlerProfileConfirm}
      />

      <VisualTrackingModal
        open={showVisualTracking}
        onClose={() => { setShowVisualTracking(false); setPendingDelivery(null); }}
        onConfirm={handleVisualConfirm}
        runs={pendingDelivery?.runs_bat}
        isWicket={pendingDelivery?.is_wicket}
        bowlerType={bowlerProfile[currentInnings?.current_bowler_id]?.type}
        fieldingTeamPlayers={bowlingTeamPlayingXI.map(pid => playersMap[pid]).filter(Boolean)}
        playersMap={playersMap}
      />

      <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Match Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              variant="outline" className="bg-slate-700 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-full justify-start border-slate-700"

              onClick={() => {
                setShowMenuDialog(false);
                navigate(createPageUrl('Scorecard') + `?matchId=${matchId}`);
              }}>

              View Scorecard
            </Button>
            <Button
              variant="outline" className="bg-slate-700 px-4 py-2 text-sm font-medium opacity-100 rounded-md inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:bg-accent hover:text-accent-foreground h-9 w-full justify-start border-slate-700"

              onClick={() => {
                setShowMenuDialog(false);
                // Wait for any in-flight ball writes before ending the innings
                writeChainRef.current.then(() => endInnings('declared'));
              }}>

              {isTest ? 'Declare Innings' : 'End Innings'}
            </Button>
            <Button
              variant="outline" className="bg-slate-700 text-red-400 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:bg-accent h-9 w-full justify-start border-slate-700 hover:text-red-300"

              onClick={async () => {
                await base44.entities.Match.update(matchId, {
                  status: 'abandoned',
                  result: 'Match Abandoned'
                });
                navigate(createPageUrl('Home'));
              }}>

              Abandon Match
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);

}