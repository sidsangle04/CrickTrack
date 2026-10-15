import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Settings2,
  Coins,
  CheckCircle2,
  Loader2,
  Plus } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useGroundShape } from '@/lib/GroundShapeContext';
import usePreMatchPrediction from '@/hooks/usePreMatchPrediction';
import PreMatchPredictionCard from '@/components/prediction/PreMatchPredictionCard';
import { preMatchSummary } from '@/lib/predictionEngine';

const STEPS = ['basics', 'teams', 'playing_xi', 'format', 'toss'];

export default function MatchSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mode } = useGroundShape();
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    venue: '',
    venue_id: '',
    team1_id: '',
    team2_id: '',
    team1_playing_xi: [],
    team2_playing_xi: [],
    overs_per_innings: 20,
    max_overs_per_bowler: 4,
    ball_type: 'leather',
    wide_runs: 1,
    no_ball_runs: 1,
    toss_winner_id: '',
    toss_decision: 'bat',
    allow_multiple_super_overs: true,
    unlimited_batters: false,
    tournament_match_id: '',
    format: 'limited',
    players_per_team: 11,
    is_over_limited: false,
    total_match_overs: 90,
    enable_visual_tagging: true
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams', mode],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: venues } = useQuery({
    queryKey: ['venues', mode],
    queryFn: () =>
      base44.entities.Venue.filter(
        { ground_mode: mode || 'turf' },
        { sort: 'name', limit: 200 }
      )
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players', mode],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: existingMatch } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => matchId ? base44.entities.Match.filter({ id: matchId }) : null,
    enabled: !!matchId
  });

  useEffect(() => {
    if (existingMatch && existingMatch[0]) {
      const m = existingMatch[0];
      setFormData({
        date: m.date || new Date().toISOString().split('T')[0],
        venue: m.venue || '',
        venue_id: m.venue_id || '',
        team1_id: m.team1_id || '',
        team2_id: m.team2_id || '',
        team1_playing_xi: m.team1_playing_xi || [],
        team2_playing_xi: m.team2_playing_xi || [],
        overs_per_innings: m.overs_per_innings || 20,
        max_overs_per_bowler: m.max_overs_per_bowler || 4,
        ball_type: m.ball_type || 'leather',
        wide_runs: m.wide_runs || 1,
        no_ball_runs: m.no_ball_runs || 1,
        toss_winner_id: m.toss_winner_id || '',
        toss_decision: m.toss_decision || 'bat',
        allow_multiple_super_overs: m.allow_multiple_super_overs !== false,
        unlimited_batters: m.unlimited_batters || false,
        format: m.format || 'limited',
        players_per_team: m.players_per_team || 11,
        is_over_limited: m.is_over_limited || false,
        total_match_overs: m.total_match_overs || 90,
        enable_visual_tagging: m.enable_visual_tagging !== false
      });
    }
  }, [existingMatch]);

  useEffect(() => {
    if (matchId) return;
    const t1 = urlParams.get('team1_id');
    const t2 = urlParams.get('team2_id');
    const tm = urlParams.get('tournament_match_id');
    if (t1 || t2 || tm) {
      setFormData((prev) => ({
        ...prev,
        team1_id: t1 || prev.team1_id,
        team2_id: t2 || prev.team2_id,
        tournament_match_id: tm || ''
      }));
    }
  }, []);

  const modeTeams = teams.filter((t) => (t.ground_mode || 'turf') === mode);
  const modeVenues = venues?.items || [];
  const modePlayers = allPlayers.filter((p) => (p.ground_mode || 'turf') === mode);

  const team1Players = modePlayers.filter((p) => p.team_id === formData.team1_id);
  const team2Players = modePlayers.filter((p) => p.team_id === formData.team2_id);

  const teamsMap = modeTeams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});

  // Pre-match win chances from player ratings, head-to-head and recent form.
  const { prediction: preMatchPrediction, isLoading: predictionLoading } = usePreMatchPrediction({
    team1Id: formData.team1_id,
    team2Id: formData.team2_id,
    team1XI: formData.team1_playing_xi,
    team2XI: formData.team2_playing_xi
  });

  const updateMatchMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Match.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['matches']);
      queryClient.invalidateQueries(['match', matchId]);
    }
  });

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleStartMatch = async () => {
    const data = {
      ...formData,
      ground_mode: mode,
      status: 'live',
      prematch_team1_pct: preMatchPrediction ? preMatchPrediction.team1Pct : null,
      prematch_team2_pct: preMatchPrediction ? preMatchPrediction.team2Pct : null,
      prematch_summary: preMatchSummary(preMatchPrediction),
      batting_team_id: formData.toss_decision === 'bat' ?
      formData.toss_winner_id :
      formData.toss_winner_id === formData.team1_id ? formData.team2_id : formData.team1_id,
      bowling_team_id: formData.toss_decision === 'bat' ?
      formData.toss_winner_id === formData.team1_id ? formData.team2_id : formData.team1_id :
      formData.toss_winner_id
    };

    if (matchId) {
      await updateMatchMutation.mutateAsync({ id: matchId, data });

      const existingInnings = await base44.entities.Innings.filter({ match_id: matchId, innings_number: 1 });
      if (existingInnings.length === 0) {
        await base44.entities.Innings.create({
          match_id: matchId,
          innings_number: 1,
          batting_team_id: data.batting_team_id,
          bowling_team_id: data.bowling_team_id,
          status: 'not_started'
        });
      }
      navigate(createPageUrl('LiveScoring') + `?matchId=${matchId}`);
    } else {
      const match = await base44.entities.Match.create(data);
      await base44.entities.Innings.create({
        match_id: match.id,
        innings_number: 1,
        batting_team_id: data.batting_team_id,
        bowling_team_id: data.bowling_team_id,
        status: 'not_started'
      });
      if (data.tournament_match_id) {
        await base44.entities.TournamentMatch.update(data.tournament_match_id, {
          match_id: match.id,
          status: 'in_progress'
        });
      }
      queryClient.invalidateQueries(['matches']);
      navigate(createPageUrl('LiveScoring') + `?matchId=${match.id}`);
    }
  };

  const togglePlayer = (teamNum, playerId) => {
    const key = `team${teamNum}_playing_xi`;
    const current = formData[key];
    if (current.includes(playerId)) {
      setFormData({ ...formData, [key]: current.filter((id) => id !== playerId) });
    } else if (current.length < (formData.format === 'test' ? formData.players_per_team : 11) || formData.unlimited_batters) {
      setFormData({ ...formData, [key]: [...current, playerId] });
    }
  };

  const canProceed = () => {
    switch (STEPS[step]) {
      case 'basics':return formData.venue && formData.date;
      case 'teams':return formData.team1_id && formData.team2_id && formData.team1_id !== formData.team2_id;
      case 'playing_xi':return formData.format === 'test'
        ? formData.team1_playing_xi.length >= formData.players_per_team && formData.team2_playing_xi.length >= formData.players_per_team
        : formData.team1_playing_xi.length >= 2 && formData.team2_playing_xi.length >= 2;
      case 'format':return formData.format === 'test'
        ? formData.players_per_team >= 2 && (!formData.is_over_limited || formData.total_match_overs > 0)
        : formData.overs_per_innings > 0;
      case 'toss':return formData.toss_winner_id && formData.toss_decision;
      default:return true;
    }
  };

  return (
    <div className="pb-24 md:pb-6 max-w-2xl mx-auto">
      <Link
        to={createPageUrl('Home')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">

        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">
        {matchId ? 'Edit Match' : 'New Match'}
      </h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, idx) =>
        <div key={s} className="flex items-center">
            <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            idx < step ? 'bg-emerald-500 text-white' :
            idx === step ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500' :
            'bg-slate-800 text-slate-500'}`
            }>

              {idx < step ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
            </div>
            {idx < STEPS.length - 1 &&
          <div className={`w-12 md:w-20 h-0.5 ${idx < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          }
          </div>
        )}
      </div>

      {/* Step Content */}
      <div className="bg-transparent text-slate-50 mb-6 p-6 rounded-2xl border border-slate-700/50">
        {STEPS[step] === 'basics' &&
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Match Details</h2>
            </div>
            <div>
              <Label className="text-slate-200">Date</Label>
              <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-slate-900 border-slate-700 text-white [&::-webkit-calendar-picker-indicator]:invert" />

            </div>
            <div>
              <Label className="text-slate-200">Venue</Label>
              {modeVenues.length === 0 ?
              <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">No venues saved for this mode yet.</span>
                  <Link to={createPageUrl('Venues')} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium shrink-0">
                    Add Venue
                  </Link>
                </div> :

              <Select
                value={formData.venue_id || ''}
                onValueChange={(v) => {
                  const chosen = modeVenues.find((x) => x.id === v);
                  setFormData({ ...formData, venue_id: v, venue: chosen ? chosen.name : '' });
                }}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue placeholder="Select venue" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {modeVenues.map((v) =>
                  <SelectItem key={v.id} value={v.id} className="text-white">
                        {v.name}{v.location ? ` · ${v.location}` : ''}
                      </SelectItem>
                  )}
                  </SelectContent>
                </Select>
              }
            </div>
          </div>
        }

        {STEPS[step] === 'teams' &&
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Select Teams</h2>
            </div>
            {modeTeams.length === 0 ?
          <div className="text-center py-8">
                <p className="text-slate-400 mb-4">No teams found for this mode. Create teams first.</p>
                <Link to={createPageUrl('TeamManagement')}>
                  <Button className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </Link>
              </div> :

          <>
                <div>
                  <Label className="text-slate-200">Team 1</Label>
                  <Select value={formData.team1_id} onValueChange={(v) => setFormData({ ...formData, team1_id: v, team1_playing_xi: [] })}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {modeTeams.map((t) =>
                  <SelectItem key={t.id} value={t.id} disabled={t.id === formData.team2_id} className="text-white">
                          {t.name}
                        </SelectItem>
                  )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-200">Team 2</Label>
                  <Select value={formData.team2_id} onValueChange={(v) => setFormData({ ...formData, team2_id: v, team2_playing_xi: [] })}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {modeTeams.map((t) =>
                  <SelectItem key={t.id} value={t.id} disabled={t.id === formData.team1_id} className="text-white">
                          {t.name}
                        </SelectItem>
                  )}
                    </SelectContent>
                  </Select>
                </div>
              </>
          }
          </div>
        }

        {STEPS[step] === 'playing_xi' &&
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Select Playing XI</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team 1 */}
              <div>
                <h3 className="font-medium text-white mb-3 flex items-center justify-between">
                  {teamsMap[formData.team1_id]?.name || 'Team 1'}
                  <span className="text-sm text-slate-400">{formData.team1_playing_xi.length}/{formData.format === 'test' ? formData.players_per_team : 11}</span>
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {team1Players.length === 0 ?
                <p className="text-sm text-slate-400">No players in this team</p> :

                team1Players.map((p) =>
                <button
                  key={p.id}
                  onClick={() => togglePlayer(1, p.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  formData.team1_playing_xi.includes(p.id) ?
                  'bg-emerald-500/20 border border-emerald-500/50' :
                  'bg-slate-900 border border-slate-700 hover:border-slate-600'}`
                  }>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.team1_playing_xi.includes(p.id) ?
                  'border-emerald-500 bg-emerald-500' :
                  'border-slate-600'}`
                  }>
                          {formData.team1_playing_xi.includes(p.id) &&
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    }
                        </div>
                        <span className="text-sm font-medium text-white">{p.name}</span>
                      </button>
                )
                }
                </div>
                {team1Players.length > 0 &&
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (formData.team1_playing_xi.length === team1Players.length) {
                    setFormData({ ...formData, team1_playing_xi: [] });
                  } else {
                    setFormData({ ...formData, team1_playing_xi: team1Players.map((p) => p.id) });
                  }
                }}
                className="mt-3 w-full border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300">

                    {formData.team1_playing_xi.length === team1Players.length ? 'Deselect All' : 'Select All'}
                  </Button>
              }
              </div>

              {/* Team 2 */}
              <div>
                <h3 className="font-medium text-white mb-3 flex items-center justify-between">
                  {teamsMap[formData.team2_id]?.name || 'Team 2'}
                  <span className="text-sm text-slate-400">{formData.team2_playing_xi.length}/{formData.format === 'test' ? formData.players_per_team : 11}</span>
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {team2Players.length === 0 ?
                <p className="text-sm text-slate-400">No players in this team</p> :

                team2Players.map((p) =>
                <button
                  key={p.id}
                  onClick={() => togglePlayer(2, p.id)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  formData.team2_playing_xi.includes(p.id) ?
                  'bg-emerald-500/20 border border-emerald-500/50' :
                  'bg-slate-900 border border-slate-700 hover:border-slate-600'}`
                  }>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.team2_playing_xi.includes(p.id) ?
                  'border-emerald-500 bg-emerald-500' :
                  'border-slate-600'}`
                  }>
                          {formData.team2_playing_xi.includes(p.id) &&
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    }
                        </div>
                        <span className="text-sm font-medium text-white">{p.name}</span>
                      </button>
                )
                }
                </div>
                {team2Players.length > 0 &&
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (formData.team2_playing_xi.length === team2Players.length) {
                    setFormData({ ...formData, team2_playing_xi: [] });
                  } else {
                    setFormData({ ...formData, team2_playing_xi: team2Players.map((p) => p.id) });
                  }
                }}
                className="mt-3 w-full border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300">

                    {formData.team2_playing_xi.length === team2Players.length ? 'Deselect All' : 'Select All'}
                  </Button>
              }
              </div>
            </div>

            <PreMatchPredictionCard
              prediction={preMatchPrediction}
              team1Name={teamsMap[formData.team1_id]?.name || 'Team 1'}
              team2Name={teamsMap[formData.team2_id]?.name || 'Team 2'}
              loading={predictionLoading} />
          </div>
        }

        {STEPS[step] === 'format' &&
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Settings2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Match Format</h2>
            </div>

            <div>
              <Label className="text-slate-200">Format</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  onClick={() => setFormData({ ...formData, format: 'limited' })}
                  className={`p-4 rounded-xl text-center transition-colors ${formData.format === 'limited' ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-slate-900 border border-slate-700'}`}>
                  <span className="block text-sm font-medium text-white">Limited Overs</span>
                  <span className="text-xs text-slate-400">T20 / ODI · 2 innings</span>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, format: 'test' })}
                  className={`p-4 rounded-xl text-center transition-colors ${formData.format === 'test' ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-slate-900 border border-slate-700'}`}>
                  <span className="block text-sm font-medium text-white">Test Cricket</span>
                  <span className="text-xs text-slate-400">4 innings · follow-on</span>
                </button>
              </div>
            </div>

            {formData.format === 'test' ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200">Players per Team</Label>
                  <Input
                    type="number"
                    min="2"
                    value={formData.players_per_team}
                    onChange={(e) => setFormData({ ...formData, players_per_team: Math.max(2, parseInt(e.target.value) || 11) })}
                    className="bg-slate-900 border-slate-700 text-white" />
                  <p className="text-xs text-slate-400 mt-1">Innings ends at {Math.max(1, (formData.players_per_team || 11) - 1)} wickets (players − 1).</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_over_limited} onChange={(e) => setFormData({ ...formData, is_over_limited: e.target.checked })} className="rounded" />
                  <span className="text-sm text-white">Set a match-wide over limit</span>
                </label>

                {formData.is_over_limited && (
                  <div>
                    <Label className="text-slate-200">Total Match Overs</Label>
                    <Input type="number" min="1" value={formData.total_match_overs} onChange={(e) => setFormData({ ...formData, total_match_overs: Math.max(1, parseInt(e.target.value) || 90) })} className="bg-slate-900 border-slate-700 text-white" />
                    <p className="text-xs text-slate-400 mt-1">Match is drawn if overs run out before a result.</p>
                  </div>
                )}

                <div>
                  <Label className="text-slate-200">Ball Type</Label>
                  <Select value={formData.ball_type} onValueChange={(v) => setFormData({ ...formData, ball_type: v })}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="leather" className="text-white">Leather Ball</SelectItem>
                      <SelectItem value="tennis" className="text-white">Tennis Ball</SelectItem>
                      <SelectItem value="tape" className="text-white">Tape Ball</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Wide Runs</Label>
                    <Input type="number" min="1" value={formData.wide_runs} onChange={(e) => setFormData({ ...formData, wide_runs: parseInt(e.target.value) || 1 })} className="bg-slate-900 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-200">No-Ball Runs</Label>
                    <Input type="number" min="1" value={formData.no_ball_runs} onChange={(e) => setFormData({ ...formData, no_ball_runs: parseInt(e.target.value) || 1 })} className="bg-slate-900 border-slate-700 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-200">Overs per Innings</Label>
                <Input
                type="number"
                min="1"
                value={formData.overs_per_innings}
                onChange={(e) => {
                  const overs = parseInt(e.target.value) || 20;
                  setFormData({
                    ...formData,
                    overs_per_innings: overs,
                    max_overs_per_bowler: Math.ceil(overs / 5)
                  });
                }}
                className="bg-slate-900 border-slate-700 text-white" />

              </div>
              <div>
                <Label className="text-slate-200">Max Overs per Bowler</Label>
                <Input
                type="number"
                min="1"
                value={formData.max_overs_per_bowler}
                onChange={(e) => setFormData({ ...formData, max_overs_per_bowler: parseInt(e.target.value) || 4 })}
                className="bg-slate-900 border-slate-700 text-white" />

              </div>
            </div>

            <div>
              <Label className="text-slate-200">Ball Type</Label>
              <Select value={formData.ball_type} onValueChange={(v) => setFormData({ ...formData, ball_type: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="leather" className="text-white">Leather Ball</SelectItem>
                  <SelectItem value="tennis" className="text-white">Tennis Ball</SelectItem>
                  <SelectItem value="tape" className="text-white">Tape Ball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-200">Wide Runs</Label>
                <Input
                type="number"
                min="1"
                value={formData.wide_runs}
                onChange={(e) => setFormData({ ...formData, wide_runs: parseInt(e.target.value) || 1 })}
                className="bg-slate-900 border-slate-700 text-white" />

              </div>
              <div>
                <Label className="text-slate-200">No-Ball Runs</Label>
                <Input
                type="number"
                min="1"
                value={formData.no_ball_runs}
                onChange={(e) => setFormData({ ...formData, no_ball_runs: parseInt(e.target.value) || 1 })}
                className="bg-slate-900 border-slate-700 text-white" />

              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input
              type="checkbox"
              checked={formData.allow_multiple_super_overs}
              onChange={(e) => setFormData({ ...formData, allow_multiple_super_overs: e.target.checked })}
              className="rounded" />

              <span className="text-sm text-white">Allow multiple Super Overs if tied</span>
            </label>
              </>
            )}
          </div>
        }

        {STEPS[step] === 'toss' &&
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Coins className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Toss</h2>
            </div>
            
            <div>
              <Label className="text-slate-200">Toss Won By</Label>
              <Select value={formData.toss_winner_id} onValueChange={(v) => setFormData({ ...formData, toss_winner_id: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value={formData.team1_id} className="text-white">{teamsMap[formData.team1_id]?.name}</SelectItem>
                  <SelectItem value={formData.team2_id} className="text-white">{teamsMap[formData.team2_id]?.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-200">Elected to</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                onClick={() => setFormData({ ...formData, toss_decision: 'bat' })}
                className={`p-4 rounded-xl text-center transition-colors ${
                formData.toss_decision === 'bat' ?
                'bg-emerald-500/20 border-2 border-emerald-500' :
                'bg-slate-900 border border-slate-700'}`
                }>

                  <span className="text-2xl mb-2 block">🏏</span>
                  <span className="font-medium text-white">Bat First</span>
                </button>
                <button
                onClick={() => setFormData({ ...formData, toss_decision: 'bowl' })}
                className={`p-4 rounded-xl text-center transition-colors ${
                formData.toss_decision === 'bowl' ?
                'bg-emerald-500/20 border-2 border-emerald-500' :
                'bg-slate-900 border border-slate-700'}`
                }>

                  <span className="text-2xl mb-2 block">⚾</span>
                  <span className="font-medium text-white">Bowl First</span>
                </button>
              </div>
            </div>

            <div>
              <Label className="text-slate-200">Visual Tagging</Label>
              <p className="text-xs text-slate-400 mt-1 mb-2">
                Keep ball-by-ball tagging (pitch zone, shot location, delivery details) or skip it for fast scoring.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormData({ ...formData, enable_visual_tagging: true })}
                  className={`p-4 rounded-xl text-center transition-colors ${
                    formData.enable_visual_tagging ?
                    'bg-emerald-500/20 border-2 border-emerald-500' :
                    'bg-slate-900 border border-slate-700'}`
                  }>

                    <span className="text-2xl mb-2 block">🎯</span>
                    <span className="font-medium text-white">Keep Tagging</span>
                    <span className="block text-xs text-slate-400 mt-1">Detailed ball tracking</span>
                  </button>
                <button
                  onClick={() => setFormData({ ...formData, enable_visual_tagging: false })}
                  className={`p-4 rounded-xl text-center transition-colors ${
                    !formData.enable_visual_tagging ?
                    'bg-emerald-500/20 border-2 border-emerald-500' :
                    'bg-slate-900 border border-slate-700'}`
                  }>

                    <span className="text-2xl mb-2 block">⚡</span>
                    <span className="font-medium text-white">Quick Scoring</span>
                    <span className="block text-xs text-slate-400 mt-1">Just runs & wickets — fastest</span>
                  </button>
              </div>
            </div>
          </div>
        }
      </div>

      {STEPS[step] === 'toss' && (
        <PreMatchPredictionCard
          prediction={preMatchPrediction}
          team1Name={teamsMap[formData.team1_id]?.name || 'Team 1'}
          team2Name={teamsMap[formData.team2_id]?.name || 'Team 2'}
          loading={predictionLoading} />
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 &&
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">

            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        }
        
        {step < STEPS.length - 1 ?
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">

            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button> :

        <Button
          onClick={handleStartMatch}
          disabled={!canProceed() || updateMatchMutation.isPending}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">

            {updateMatchMutation.isPending &&
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          }
            Start Match
          </Button>
        }
      </div>
    </div>);

}