import React, { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter } from
'@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  const [pendingAction, setPendingAction] = useState(null);
  const [showVisualTracking, setShowVisualTracking] = useState(false);
  const [pendingDelivery, setPendingDelivery] = useState(null);
  const [bowlerProfile, setBowlerProfile] = useState({}); // { [playerId]: { hand, type } }

  const { data: match, isLoading: matchLoading, refetch: refetchMatch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const matches = await base44.entities.Match.filter({ id: matchId });
      return matches[0];
    },
    enabled: !!matchId
  });

  const { data: allInnings = [], refetch: refetchInnings } = useQuery({
    queryKey: ['innings', matchId],
    queryFn: () => base44.entities.Innings.filter({ match_id: matchId }),
    enabled: !!matchId
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
    enabled: !!currentInnings?.id
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
    enabled: !!currentInnings?.id
  });

  const { data: bowlerInnings = [], refetch: refetchBowlerInnings } = useQuery({
    queryKey: ['bowler-innings', currentInnings?.id],
    queryFn: () => currentInnings ?
    base44.entities.BowlerInnings.filter({ innings_id: currentInnings.id }) :
    [],
    enabled: !!currentInnings?.id
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

  const maxOvers = currentInnings?.is_super_over ? 1 : match?.overs_per_innings || 20;
  const maxWickets = currentInnings?.is_super_over ? 2 : 10;

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

  const refetchAll = async () => {
    await Promise.all([
    refetchMatch(),
    refetchInnings(),
    refetchDeliveries(),
    refetchBatterInnings(),
    refetchBowlerInnings()]
    );
  };

  const processDelivery = async (deliveryData) => {
    const isLegal = !deliveryData.is_wide && !deliveryData.is_no_ball;
    const runsScoredByBat = deliveryData.is_bye || deliveryData.is_leg_bye ? 0 : deliveryData.runs_bat || 0;
    const totalRuns = runsScoredByBat + (
    deliveryData.wide_runs || 0) + (
    deliveryData.no_ball_runs || 0) + (
    deliveryData.bye_runs || 0) + (
    deliveryData.leg_bye_runs || 0);

    await base44.entities.Delivery.create({
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
      is_dot_ball: isLegal && totalRuns === 0 && !deliveryData.is_wicket,
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
      timestamp: new Date().toISOString()
    });

    const strikerStats = batterInningsMap[currentInnings.current_striker_id];
    if (strikerStats && !deliveryData.is_wide) {
      // For bye/leg bye: count ball faced but no runs to batter
      const isByeOrLegBye = deliveryData.is_bye || deliveryData.is_leg_bye;
      await base44.entities.BatterInnings.update(strikerStats.id, {
        runs: (strikerStats.runs || 0) + (isByeOrLegBye ? 0 : runsScoredByBat),
        balls_faced: (strikerStats.balls_faced || 0) + (isLegal || deliveryData.is_no_ball ? 1 : 0),
        fours: (strikerStats.fours || 0) + (!isByeOrLegBye && runsScoredByBat === 4 ? 1 : 0),
        sixes: (strikerStats.sixes || 0) + (!isByeOrLegBye && runsScoredByBat === 6 ? 1 : 0),
        dots: (strikerStats.dots || 0) + (isByeOrLegBye ? 0 : (runsScoredByBat === 0 && isLegal ? 1 : 0))
      });
    }

    const bowlerStats = bowlerInningsMap[currentInnings.current_bowler_id];
    if (bowlerStats) {
      const newBalls = (bowlerStats.balls || 0) + (isLegal ? 1 : 0);
      const newOvers = Math.floor(newBalls / 6);
      // Bowler runs conceded should NOT include byes and leg byes
      const isByeOrLegBye = deliveryData.is_bye || deliveryData.is_leg_bye;
      const bowlerRunsConceded = (isByeOrLegBye ? 0 : runsScoredByBat) + (deliveryData.wide_runs || 0) + (deliveryData.no_ball_runs || 0);
      await base44.entities.BowlerInnings.update(bowlerStats.id, {
        balls: newBalls,
        overs: newOvers,
        runs_conceded: (bowlerStats.runs_conceded || 0) + bowlerRunsConceded,
        wickets: (bowlerStats.wickets || 0) + (deliveryData.is_wicket && !deliveryData.is_run_out ? 1 : 0),
        wides: (bowlerStats.wides || 0) + (deliveryData.is_wide ? 1 : 0),
        no_balls: (bowlerStats.no_balls || 0) + (deliveryData.is_no_ball ? 1 : 0),
        dots: (bowlerStats.dots || 0) + (isLegal && bowlerRunsConceded === 0 && !isByeOrLegBye ? 1 : 0),
        fours_conceded: (bowlerStats.fours_conceded || 0) + (!isByeOrLegBye && runsScoredByBat === 4 ? 1 : 0),
        sixes_conceded: (bowlerStats.sixes_conceded || 0) + (!isByeOrLegBye && runsScoredByBat === 6 ? 1 : 0)
      });
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
    if (deliveryData.is_wicket) {
      const playerOutId = deliveryData.player_out_id;
      const outBatterStats = batterInningsMap[playerOutId];
      if (outBatterStats) {
        await base44.entities.BatterInnings.update(outBatterStats.id, {
          is_out: true,
          dismissal_type: deliveryData.wicket_type,
          dismissed_by_bowler_id: deliveryData.is_run_out ? null : currentInnings.current_bowler_id,
          dismissed_by_fielder_id: deliveryData.fielder_id,
          status: 'out'
        });
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

    await base44.entities.Innings.update(currentInnings.id, inningsUpdate);

    await refetchAll();

    const isAllOut = newTotalWickets >= maxWickets;
    const isOversComplete = newOverNumber >= maxOvers && newBallInOver === 0;
    // Target is set to inn1 + 1. Team2 wins if they score >= target (i.e. > inn1 score).
    // Exact tie (inn2 == inn1) is handled at overs_complete/all_out via endInnings.
    const isTargetReached = currentInnings.target && newTotalRuns >= currentInnings.target;

    if (isAllOut || isOversComplete || isTargetReached) {
      await endInnings(isAllOut ? 'all_out' : isOversComplete ? 'overs_complete' : 'target_reached');
      return;
    }

    if (needNewBatter && newTotalWickets < maxWickets) {
      setPendingAction('new_batter');
      setShowSelectBatter(true);
    } else if (needNewBowler) {
      setPendingAction('new_bowler');
      setShowSelectBowler(true);
    }
  };

  const endInnings = async (reason) => {
    await base44.entities.Innings.update(currentInnings.id, {
      status: 'completed',
      end_reason: reason
    });

    const updatedInnings = await base44.entities.Innings.filter({ match_id: matchId });
    
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

      await base44.entities.Innings.create({
        match_id: matchId,
        innings_number: 2,
        batting_team_id: currentInnings.bowling_team_id,
        bowling_team_id: currentInnings.batting_team_id,
        target: currentInnings.total_runs + 1,
        status: 'not_started'
      });

      await refetchAll();
      setShowSelectBatter(true);
      setPendingAction('select_opener_1');
    }
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

  // Open visual tracking, then process after
  const triggerDelivery = (deliveryData) => {
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

  const handleSwapStrike = async () => {
    if (!currentInnings?.current_striker_id || !currentInnings?.current_non_striker_id) return;
    
    await base44.entities.Innings.update(currentInnings.id, {
      current_striker_id: currentInnings.current_non_striker_id,
      current_non_striker_id: currentInnings.current_striker_id
    });
    
    await refetchAll();
  };

  const handleUndo = async () => {
    const deliveries = await base44.entities.Delivery.filter({
      innings_id: currentInnings.id,
      is_voided: false
    });

    if (deliveries.length === 0) return;

    const lastDelivery = deliveries.sort((a, b) =>
    new Date(b.created_date) - new Date(a.created_date)
    )[0];

    await base44.entities.Delivery.update(lastDelivery.id, {
      is_voided: true,
      void_reason: 'Undo by scorer'
    });

    const isLegal = lastDelivery.is_legal_delivery;
    let newBallInOver = currentInnings.current_ball_in_over - (isLegal ? 1 : 0);
    let newOverNumber = currentInnings.current_over_number;

    if (newBallInOver < 0) {
      newBallInOver = 5;
      newOverNumber -= 1;
    }

    await base44.entities.Innings.update(currentInnings.id, {
      total_runs: currentInnings.total_runs - lastDelivery.runs_total,
      total_wickets: currentInnings.total_wickets - (lastDelivery.is_wicket ? 1 : 0),
      total_balls: currentInnings.total_balls - (isLegal ? 1 : 0),
      current_ball_in_over: newBallInOver,
      current_over_number: newOverNumber,
      current_striker_id: lastDelivery.striker_id,
      current_non_striker_id: lastDelivery.non_striker_id,
      extras_wide: currentInnings.extras_wide - (lastDelivery.wide_runs || 0),
      extras_no_ball: currentInnings.extras_no_ball - (lastDelivery.no_ball_runs || 0),
      extras_byes: currentInnings.extras_byes - (lastDelivery.bye_runs || 0),
      extras_leg_byes: currentInnings.extras_leg_byes - (lastDelivery.leg_bye_runs || 0)
    });

    if (!lastDelivery.is_wide) {
      const strikerStats = batterInningsMap[lastDelivery.striker_id];
      if (strikerStats) {
        await base44.entities.BatterInnings.update(strikerStats.id, {
          runs: strikerStats.runs - (lastDelivery.runs_bat || 0),
          balls_faced: strikerStats.balls_faced - (isLegal || lastDelivery.is_no_ball ? 1 : 0),
          fours: strikerStats.fours - (lastDelivery.is_boundary ? 1 : 0),
          sixes: strikerStats.sixes - (lastDelivery.is_six ? 1 : 0),
          is_out: lastDelivery.is_wicket && lastDelivery.player_out_id === lastDelivery.striker_id ? false : strikerStats.is_out,
          status: lastDelivery.is_wicket && lastDelivery.player_out_id === lastDelivery.striker_id ? 'batting' : strikerStats.status
        });
      }
    }

    const bowlerStats = bowlerInningsMap[lastDelivery.bowler_id];
    if (bowlerStats) {
      const newBalls = bowlerStats.balls - (isLegal ? 1 : 0);
      await base44.entities.BowlerInnings.update(bowlerStats.id, {
        balls: newBalls,
        overs: Math.floor(newBalls / 6),
        runs_conceded: bowlerStats.runs_conceded - lastDelivery.runs_total,
        wickets: bowlerStats.wickets - (lastDelivery.is_wicket && !lastDelivery.runout_end ? 1 : 0),
        wides: bowlerStats.wides - (lastDelivery.is_wide ? 1 : 0),
        no_balls: bowlerStats.no_balls - (lastDelivery.is_no_ball ? 1 : 0)
      });
    }

    await refetchAll();
  };

  const handleSelectBatter = async (playerId) => {
    const currentPendingAction = pendingAction;

    let batterStats = batterInnings.find((b) => b.player_id === playerId);
    if (!batterStats) {
      batterStats = await base44.entities.BatterInnings.create({
        match_id: matchId,
        innings_id: currentInnings.id,
        player_id: playerId,
        batting_position: batterInnings.length + 1,
        status: 'batting'
      });
    }

    if (currentPendingAction === 'select_opener_1') {
      await base44.entities.Innings.update(currentInnings.id, {
        current_striker_id: playerId,
        status: 'in_progress'
      });
      setPendingAction('select_opener_2');
      await refetchAll();
    } else if (currentPendingAction === 'select_opener_2') {
      await base44.entities.Innings.update(currentInnings.id, {
        current_non_striker_id: playerId
      });
      setShowSelectBatter(false);
      setPendingAction('select_opening_bowler');
      await refetchAll();
      setShowSelectBowler(true);
    } else if (currentPendingAction === 'new_batter') {
      const latestInnings = await base44.entities.Innings.filter({ id: currentInnings.id });
      const inn = latestInnings[0];

      if (!inn.current_striker_id) {
        await base44.entities.Innings.update(currentInnings.id, {
          current_striker_id: playerId
        });
      } else {
        await base44.entities.Innings.update(currentInnings.id, {
          current_non_striker_id: playerId
        });
      }
      setShowSelectBatter(false);
      setPendingAction(null);
      await refetchAll();
    }
  };

  const handleSelectBowler = async (playerId) => {
    let bowlerStats = bowlerInnings.find((b) => b.player_id === playerId);
    if (!bowlerStats) {
      bowlerStats = await base44.entities.BowlerInnings.create({
        match_id: matchId,
        innings_id: currentInnings.id,
        player_id: playerId
      });
    }

    await base44.entities.Innings.update(currentInnings.id, {
      current_bowler_id: playerId
    });

    setShowSelectBowler(false);
    setPendingAction(null);
    await refetchAll();
  };

  const availableBatters = battingTeamPlayingXI.
  filter((pId) => {
    const stats = batterInningsMap[pId];
    if (!stats) return true;
    return stats.status === 'yet_to_bat';
  }).
  filter((pId) => pId !== currentInnings?.current_striker_id && pId !== currentInnings?.current_non_striker_id).
  map((pId) => ({ player_id: pId }));

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
        
        {/* Swap Strike Button */}
        {currentInnings?.current_striker_id && currentInnings?.current_non_striker_id && (
          <button
            onClick={handleSwapStrike}
            className="w-full mb-3 py-2 px-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
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

      </div>

      <ThisOver deliveries={currentOverDeliveries.filter((d) => !d.is_voided)} />

      <div className="flex-1" />

      <ScoringKeypad
        onScore={handleScore}
        onExtra={handleExtra}
        onWicket={handleWicket}
        onUndo={handleUndo}
        disabled={!currentInnings?.current_striker_id || !currentInnings?.current_bowler_id} />


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
        onClose={() => {}}
        onSelect={handleSelectBatter}
        availableBatters={availableBatters}
        playersMap={playersMap}
        title={pendingAction?.includes('opener') ? 'Select Opening Batter' : 'Select Next Batter'} />


      <SelectBowlerModal
        open={showSelectBowler}
        onClose={() => {}}
        onSelect={handleSelectBowler}
        bowlingTeamPlayers={bowlingTeamPlayingXI}
        bowlerStats={bowlerInningsMap}
        playersMap={playersMap}
        maxOversPerBowler={match?.max_overs_per_bowler}
        lastBowlerId={currentInnings?.current_bowler_id}
        title={pendingAction === 'select_opening_bowler' ? 'Select Opening Bowler' : 'Select Bowler'} />


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
              className="flex-1 border-slate-700">

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

      <VisualTrackingModal
        open={showVisualTracking}
        onClose={() => { setShowVisualTracking(false); setPendingDelivery(null); }}
        onConfirm={handleVisualConfirm}
        runs={pendingDelivery?.runs_bat}
        isWicket={pendingDelivery?.is_wicket}
        bowlerType={bowlerProfile[currentInnings?.current_bowler_id]?.type}
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
                endInnings('declared');
              }}>

              End Innings
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