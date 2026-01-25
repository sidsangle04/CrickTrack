import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Scorecard() {
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get('matchId');
  const [expandedInnings, setExpandedInnings] = useState(null);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      const matches = await base44.entities.Match.filter({ id: matchId });
      return matches[0];
    },
    enabled: !!matchId
  });

  const { data: innings = [] } = useQuery({
    queryKey: ['innings', matchId],
    queryFn: () => base44.entities.Innings.filter({ match_id: matchId }),
    enabled: !!matchId
  });

  const { data: allDeliveries = [] } = useQuery({
    queryKey: ['all-deliveries', matchId],
    queryFn: () => base44.entities.Delivery.filter({ match_id: matchId, is_voided: false }),
    enabled: !!matchId
  });

  const { data: batterInnings = [] } = useQuery({
    queryKey: ['all-batter-innings', matchId],
    queryFn: () => base44.entities.BatterInnings.filter({ match_id: matchId }),
    enabled: !!matchId
  });

  const { data: bowlerInnings = [] } = useQuery({
    queryKey: ['all-bowler-innings', matchId],
    queryFn: () => base44.entities.BowlerInnings.filter({ match_id: matchId }),
    enabled: !!matchId
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list()
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['all-players'],
    queryFn: () => base44.entities.Player.list()
  });

  const teamsMap = teams.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
  const playersMap = allPlayers.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

  const getDismissalText = (batter) => {
    if (!batter.is_out) return 'not out';
    const bowler = playersMap[batter.dismissed_by_bowler_id];
    const fielder = playersMap[batter.dismissed_by_fielder_id];
    
    switch(batter.dismissal_type) {
      case 'bowled': return `b ${bowler?.name || 'Unknown'}`;
      case 'caught': return `c ${fielder?.name || 'Unknown'} b ${bowler?.name || 'Unknown'}`;
      case 'lbw': return `lbw b ${bowler?.name || 'Unknown'}`;
      case 'stumped': return `st ${fielder?.name || 'Unknown'} b ${bowler?.name || 'Unknown'}`;
      case 'run_out': return `run out (${fielder?.name || 'Unknown'})`;
      case 'hit_wicket': return `hit wicket b ${bowler?.name || 'Unknown'}`;
      case 'retired_hurt': return 'retired hurt';
      case 'retired_out': return 'retired out';
      default: return 'out';
    }
  };

  const getOversDisplay = (balls) => {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
  };

  const exportCSV = () => {
    let csv = 'Match Scorecard\n\n';
    
    innings.forEach(inn => {
      const team = teamsMap[inn.batting_team_id];
      const batters = batterInnings.filter(b => b.innings_id === inn.id);
      const bowlers = bowlerInnings.filter(b => b.innings_id === inn.id);
      
      csv += `${team?.name || 'Team'} Innings\n`;
      csv += 'Batter,Runs,Balls,4s,6s,SR,Dismissal\n';
      batters.forEach(b => {
        const player = playersMap[b.player_id];
        const sr = b.balls_faced > 0 ? ((b.runs / b.balls_faced) * 100).toFixed(1) : '0.0';
        csv += `${player?.name || 'Unknown'},${b.runs},${b.balls_faced},${b.fours},${b.sixes},${sr},"${getDismissalText(b)}"\n`;
      });
      csv += `Total: ${inn.total_runs}/${inn.total_wickets} (${getOversDisplay(inn.total_balls)} overs)\n\n`;
      
      csv += 'Bowler,Overs,Runs,Wickets,Economy\n';
      bowlers.forEach(b => {
        const player = playersMap[b.player_id];
        const econ = (b.overs + b.balls / 6) > 0 ? (b.runs_conceded / (b.overs + b.balls / 6)).toFixed(2) : '0.00';
        csv += `${player?.name || 'Unknown'},${b.overs}.${b.balls % 6},${b.runs_conceded},${b.wickets},${econ}\n`;
      });
      csv += '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_${matchId}_scorecard.csv`;
    a.click();
  };

  if (matchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const regularInnings = innings.filter(i => !i.is_super_over).sort((a, b) => a.innings_number - b.innings_number);
  const superOverInnings = innings.filter(i => i.is_super_over).sort((a, b) => a.innings_number - b.innings_number);

  return (
    <div className="pb-24 md:pb-6">
      <Link 
        to={createPageUrl('Home')}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      {/* Match Header */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {match?.date ? format(new Date(match.date), 'MMM d, yyyy') : 'TBD'}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {match?.venue || 'TBD'}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">
              {teamsMap[match?.team1_id]?.name} vs {teamsMap[match?.team2_id]?.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="border-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {match?.result && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <span className="font-medium text-emerald-400">{match.result}</span>
          </div>
        )}
      </div>

      {/* Innings Tabs */}
      <Tabs defaultValue="innings_1" className="w-full">
        <TabsList className="w-full bg-slate-800/50 p-1 rounded-xl mb-4">
          {regularInnings.map((inn, idx) => (
            <TabsTrigger 
              key={inn.id}
              value={`innings_${inn.innings_number}`}
              className="flex-1 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              {teamsMap[inn.batting_team_id]?.short_name || `Team ${idx + 1}`}
            </TabsTrigger>
          ))}
          {superOverInnings.length > 0 && (
            <TabsTrigger 
              value="super_over"
              className="flex-1 data-[state=active]:bg-amber-500 data-[state=active]:text-white"
            >
              Super Over
            </TabsTrigger>
          )}
        </TabsList>

        {regularInnings.map(inn => {
          const inningsBatters = batterInnings.filter(b => b.innings_id === inn.id).sort((a, b) => a.batting_position - b.batting_position);
          const inningsBowlers = bowlerInnings.filter(b => b.innings_id === inn.id);
          const team = teamsMap[inn.batting_team_id];
          
          return (
            <TabsContent key={inn.id} value={`innings_${inn.innings_number}`}>
              <div className="space-y-4">
                {/* Score Summary */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-white">{inn.total_runs}</span>
                    <span className="text-xl text-slate-400">/{inn.total_wickets}</span>
                    <span className="text-slate-500">({getOversDisplay(inn.total_balls)} ov)</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Extras: {(inn.extras_wide || 0) + (inn.extras_no_ball || 0) + (inn.extras_byes || 0) + (inn.extras_leg_byes || 0)}
                    <span className="text-slate-600 ml-2">
                      (Wd {inn.extras_wide || 0}, Nb {inn.extras_no_ball || 0}, B {inn.extras_byes || 0}, Lb {inn.extras_leg_byes || 0})
                    </span>
                  </div>
                </div>

                {/* Batting */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-white">Batting</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                          <th className="text-left p-3">Batter</th>
                          <th className="text-right p-3">R</th>
                          <th className="text-right p-3">B</th>
                          <th className="text-right p-3">4s</th>
                          <th className="text-right p-3">6s</th>
                          <th className="text-right p-3">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inningsBatters.map(batter => {
                          const player = playersMap[batter.player_id];
                          const sr = batter.balls_faced > 0 
                            ? ((batter.runs / batter.balls_faced) * 100).toFixed(1) 
                            : '0.0';
                          
                          return (
                            <tr key={batter.id} className="border-b border-slate-700/30">
                              <td className="p-3">
                                <div className="font-medium text-white">{player?.name || 'Unknown'}</div>
                                <div className="text-xs text-slate-500">{getDismissalText(batter)}</div>
                              </td>
                              <td className="text-right p-3 font-semibold text-white">{batter.runs}</td>
                              <td className="text-right p-3 text-slate-400">{batter.balls_faced}</td>
                              <td className="text-right p-3 text-slate-400">{batter.fours}</td>
                              <td className="text-right p-3 text-slate-400">{batter.sixes}</td>
                              <td className="text-right p-3 text-slate-400">{sr}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bowling */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-white">Bowling</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                          <th className="text-left p-3">Bowler</th>
                          <th className="text-right p-3">O</th>
                          <th className="text-right p-3">M</th>
                          <th className="text-right p-3">R</th>
                          <th className="text-right p-3">W</th>
                          <th className="text-right p-3">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inningsBowlers.map(bowler => {
                          const player = playersMap[bowler.player_id];
                          const totalOvers = bowler.overs + bowler.balls / 6;
                          const econ = totalOvers > 0 
                            ? (bowler.runs_conceded / totalOvers).toFixed(2) 
                            : '0.00';
                          
                          return (
                            <tr key={bowler.id} className="border-b border-slate-700/30">
                              <td className="p-3 font-medium text-white">{player?.name || 'Unknown'}</td>
                              <td className="text-right p-3 text-slate-400">{bowler.overs}.{bowler.balls % 6}</td>
                              <td className="text-right p-3 text-slate-400">{bowler.maidens || 0}</td>
                              <td className="text-right p-3 text-slate-400">{bowler.runs_conceded}</td>
                              <td className="text-right p-3 font-semibold text-white">{bowler.wickets}</td>
                              <td className="text-right p-3 text-slate-400">{econ}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          );
        })}

        {superOverInnings.length > 0 && (
          <TabsContent value="super_over">
            <div className="space-y-4">
              {superOverInnings.map(inn => {
                const inningsBatters = batterInnings.filter(b => b.innings_id === inn.id);
                const inningsBowlers = bowlerInnings.filter(b => b.innings_id === inn.id);
                const team = teamsMap[inn.batting_team_id];
                
                return (
                  <div key={inn.id} className="bg-slate-800/50 rounded-xl p-4 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-amber-400">{team?.name} - Super Over {inn.super_over_number}</h3>
                      <span className="text-2xl font-bold text-white">
                        {inn.total_runs}/{inn.total_wickets}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Batters:</span>
                        <div className="mt-1">
                          {inningsBatters.map(b => (
                            <div key={b.id} className="text-white">
                              {playersMap[b.player_id]?.name}: {b.runs}({b.balls_faced})
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Bowler:</span>
                        <div className="mt-1">
                          {inningsBowlers.map(b => (
                            <div key={b.id} className="text-white">
                              {playersMap[b.player_id]?.name}: {b.wickets}/{b.runs_conceded}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Ball by Ball Log */}
      <div className="mt-6">
        <button
          onClick={() => setExpandedInnings(expandedInnings ? null : 'log')}
          className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-between"
        >
          <span className="font-semibold text-white">Ball-by-Ball Log</span>
          {expandedInnings === 'log' ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {expandedInnings === 'log' && (
          <div className="mt-2 bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 max-h-96 overflow-y-auto">
            {innings.map(inn => {
              const innDeliveries = allDeliveries.filter(d => d.innings_id === inn.id)
                .sort((a, b) => {
                  if (a.over_number !== b.over_number) return a.over_number - b.over_number;
                  return (a.ball_in_over || 0) - (b.ball_in_over || 0);
                });
              
              return (
                <div key={inn.id} className="mb-6">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-3">
                    {teamsMap[inn.batting_team_id]?.name} Innings {inn.is_super_over ? `(Super Over ${inn.super_over_number})` : ''}
                  </h4>
                  <div className="space-y-1">
                    {innDeliveries.map((d, idx) => {
                      const striker = playersMap[d.striker_id]?.name || 'Unknown';
                      const bowler = playersMap[d.bowler_id]?.name || 'Unknown';
                      
                      let description = '';
                      if (d.is_wicket) {
                        description = `WICKET! ${playersMap[d.player_out_id]?.name} ${d.wicket_type}`;
                      } else if (d.is_wide) {
                        description = `Wide + ${d.runs_bat || 0}`;
                      } else if (d.is_no_ball) {
                        description = `No ball + ${d.runs_bat || 0}`;
                      } else if (d.is_bye) {
                        description = `${d.bye_runs} bye(s)`;
                      } else if (d.is_leg_bye) {
                        description = `${d.leg_bye_runs} leg bye(s)`;
                      } else if (d.runs_bat === 0) {
                        description = 'dot ball';
                      } else if (d.runs_bat === 4) {
                        description = 'FOUR!';
                      } else if (d.runs_bat === 6) {
                        description = 'SIX!';
                      } else {
                        description = `${d.runs_bat} run(s)`;
                      }

                      return (
                        <div key={d.id} className="text-xs text-slate-400 flex gap-2">
                          <span className="text-slate-600 w-12">{d.over_number}.{d.ball_in_over || (idx + 1)}</span>
                          <span className="text-slate-500">{bowler} to {striker}:</span>
                          <span className={d.is_wicket ? 'text-red-400' : d.runs_bat >= 4 ? 'text-emerald-400' : ''}>
                            {description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}