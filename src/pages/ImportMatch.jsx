import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ImportMatch() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | parsing | importing | done | error
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const ext = selected.name.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      setError('PDF import: Please export the scorecard as CSV from Play-Cricket. PDF parsing is not supported — open the PDF, copy the content, and save as .csv, or use the Play-Cricket "Export to CSV" option.');
      setFile(null);
      return;
    }
    setFile(selected);
    setLog([]);
    setStatus('idle');
    setError('');
  };

  const parseCSVText = (text) => {
    const lines = text.split('\n').map(l => l.trim());

    // ---- Match Info ----
    const matchTitle = lines.find(l => l.includes(' Vs ') || l.includes(' vs '))?.split(',')[1]?.trim() || '';
    const groundLine = lines.find(l => l.startsWith('Ground,'));
    const ground = groundLine ? groundLine.split(',')[1]?.trim() : 'Unknown';
    const dateLine = lines.find(l => l.includes('Date,,'));
    const dateRaw = dateLine ? dateLine.split(',,')[1]?.trim() : '';
    // parse date like "Saturday 31st May 2025"
    let matchDate = new Date().toISOString().split('T')[0];
    if (dateRaw) {
      const cleaned = dateRaw.replace(/(\d+)(st|nd|rd|th)/, '$1');
      const parsed = new Date(cleaned);
      if (!isNaN(parsed)) matchDate = parsed.toISOString().split('T')[0];
    }
    const tossLine = lines.find(l => l.startsWith('Toss,'));
    const toss = tossLine ? tossLine.split(',').slice(1).join(',').trim() : '';
    const resultLine = lines.find(l => l.startsWith('Result :'));
    const result = resultLine ? resultLine.replace('Result :', '').trim() : '';

    // ---- Score line e.g. "Score,203-7 (50 overs)...,147 all out (40.4 overs),..." ----
    const scoreLine = lines.find(l => l.startsWith('Score,'));
    let score1 = '', score2 = '';
    if (scoreLine) {
      const parts = scoreLine.split(',');
      score1 = parts[1]?.trim() || '';
      score2 = parts[2]?.trim() || '';
    }
    const parseScore = (s) => {
      const runs = parseInt(s) || 0;
      const wicketMatch = s.match(/(\d+)-(\d+)/);
      const wickets = wicketMatch ? parseInt(wicketMatch[2]) : 10;
      const oversMatch = s.match(/\(([0-9.]+) overs\)/);
      const overs = oversMatch ? parseFloat(oversMatch[1]) : 0;
      const allOut = s.toLowerCase().includes('all out');
      return { runs, wickets: allOut ? 10 : wickets, overs };
    };

    // ---- Teams ----
    const teams = matchTitle.split(' Vs ').map(t => t.trim());
    const team1Name = teams[0] || 'Team 1';
    const team2Name = teams[1] || 'Team 2';

    // ---- Parse batting sections ----
    // CSV columns: Name, How Out, Bowler, (blank), Runs, 4s, 6s, Balls
    // For "not out" rows, bowler may be empty but column count stays the same
    const parseBatting = (startIdx) => {
      const batters = [];
      let i = startIdx;
      while (i < lines.length) {
        const line = lines[i];
        if (!line || line.startsWith('Extras') || line.startsWith('Fall of') || line.startsWith('Bowling') || line.startsWith('\\*')) break;
        const parts = line.split(',');
        const name = parts[0]?.trim();
        if (!name || name === 'Name') { i++; continue; }

        const howOut = parts[1]?.trim() || 'not out';
        const bowler = parts[2]?.trim() || '';

        // Find runs: it's the first numeric value starting from index 3 (skip blank col)
        // Play-Cricket format: Name, HowOut, Bowler, "", Runs, 4s, 6s, Balls
        // But sometimes cols shift - find first non-empty numeric from index 3
        let runsIdx = 4;
        for (let k = 3; k <= 5; k++) {
          if (parts[k]?.trim() !== '' && !isNaN(parseInt(parts[k]))) { runsIdx = k; break; }
        }
        const runs = parseInt(parts[runsIdx]) || 0;
        const fours = parseInt(parts[runsIdx + 1]) || 0;
        const sixes = parseInt(parts[runsIdx + 2]) || 0;
        const balls = parseInt(parts[runsIdx + 3]) || 0;

        // Map howOut to dismissal string and dismissal_type enum
        const howOutLower = howOut.toLowerCase();
        let dismissal = howOut;
        let dismissal_type = null;

        if (howOutLower === 'not out') {
          dismissal = 'not out';
        } else if (howOutLower === 'did not bat') {
          dismissal = 'did not bat';
        } else if (howOutLower === 'bowled' || howOutLower === 'b') {
          dismissal = bowler ? `b ${bowler}` : 'bowled';
          dismissal_type = 'bowled';
        } else if (howOutLower.startsWith('lbw')) {
          dismissal = bowler ? `lbw b ${bowler}` : howOut;
          dismissal_type = 'lbw';
        } else if (howOutLower.startsWith('ct') || howOutLower.startsWith('caught')) {
          dismissal = bowler ? `${howOut} b ${bowler}` : howOut;
          dismissal_type = 'caught';
        } else if (howOutLower.startsWith('st') || howOutLower.startsWith('stumped')) {
          dismissal = bowler ? `${howOut} b ${bowler}` : howOut;
          dismissal_type = 'stumped';
        } else if (howOutLower.startsWith('run out')) {
          dismissal = howOut;
          dismissal_type = 'run_out';
        } else if (howOutLower.startsWith('hit wicket')) {
          dismissal = bowler ? `hit wicket b ${bowler}` : howOut;
          dismissal_type = 'hit_wicket';
        } else if (howOutLower.startsWith('retired hurt')) {
          dismissal = howOut;
          dismissal_type = 'retired_hurt';
        } else {
          // fallback - use howOut text, try to detect type
          if (bowler) dismissal = `${howOut} b ${bowler}`;
          dismissal_type = 'caught'; // safe fallback
        }

        const is_out = !['not out', 'did not bat'].includes(howOutLower);
        batters.push({ name, runs, balls, fours, sixes, dismissal, dismissal_type, is_out });
        i++;
      }
      return batters;
    };

    // ---- Parse bowling sections ----
    const parseBowling = (startIdx) => {
      const bowlers = [];
      let i = startIdx;
      while (i < lines.length) {
        const line = lines[i];
        if (!line || line.startsWith('Total') || line.startsWith('Fielding') || line.startsWith('https')) break;
        const parts = line.split(',');
        const name = parts[0]?.trim();
        if (!name || name === 'Bowler') { i++; continue; }
        const overs = parts[2]?.trim() || '0';
        const maidens = parseInt(parts[3]) || 0;
        const runs = parseInt(parts[4]) || 0;
        const wickets = parseInt(parts[5]) || 0;
        const balls = Math.round((parseFloat(overs) % 1) * 10) + Math.floor(parseFloat(overs)) * 6;
        bowlers.push({ name, overs, maidens, runs, wickets, balls: balls });
        i++;
      }
      return bowlers;
    };

    // Find section indices
    const batting1Idx = lines.findIndex((l, i) => l === 'Name,How Out,Bowler,,Runs,4s,6s,Balls,');
    const bowling1Idx = lines.findIndex((l, i) => i > batting1Idx && l === 'Bowler,,Overs,Maidens,Runs,Wickets,Wides,No Balls,');
    const batting2Idx = lines.findIndex((l, i) => i > bowling1Idx && l === 'Name,How Out,Bowler,,Runs,4s,6s,Balls,');
    const bowling2Idx = lines.findIndex((l, i) => i > batting2Idx && l === 'Bowler,,Overs,Maidens,Runs,Wickets,Wides,No Balls,');

    const batters1 = batting1Idx >= 0 ? parseBatting(batting1Idx + 1) : [];
    const bowlers1 = bowling1Idx >= 0 ? parseBowling(bowling1Idx + 1) : [];
    const batters2 = batting2Idx >= 0 ? parseBatting(batting2Idx + 1) : [];
    const bowlers2 = bowling2Idx >= 0 ? parseBowling(bowling2Idx + 1) : [];

    // Extras
    const extras1Line = lines.slice(batting1Idx, bowling1Idx).find(l => l.startsWith('Extras,'));
    const extras2Line = lines.slice(batting2Idx, bowling2Idx).find(l => l.startsWith('Extras,'));
    const parseExtras = (line) => {
      if (!line) return { byes: 0, leg_byes: 0, wides: 0, no_balls: 0 };
      const b = parseInt(line.match(/b \((\d+)\)/)?.[1] || 0);
      const lb = parseInt(line.match(/lb \((\d+)\)/)?.[1] || 0);
      const w = parseInt(line.match(/w \((\d+)\)/)?.[1] || 0);
      const nb = parseInt(line.match(/nb \((\d+)\)/)?.[1] || 0);
      return { byes: b, leg_byes: lb, wides: w, no_balls: nb };
    };

    const s1 = parseScore(score1);
    const s2 = parseScore(score2);

    return {
      matchDate, ground, toss, result,
      team1Name, team2Name,
      innings1: { ...s1, batters: batters1, bowlers: bowlers1, extras: parseExtras(extras1Line) },
      innings2: { ...s2, batters: batters2, bowlers: bowlers2, extras: parseExtras(extras2Line) },
    };
  };

  const importData = async () => {
    if (!file) return;
    setStatus('parsing');
    setLog([]);
    setError('');

    const text = await file.text();
    const data = parseCSVText(text);
    addLog(`✅ Parsed match: ${data.team1Name} vs ${data.team2Name}`);
    addLog(`📅 Date: ${data.matchDate} | Ground: ${data.ground}`);

    setStatus('importing');

    // 1. Find or create teams
    addLog('🔍 Looking up teams...');
    const allTeams = await base44.entities.Team.list();

    const findOrCreateTeam = async (name) => {
      const existing = allTeams.find(t => t.name.toLowerCase().includes(name.split(' ')[0].toLowerCase()));
      if (existing) { addLog(`  Team found: ${existing.name}`); return existing; }
      const created = await base44.entities.Team.create({ name, short_name: name.substring(0, 4).toUpperCase() });
      addLog(`  Team created: ${name}`);
      return created;
    };

    const team1 = await findOrCreateTeam(data.team1Name);
    const team2 = await findOrCreateTeam(data.team2Name);

    // 2. Find or create players
    addLog('👥 Setting up players...');
    const allPlayers = await base44.entities.Player.list();

    const findOrCreatePlayer = async (name, teamId) => {
      const existing = allPlayers.find(p => p.name.toLowerCase() === name.toLowerCase() && p.team_id === teamId);
      if (existing) return existing;
      return await base44.entities.Player.create({ name, team_id: teamId, role: 'all_rounder' });
    };

    const team1Players = {};
    const team2Players = {};
    for (const b of data.innings1.batters) {
      if (b.name && b.name !== 'did not bat') team1Players[b.name] = await findOrCreatePlayer(b.name, team1.id);
    }
    for (const b of data.innings2.bowlers) {
      if (b.name) team1Players[b.name] = team1Players[b.name] || await findOrCreatePlayer(b.name, team2.id);
    }
    for (const b of data.innings2.batters) {
      if (b.name && b.name !== 'did not bat') team2Players[b.name] = await findOrCreatePlayer(b.name, team2.id);
    }
    for (const b of data.innings1.bowlers) {
      if (b.name) team2Players[b.name] = team2Players[b.name] || await findOrCreatePlayer(b.name, team1.id);
    }
    addLog(`  ${Object.keys(team1Players).length + Object.keys(team2Players).length} players ready`);

    // 3. Create Match
    addLog('🏏 Creating match record...');
    const t1xi = data.innings1.batters.map(b => team1Players[b.name]?.id).filter(Boolean);
    const t2xi = data.innings2.batters.map(b => team2Players[b.name]?.id).filter(Boolean);

    const match = await base44.entities.Match.create({
      date: data.matchDate,
      venue: data.ground,
      team1_id: team1.id,
      team2_id: team2.id,
      team1_playing_xi: t1xi,
      team2_playing_xi: t2xi,
      overs_per_innings: 50,
      status: 'completed',
      result: data.result,
      batting_team_id: team1.id,
      bowling_team_id: team2.id,
    });
    addLog(`  Match created (ID: ${match.id})`);

    // 4. Create Innings
    addLog('📊 Creating innings...');
    const inn1 = await base44.entities.Innings.create({
      match_id: match.id,
      innings_number: 1,
      batting_team_id: team1.id,
      bowling_team_id: team2.id,
      total_runs: data.innings1.runs,
      total_wickets: data.innings1.wickets,
      total_balls: Math.round(data.innings1.overs * 6),
      total_overs: Math.floor(data.innings1.overs),
      extras_byes: data.innings1.extras.byes,
      extras_leg_byes: data.innings1.extras.leg_byes,
      extras_wide: data.innings1.extras.wides,
      extras_no_ball: data.innings1.extras.no_balls,
      status: 'completed',
      end_reason: data.innings1.wickets >= 10 ? 'all_out' : 'overs_complete',
    });

    const inn2 = await base44.entities.Innings.create({
      match_id: match.id,
      innings_number: 2,
      batting_team_id: team2.id,
      bowling_team_id: team1.id,
      total_runs: data.innings2.runs,
      total_wickets: data.innings2.wickets,
      total_balls: Math.round(data.innings2.overs * 6),
      total_overs: Math.floor(data.innings2.overs),
      extras_byes: data.innings2.extras.byes,
      extras_leg_byes: data.innings2.extras.leg_byes,
      extras_wide: data.innings2.extras.wides,
      extras_no_ball: data.innings2.extras.no_balls,
      target: data.innings1.runs + 1,
      status: 'completed',
      end_reason: data.innings2.wickets >= 10 ? 'all_out' : 'overs_complete',
    });
    addLog(`  Innings 1: ${data.innings1.runs}/${data.innings1.wickets}`);
    addLog(`  Innings 2: ${data.innings2.runs}/${data.innings2.wickets}`);

    // 5. Create BatterInnings
    addLog('🏏 Saving batting scorecards...');
    for (let i = 0; i < data.innings1.batters.length; i++) {
      const b = data.innings1.batters[i];
      const player = team1Players[b.name];
      if (!player) continue;
      await base44.entities.BatterInnings.create({
        match_id: match.id,
        innings_id: inn1.id,
        player_id: player.id,
        batting_position: i + 1,
        runs: b.runs, balls_faced: b.balls, fours: b.fours, sixes: b.sixes,
        is_out: b.is_out,
        dismissal_type: b.is_out ? b.dismissal_type : null,
        status: b.dismissal === 'did not bat' ? 'yet_to_bat' : b.is_out ? 'out' : 'not_out',
        strike_rate: b.balls > 0 ? (b.runs / b.balls) * 100 : 0,
      });
    }
    for (let i = 0; i < data.innings2.batters.length; i++) {
      const b = data.innings2.batters[i];
      const player = team2Players[b.name];
      if (!player) continue;
      await base44.entities.BatterInnings.create({
        match_id: match.id,
        innings_id: inn2.id,
        player_id: player.id,
        batting_position: i + 1,
        runs: b.runs, balls_faced: b.balls, fours: b.fours, sixes: b.sixes,
        is_out: b.is_out,
        dismissal_type: b.is_out ? b.dismissal_type : null,
        status: b.dismissal === 'did not bat' ? 'yet_to_bat' : b.is_out ? 'out' : 'not_out',
        strike_rate: b.balls > 0 ? (b.runs / b.balls) * 100 : 0,
      });
    }
    addLog(`  Batting records saved`);

    // 6. Create BowlerInnings
    addLog('🎳 Saving bowling scorecards...');
    for (const b of data.innings1.bowlers) {
      const player = team2Players[b.name] || await findOrCreatePlayer(b.name, team2.id);
      if (!player) continue;
      const totalBalls = Math.round(parseFloat(b.overs) * 6);
      await base44.entities.BowlerInnings.create({
        match_id: match.id,
        innings_id: inn1.id,
        player_id: player.id,
        overs: Math.floor(parseFloat(b.overs)),
        balls: totalBalls % 6,
        runs_conceded: b.runs,
        wickets: b.wickets,
        maidens: b.maidens,
        economy: parseFloat(b.overs) > 0 ? b.runs / parseFloat(b.overs) : 0,
      });
    }
    for (const b of data.innings2.bowlers) {
      const player = team1Players[b.name] || await findOrCreatePlayer(b.name, team1.id);
      if (!player) continue;
      const totalBalls = Math.round(parseFloat(b.overs) * 6);
      await base44.entities.BowlerInnings.create({
        match_id: match.id,
        innings_id: inn2.id,
        player_id: player.id,
        overs: Math.floor(parseFloat(b.overs)),
        balls: totalBalls % 6,
        runs_conceded: b.runs,
        wickets: b.wickets,
        maidens: b.maidens,
        economy: parseFloat(b.overs) > 0 ? b.runs / parseFloat(b.overs) : 0,
      });
    }
    addLog(`  Bowling records saved`);

    addLog('🎉 Import complete! Match is now visible in Matches and Analytics.');
    setStatus('done');
  };

  return (
    <div className="pb-24 md:pb-6">
      <Link to={createPageUrl('Home')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Import Match Data</h1>
        <p className="text-slate-400 text-sm">Upload a Play-Cricket CSV scorecard to import match, teams, players and statistics.</p>
      </div>

      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors group">
          <Upload className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 mb-3 transition-colors" />
          <span className="text-slate-400 group-hover:text-white transition-colors font-medium">
            {file ? file.name : 'Click to upload CSV file'}
          </span>
          <span className="text-slate-600 text-sm mt-1">Play-Cricket CSV format supported</span>
          <input type="file" accept=".csv,.pdf" className="hidden" onChange={handleFile} />
        </label>

        {file && status === 'idle' && (
          <Button
            onClick={importData}
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            <FileText className="w-4 h-4 mr-2" />
            Import Match Data
          </Button>
        )}
      </div>

      {log.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            {status === 'importing' || status === 'parsing' ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : status === 'done' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            Import Log
          </h3>
          <div className="space-y-1 font-mono text-sm">
            {log.map((l, i) => (
              <div key={i} className="text-slate-300">{l}</div>
            ))}
          </div>
          {status === 'done' && (
            <div className="mt-4 flex gap-3">
              <Button onClick={() => navigate(createPageUrl('Home'))} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                View in Matches
              </Button>
              <Button variant="outline" onClick={() => { setFile(null); setLog([]); setStatus('idle'); }} className="flex-1 border-slate-600">
                Import Another
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}