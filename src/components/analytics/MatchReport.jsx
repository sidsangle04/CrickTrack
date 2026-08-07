import React, { useMemo, useState } from 'react';
import { Clipboard, Download, Award, Zap, Target, TrendingUp, Users, FileCode2, ChevronDown, FileText } from 'lucide-react';
import { downloadHTML } from '@/components/utils/htmlExport';
import { generateWagonWheelSVG, generatePitchMapSVG, generateWormGraphSVG, wagonWheelLegend, pitchLegend } from '@/components/utils/svgExport';

const LENGTH_LABELS = {
  full_toss: 'Full Toss', yorker: 'Yorker', full: 'Full',
  good_length: 'Good Length', good: 'Good Length', back_of_length: 'Back of Length',
  short: 'Short', bouncer: 'Bouncer',
};
function normLen(l) {
  if (!l) return null;
  const k = String(l).trim().toLowerCase().replace(/\s+/g, '_');
  return LENGTH_LABELS[k] ? k : null;
}

function ovStr(balls) { return `${Math.floor(balls / 6)}.${balls % 6}`; }
function rr(runs, balls) { return balls > 0 ? (runs / (balls / 6)).toFixed(2) : '0.00'; }
function econOf(b) { return b && b.balls > 0 ? b.runs_conceded / (b.balls / 6) : 0; }

export default function MatchReport({ match, innings, batterInnings, bowlerInnings, deliveries, partnerships, playersMap, teamsMap }) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [includeBallLog, setIncludeBallLog] = useState(true);

  const data = useMemo(() => {
    const reg = innings.filter(i => !i.is_super_over).sort((a, b) => a.innings_number - b.innings_number);
    const maxOvers = match?.overs_per_innings || 20;

    const perInnings = reg.map(inn => {
      const batters = batterInnings.filter(b => b.innings_id === inn.id);
      const bowlers = bowlerInnings.filter(b => b.innings_id === inn.id);
      const dels = deliveries.filter(d => d.innings_id === inn.id && !d.is_voided);
      const topBatter = [...batters].sort((a, b) => b.runs - a.runs)[0];
      const topBowler = [...bowlers].sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)[0];

      // phases
      const ppEnd = Math.floor(maxOvers * 0.3);
      const midEnd = Math.floor(maxOvers * 0.7);
      const phases = { Powerplay: { r: 0, b: 0 }, Middle: { r: 0, b: 0 }, Death: { r: 0, b: 0 } };
      dels.forEach(d => {
        const o = d.over_number || 0;
        const key = o < ppEnd ? 'Powerplay' : o < midEnd ? 'Middle' : 'Death';
        phases[key].r += d.runs_total || 0;
        if (d.is_legal_delivery !== false) phases[key].b += 1;
      });

      return { inn, batters, bowlers, dels, topBatter, topBowler, phases };
    });

    const allBatters = batterInnings.filter(b => reg.some(i => i.id === b.innings_id));
    const allBowlers = bowlerInnings.filter(b => reg.some(i => i.id === b.innings_id));
    const allDels = deliveries.filter(d => !d.is_voided && reg.some(i => i.id === d.innings_id));

    const topScorer = [...allBatters].sort((a, b) => b.runs - a.runs)[0];
    const bestSR = [...allBatters].filter(b => b.balls_faced >= 5).sort((a, b) => (b.runs / Math.max(b.balls_faced, 1)) - (a.runs / Math.max(a.balls_faced, 1)))[0];
    const topWicketTaker = [...allBowlers].sort((a, b) => b.wickets - a.wickets || econOf(a) - econOf(b))[0];
    const mostEconomical = [...allBowlers].filter(b => b.balls >= 6).sort((a, b) => econOf(a) - econOf(b))[0];

    const highestPartnership = [...partnerships].filter(p => reg.some(i => i.id === p.innings_id)).sort((a, b) => b.runs - a.runs)[0];

    const totals = {
      runs: allDels.reduce((s, d) => s + (d.runs_total || 0), 0),
      wickets: allDels.filter(d => d.is_wicket).length,
      fours: allDels.filter(d => d.runs_bat === 4).length,
      sixes: allDels.filter(d => d.runs_bat === 6).length,
      dots: allDels.filter(d => d.is_legal_delivery !== false && (d.runs_total || 0) === 0).length,
      legal: allDels.filter(d => d.is_legal_delivery !== false).length,
    };

    // pace vs spin
    const byType = { pace: { r: 0, w: 0, b: 0 }, spin: { r: 0, w: 0, b: 0 } };
    allDels.forEach(d => {
      const t = d.bowler_type;
      if (t !== 'pace' && t !== 'spin') return;
      byType[t].r += d.runs_total || 0;
      if (d.is_wicket) byType[t].w += 1;
      if (d.is_legal_delivery !== false) byType[t].b += 1;
    });

    // length distribution
    const lenCounts = {};
    allDels.forEach(d => { const k = normLen(d.length); if (k) lenCounts[LENGTH_LABELS[k]] = (lenCounts[LENGTH_LABELS[k]] || 0) + 1; });
    const lenSorted = Object.entries(lenCounts).sort((a, b) => b[1] - a[1]);

    // wicket types
    const wkTypes = {};
    allDels.forEach(d => { if (d.is_wicket && d.wicket_type) wkTypes[d.wicket_type] = (wkTypes[d.wicket_type] || 0) + 1; });

    return { perInnings, topScorer, bestSR, topWicketTaker, mostEconomical, highestPartnership, totals, byType, lenSorted, wkTypes };
  }, [match, innings, batterInnings, bowlerInnings, deliveries, partnerships]);

  const p = (id) => playersMap[id]?.name || 'Unknown';
  const t = (id) => teamsMap[id]?.name || 'Team';

  const getDismissalText = (b) => {
    if (!b.is_out) return 'not out';
    const bowler = playersMap[b.dismissed_by_bowler_id];
    const fielder = playersMap[b.dismissed_by_fielder_id];
    switch (b.dismissal_type) {
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

  const buildText = () => {
    const lines = [];
    lines.push('MATCH REPORT');
    lines.push(`${t(match?.team1_id)} vs ${t(match?.team2_id)}`);
    lines.push(`${match?.date || ''} | ${match?.venue || ''}`);
    if (match?.result) lines.push(`Result: ${match.result}`);
    lines.push('');
    lines.push('--- INNINGS ---');
    data.perInnings.forEach(({ inn, topBatter, topBowler }) => {
      lines.push(`${t(inn.batting_team_id)}: ${inn.total_runs}/${inn.total_wickets} (${ovStr(inn.total_balls)} ov)`);
      if (topBatter) lines.push(`  Top batter: ${p(topBatter.player_id)} ${topBatter.runs} (${topBatter.balls_faced}), SR ${topBatter.balls_faced ? ((topBatter.runs / topBatter.balls_faced) * 100).toFixed(1) : '0.0'}`);
      if (topBowler) lines.push(`  Top bowler: ${p(topBowler.player_id)} ${topBowler.wickets}/${topBowler.runs_conceded} (${topBowler.overs}.${topBowler.balls % 6}), econ ${econOf(topBowler).toFixed(2)}`);
    });
    lines.push('');
    lines.push('--- BATTING HIGHLIGHTS ---');
    if (data.topScorer) {
      const b = data.topScorer;
      lines.push(`Top scorer: ${p(b.player_id)} — ${b.runs} (${b.balls_faced}), ${b.fours}x4 ${b.sixes}x6, SR ${b.balls_faced ? ((b.runs / b.balls_faced) * 100).toFixed(1) : '0.0'}`);
    }
    if (data.bestSR) {
      const b = data.bestSR;
      lines.push(`Best strike rate: ${p(b.player_id)} — ${b.balls_faced ? ((b.runs / b.balls_faced) * 100).toFixed(1) : '0.0'} (${b.runs} off ${b.balls_faced})`);
    }
    lines.push('');
    lines.push('--- BOWLING HIGHLIGHTS ---');
    if (data.topWicketTaker) {
      const b = data.topWicketTaker;
      lines.push(`Top wicket-taker: ${p(b.player_id)} — ${b.wickets} wickets (${b.runs_conceded} runs, econ ${econOf(b).toFixed(2)})`);
    }
    if (data.mostEconomical) {
      const b = data.mostEconomical;
      lines.push(`Most economical: ${p(b.player_id)} — econ ${econOf(b).toFixed(2)} (${b.overs}.${b.balls % 6} ov)`);
    }
    lines.push('');
    lines.push('--- KEY PARTNERSHIP ---');
    if (data.highestPartnership) {
      const hp = data.highestPartnership;
      lines.push(`Highest: ${p(hp.batter1_id)} & ${p(hp.batter2_id)} — ${hp.runs} (${hp.balls}) for wk ${hp.wicket_number}`);
    }
    lines.push('');
    lines.push('--- TACTICAL TRENDS ---');
    lines.push(`Total: ${data.totals.runs} runs, ${data.totals.wickets} wickets`);
    lines.push(`Boundaries: ${data.totals.fours}x4, ${data.totals.sixes}x6 | Dot ball: ${data.totals.legal ? ((data.totals.dots / data.totals.legal) * 100).toFixed(0) : 0}%`);
    lines.push(`Pace: ${data.byType.pace.r} runs, ${data.byType.pace.w} wkts, econ ${rr(data.byType.pace.r, data.byType.pace.b)} | Spin: ${data.byType.spin.r} runs, ${data.byType.spin.w} wkts, econ ${rr(data.byType.spin.r, data.byType.spin.b)}`);
    if (data.lenSorted[0]) lines.push(`Most common length: ${data.lenSorted[0][0]} (${data.lenSorted[0][1]} balls)`);
    data.perInnings.forEach(({ inn, phases }) => {
      lines.push(`${t(inn.batting_team_id)} phases — PP ${phases.Powerplay.r}/${ovStr(phases.Powerplay.b)} (RR ${rr(phases.Powerplay.r, phases.Powerplay.b)}) | Mid ${phases.Middle.r}/${ovStr(phases.Middle.b)} (RR ${rr(phases.Middle.r, phases.Middle.b)}) | Death ${phases.Death.r}/${ovStr(phases.Death.b)} (RR ${rr(phases.Death.r, phases.Death.b)})`);
    });
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* ignore */ }
  };

  const handleDownload = () => {
    const blob = new Blob([buildText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_report_${t(match?.team1_id)}_vs_${t(match?.team2_id)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildHTML = () => {
    const section = (icon, title, inner) => `
      <div class="card">
        <h3>${title}</h3>
        ${inner}
      </div>`;
    const stat = (label, value, sub) => `
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:0.82rem;border-bottom:1px solid rgba(255,255,255,0.05)">
        <span style="color:#94a3b8">${label}</span>
        <span style="text-align:right"><strong style="color:#fff">${value}</strong>${sub ? `<span style="color:#64748b;margin-left:6px">${sub}</span>` : ''}</span>
      </div>`;

    const scoreline = data.perInnings.map(({ inn, topBatter, topBowler }) => `
      <div class="card" style="background:rgba(15,23,42,0.4)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-weight:600;color:#fff">${t(inn.batting_team_id)}</span>
          <span style="font-size:1.25rem;font-weight:700;color:#fff">${inn.total_runs}/${inn.total_wickets} <span style="font-size:0.75rem;color:#64748b;font-weight:400">(${ovStr(inn.total_balls)})</span></span>
        </div>
        ${topBatter ? stat(`Bat: ${p(topBatter.player_id)}`, `${topBatter.runs}(${topBatter.balls_faced})`, `SR ${topBatter.balls_faced ? ((topBatter.runs / topBatter.balls_faced) * 100).toFixed(0) : 0}`) : ''}
        ${topBowler ? stat(`Bowl: ${p(topBowler.player_id)}`, `${topBowler.wickets}/${topBowler.runs_conceded}`, `econ ${econOf(topBowler).toFixed(1)}`) : ''}
      </div>`).join('');

    const batting = section('award', 'Batting Highlights', `
      ${data.topScorer ? stat('Top Scorer', p(data.topScorer.player_id), `${data.topScorer.runs}(${data.topScorer.balls_faced}), ${data.topScorer.fours}x4 ${data.topScorer.sixes}x6`) : ''}
      ${data.bestSR ? stat('Best Strike Rate', p(data.bestSR.player_id), `${data.bestSR.runs}(${data.bestSR.balls_faced})`) : ''}`);

    const bowling = section('target', 'Bowling Highlights', `
      ${data.topWicketTaker ? stat('Top Wicket-taker', p(data.topWicketTaker.player_id), `${data.topWicketTaker.wickets}wkts, ${data.topWicketTaker.runs_conceded}r`) : ''}
      ${data.mostEconomical ? stat('Most Economical', p(data.mostEconomical.player_id), `econ ${econOf(data.mostEconomical).toFixed(2)}`) : ''}`);

    const partnership = section('users', 'Key Partnership', data.highestPartnership
      ? stat(`Highest (Wk ${data.highestPartnership.wicket_number})`, p(data.highestPartnership.batter1_id), `& ${p(data.highestPartnership.batter2_id)} — ${data.highestPartnership.runs}(${data.highestPartnership.balls})`)
      : '<p style="color:#64748b;font-size:0.8rem">No partnership data</p>');

    const trends = section('zap', 'Tactical Trends', `
      ${stat('Boundaries', `${data.totals.fours}x4 / ${data.totals.sixes}x6`, '')}
      ${stat('Dot ball %', `${data.totals.legal ? ((data.totals.dots / data.totals.legal) * 100).toFixed(0) : 0}%`, '')}
      ${stat('Pace vs Spin', `${data.byType.pace.w}/${data.byType.pace.r} | ${data.byType.spin.w}/${data.byType.spin.r}`, 'wkts/runs')}
      ${data.lenSorted[0] ? stat('Top length', data.lenSorted[0][0], `${data.lenSorted[0][1]} balls`) : ''}`);

    const phases = data.perInnings.map(({ inn, phases }) => `
      <div style="margin-bottom:10px">
        <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:6px">${t(inn.batting_team_id)}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:0.8rem">
          ${['Powerplay', 'Middle', 'Death'].map(ph => `
            <div style="background:rgba(15,23,42,0.4);border-radius:8px;padding:8px;text-align:center">
              <div style="color:#64748b">${ph}</div>
              <div style="color:#fff;font-weight:600">${phases[ph].r}/${ovStr(phases[ph].b)}</div>
              <div style="color:#10b981">${rr(phases[ph].r, phases[ph].b)} RR</div>
            </div>`).join('')}
        </div>
      </div>`).join('');

    const regInn = innings.filter(i => !i.is_super_over).sort((a, b) => a.innings_number - b.innings_number);
    const allDeliveries = deliveries.filter(d => !d.is_voided);

    const inningsRows = regInn.map(inn => {
      const innBatters = batterInnings.filter(b => b.innings_id === inn.id).sort((a, b) => a.batting_position - b.batting_position);
      const innBowlers = bowlerInnings.filter(b => b.innings_id === inn.id);
      const innPart = partnerships.filter(p => p.innings_id === inn.id).sort((a, b) => a.wicket_number - b.wicket_number);
      const extras = (inn.extras_wide || 0) + (inn.extras_no_ball || 0) + (inn.extras_byes || 0) + (inn.extras_leg_byes || 0);

      const batterRows = innBatters.map(b => {
        const sr = b.balls_faced > 0 ? ((b.runs / b.balls_faced) * 100).toFixed(1) : '0.0';
        return `<tr><td>${p(b.player_id)}<br/><small style="color:#64748b">${getDismissalText(b)}</small></td>
          <td style="text-align:right;font-weight:700">${b.runs}</td>
          <td style="text-align:right">${b.balls_faced}</td>
          <td style="text-align:right">${b.fours}</td>
          <td style="text-align:right">${b.sixes}</td>
          <td style="text-align:right">${sr}</td></tr>`;
      }).join('');

      const bowlerRows = innBowlers.map(b => {
        const totalOv = b.balls / 6;
        const econ = totalOv > 0 ? (b.runs_conceded / totalOv).toFixed(2) : '0.00';
        return `<tr><td>${p(b.player_id)}</td>
          <td style="text-align:right">${b.overs}.${b.balls % 6}</td>
          <td style="text-align:right">${b.maidens || 0}</td>
          <td style="text-align:right">${b.runs_conceded}</td>
          <td style="text-align:right;font-weight:700">${b.wickets}</td>
          <td style="text-align:right">${econ}</td></tr>`;
      }).join('');

      const partnershipRows = innPart.map(pr => {
        const total = pr.runs || 0;
        const b1 = pr.batter1_runs || 0;
        const b2 = pr.batter2_runs || 0;
        const w1 = total > 0 ? (b1 / total) * 100 : 50;
        const w2 = 100 - w1;
        return `<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
            <div style="flex:1;text-align:right">
              <div style="font-weight:700;color:#fff;font-size:0.95rem">${p(pr.batter1_id)}</div>
              <div style="font-size:0.78rem;color:#64748b">${b1} (${pr.batter1_balls})</div>
            </div>
            <div style="text-align:center;min-width:80px">
              <div style="font-weight:700;color:#fff;font-size:1.15rem">${total}</div>
              <div style="margin-top:5px;width:140px;height:7px;border-radius:4px;overflow:hidden;display:flex;background:rgba(255,255,255,0.08)">
                <div style="background:#2b6cb0;width:${w1}%"></div>
                <div style="background:#7fb3e6;width:${w2}%"></div>
              </div>
              <div style="font-size:0.68rem;color:#64748b;margin-top:3px">wk ${pr.wicket_number} · ${pr.balls} balls</div>
            </div>
            <div style="flex:1;text-align:left">
              <div style="font-weight:700;color:#fff;font-size:0.95rem">${p(pr.batter2_id)}</div>
              <div style="font-size:0.78rem;color:#64748b">${b2} (${pr.batter2_balls})</div>
            </div>
          </div>`;
      }).join('');

      const partnershipCard = innPart.length > 0 ? `
        <div class="card">
          <h3 style="text-align:center;text-transform:uppercase;letter-spacing:1px">${t(inn.batting_team_id)} — Partnerships</h3>
          ${partnershipRows}
        </div>` : '';

      return `<h2>${t(inn.batting_team_id)} Innings</h2>
        <div class="card">
          <div style="font-size:2rem;font-weight:900;color:#fff">${inn.total_runs}/${inn.total_wickets} <span style="font-size:1rem;color:#64748b">(${ovStr(inn.total_balls)} ov)</span></div>
          <div style="font-size:0.8rem;color:#64748b;margin-top:4px">Extras: ${extras} (Wd ${inn.extras_wide || 0}, Nb ${inn.extras_no_ball || 0}, B ${inn.extras_byes || 0}, Lb ${inn.extras_leg_byes || 0})</div>
        </div>
        <div class="card">
          <h3>Batting</h3>
          <table><thead><tr><th>Batter</th><th style="text-align:right">R</th><th style="text-align:right">B</th><th style="text-align:right">4s</th><th style="text-align:right">6s</th><th style="text-align:right">SR</th></tr></thead>
          <tbody>${batterRows}</tbody></table>
        </div>
        <div class="card">
          <h3>Bowling</h3>
          <table><thead><tr><th>Bowler</th><th style="text-align:right">O</th><th style="text-align:right">M</th><th style="text-align:right">R</th><th style="text-align:right">W</th><th style="text-align:right">Econ</th></tr></thead>
          <tbody>${bowlerRows}</tbody></table>
        </div>
        ${partnershipCard}`;
    }).join('');

    const wormSection = (allDeliveries.length > 0 && regInn.length > 0) ? `
      <h2>📈 Worm Graph</h2>
      <div class="card" style="text-align:center">
        ${generateWormGraphSVG(regInn, allDeliveries, teamsMap, match?.overs_per_innings, 520, 260)}
      </div>` : '';

    const shotDeliveries = allDeliveries.filter(d => d.shot_x != null);
    const pitchDeliveries = allDeliveries.filter(d => d.pitch_x != null);
    const visualSection = (shotDeliveries.length > 0 || pitchDeliveries.length > 0) ? `
      <h2>📊 Visual Analytics</h2>
      <div class="grid2">
        ${shotDeliveries.length > 0 ? `<div class="card" style="text-align:center">
          <h3 style="margin-bottom:12px">Wagon Wheel</h3>
          ${generateWagonWheelSVG(allDeliveries, 240)}
          ${wagonWheelLegend(shotDeliveries)}
        </div>` : ''}
        ${pitchDeliveries.length > 0 ? `<div class="card" style="text-align:center">
          <h3 style="margin-bottom:12px">Pitch Map</h3>
          ${generatePitchMapSVG(allDeliveries, 130, 280)}
          ${pitchLegend()}
        </div>` : ''}
      </div>
    ` : '';

    const logSection = allDeliveries.length > 0 ? `
      <h2>📝 Ball-by-Ball Log</h2>
      <div class="card">
        ${innings.map(inn => {
          const innDeliveries = allDeliveries.filter(d => d.innings_id === inn.id).sort((a, b) =>
            a.over_number !== b.over_number ? a.over_number - b.over_number : (a.ball_in_over || 0) - (b.ball_in_over || 0));
          const rows = innDeliveries.map((d, idx) => {
            let description = '';
            if (d.is_wicket) description = `WICKET! ${playersMap[d.player_out_id]?.name || ''} ${d.wicket_type}`;
            else if (d.is_wide) description = `Wide +${d.runs_bat || 0}`;
            else if (d.is_no_ball) description = `No ball +${d.runs_bat || 0}`;
            else if (d.is_bye) description = `${d.bye_runs} bye(s)`;
            else if (d.is_leg_bye) description = `${d.leg_bye_runs} leg bye(s)`;
            else if (d.runs_bat === 0) description = 'dot ball';
            else if (d.runs_bat === 4) description = 'FOUR!';
            else if (d.runs_bat === 6) description = 'SIX!';
            else description = `${d.runs_bat} run(s)`;
            const cls = d.is_wicket ? 'color:#ef4444' : d.runs_bat >= 4 ? 'color:#10b981' : 'color:#94a3b8';
            return `<div style="font-size:0.78rem;padding:2px 0"><span style="color:#64748b;display:inline-block;width:46px">${d.over_number}.${d.ball_in_over || (idx + 1)}</span> <span style="color:#64748b">${playersMap[d.bowler_id]?.name || 'Unknown'} to ${playersMap[d.striker_id]?.name || 'Unknown'}:</span> <span style="${cls}">${description}</span></div>`;
          }).join('');
          return `<div style="margin-bottom:18px"><h4 style="color:#10b981;margin-bottom:6px">${t(inn.batting_team_id)} Innings${inn.is_super_over ? ` (Super Over ${inn.super_over_number})` : ''}</h4>${rows}</div>`;
        }).join('')}
      </div>` : '';

    return `
      <h1>${t(match?.team1_id)} vs ${t(match?.team2_id)}</h1>
      <p class="meta">${match?.venue || ''} &nbsp;|&nbsp; ${match?.date || ''}</p>
      ${match?.result ? `<div class="result-box">🏆 ${match.result}</div>` : ''}
      <h2>Match Report</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">${scoreline}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${batting}${bowling}${partnership}${trends}</div>
      <h2>Phase Breakdown</h2>
      <div class="card">${phases}</div>
      ${wormSection}
      ${inningsRows}
      ${visualSection}
      ${includeBallLog ? logSection : ''}
    `;
  };

  const handleDownloadHTML = () => {
    downloadHTML(buildHTML(), `match_report_${t(match?.team1_id)}_vs_${t(match?.team2_id)}`);
  };

  const buildCSV = () => {
    const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
    const reg = innings.filter(i => !i.is_super_over).sort((a, b) => a.innings_number - b.innings_number);
    const allDeliveries = deliveries.filter(d => !d.is_voided);
    const out = [];

    out.push('MATCH REPORT');
    out.push(`Match,${q(`${t(match?.team1_id)} vs ${t(match?.team2_id)}`)}`);
    out.push(`Venue,${q(match?.venue || '')}`);
    out.push(`Date,${q(match?.date || '')}`);
    if (match?.result) out.push(`Result,${q(match.result)}`);
    out.push('');

    out.push('INNINGS SCORELINE');
    out.push('Innings,Score,Overs,Top Batter,Batter SR,Top Bowler,Bowler Econ');
    data.perInnings.forEach(({ inn, topBatter, topBowler }) => {
      out.push([
        q(t(inn.batting_team_id)),
        `${inn.total_runs}/${inn.total_wickets}`,
        ovStr(inn.total_balls),
        topBatter ? q(`${p(topBatter.player_id)} ${topBatter.runs}(${topBatter.balls_faced})`) : '',
        topBatter ? (topBatter.balls_faced ? ((topBatter.runs / topBatter.balls_faced) * 100).toFixed(0) : 0) : '',
        topBowler ? q(`${p(topBowler.player_id)} ${topBowler.wickets}/${topBowler.runs_conceded}`) : '',
        topBowler ? econOf(topBowler).toFixed(1) : '',
      ].join(','));
    });
    out.push('');

    out.push('BATTING HIGHLIGHTS');
    out.push('Metric,Player,Detail');
    if (data.topScorer) out.push(`Top Scorer,${q(p(data.topScorer.player_id))},${q(`${data.topScorer.runs}(${data.topScorer.balls_faced}), ${data.topScorer.fours}x4 ${data.topScorer.sixes}x6`)}`);
    if (data.bestSR) out.push(`Best Strike Rate,${q(p(data.bestSR.player_id))},${q(`${data.bestSR.runs}(${data.bestSR.balls_faced})`)}`);
    out.push('');

    out.push('BOWLING HIGHLIGHTS');
    out.push('Metric,Player,Detail');
    if (data.topWicketTaker) out.push(`Top Wicket-taker,${q(p(data.topWicketTaker.player_id))},${q(`${data.topWicketTaker.wickets} wkts, ${data.topWicketTaker.runs_conceded}r`)}`);
    if (data.mostEconomical) out.push(`Most Economical,${q(p(data.mostEconomical.player_id))},${q(`econ ${econOf(data.mostEconomical).toFixed(2)}`)}`);
    out.push('');

    out.push('KEY PARTNERSHIP');
    out.push('Wicket,Batter 1,Batter 2,Runs,Balls');
    if (data.highestPartnership) {
      const hp = data.highestPartnership;
      out.push(`${hp.wicket_number},${q(p(hp.batter1_id))},${q(p(hp.batter2_id))},${hp.runs},${hp.balls}`);
    }
    out.push('');

    out.push('TACTICAL TRENDS');
    out.push('Metric,Value');
    out.push(`Boundaries,${data.totals.fours}x4 / ${data.totals.sixes}x6`);
    out.push(`Dot ball %,${data.totals.legal ? ((data.totals.dots / data.totals.legal) * 100).toFixed(0) : 0}%`);
    out.push(`Pace,${data.byType.pace.w} wkts / ${data.byType.pace.r} runs (econ ${rr(data.byType.pace.r, data.byType.pace.b)})`);
    out.push(`Spin,${data.byType.spin.w} wkts / ${data.byType.spin.r} runs (econ ${rr(data.byType.spin.r, data.byType.spin.b)})`);
    if (data.lenSorted[0]) out.push(`Top length,${q(data.lenSorted[0][0])} (${data.lenSorted[0][1]} balls)`);
    out.push('');

    out.push('PHASE BREAKDOWN');
    out.push('Innings,Phase,Runs,Balls,Run Rate');
    data.perInnings.forEach(({ inn, phases }) => {
      ['Powerplay', 'Middle', 'Death'].forEach(ph => {
        out.push([q(t(inn.batting_team_id)), ph, phases[ph].r, ovStr(phases[ph].b), rr(phases[ph].r, phases[ph].b)].join(','));
      });
    });
    out.push('');

    reg.forEach(inn => {
      const batters = batterInnings.filter(b => b.innings_id === inn.id).sort((a, b) => a.batting_position - b.batting_position);
      const bowlers = bowlerInnings.filter(b => b.innings_id === inn.id);
      const innPart = partnerships.filter(pr => pr.innings_id === inn.id).sort((a, b) => a.wicket_number - b.wicket_number);
      const extras = (inn.extras_wide || 0) + (inn.extras_no_ball || 0) + (inn.extras_byes || 0) + (inn.extras_leg_byes || 0);

      out.push(`${t(inn.batting_team_id)} INNINGS`);
      out.push(`Total,${inn.total_runs}/${inn.total_wickets} (${ovStr(inn.total_balls)} overs)`);
      out.push(`Extras,${extras} (Wd ${inn.extras_wide || 0}, Nb ${inn.extras_no_ball || 0}, B ${inn.extras_byes || 0}, Lb ${inn.extras_leg_byes || 0})`);
      out.push('');

      out.push('Batting');
      out.push('Batter,Runs,Balls,4s,6s,SR,Dismissal');
      batters.forEach(b => {
        const sr = b.balls_faced > 0 ? ((b.runs / b.balls_faced) * 100).toFixed(1) : '0.0';
        out.push([q(p(b.player_id)), b.runs, b.balls_faced, b.fours, b.sixes, sr, q(getDismissalText(b))].join(','));
      });
      out.push('');

      out.push('Bowling');
      out.push('Bowler,Overs,Maidens,Runs,Wickets,Economy');
      bowlers.forEach(b => {
        const econ = b.balls > 0 ? (b.runs_conceded / (b.balls / 6)).toFixed(2) : '0.00';
        out.push([q(p(b.player_id)), `${b.overs}.${b.balls % 6}`, b.maidens || 0, b.runs_conceded, b.wickets, econ].join(','));
      });
      out.push('');

      if (innPart.length > 0) {
        out.push('Partnerships');
        out.push('Wkt,Batter 1,B1 Runs,B1 Balls,Batter 2,B2 Runs,B2 Balls,Runs,Balls');
        innPart.forEach(pr => {
          out.push([pr.wicket_number, q(p(pr.batter1_id)), pr.batter1_runs, pr.batter1_balls, q(p(pr.batter2_id)), pr.batter2_runs, pr.batter2_balls, pr.runs, pr.balls].join(','));
        });
        out.push('');
      }
    });

    if (includeBallLog && allDeliveries.length > 0) {
      out.push('BALL-BY-BALL LOG');
      out.push('Innings,Over.Ball,Bowler,Strriker,Description');
      innings.forEach(inn => {
        const innDeliveries = allDeliveries.filter(d => d.innings_id === inn.id).sort((a, b) =>
          a.over_number !== b.over_number ? a.over_number - b.over_number : (a.ball_in_over || 0) - (b.ball_in_over || 0));
        innDeliveries.forEach((d, idx) => {
          let description = '';
          if (d.is_wicket) description = `WICKET! ${playersMap[d.player_out_id]?.name || ''} ${d.wicket_type}`;
          else if (d.is_wide) description = `Wide +${d.runs_bat || 0}`;
          else if (d.is_no_ball) description = `No ball +${d.runs_bat || 0}`;
          else if (d.is_bye) description = `${d.bye_runs} bye(s)`;
          else if (d.is_leg_bye) description = `${d.leg_bye_runs} leg bye(s)`;
          else if (d.runs_bat === 0) description = 'dot ball';
          else if (d.runs_bat === 4) description = 'FOUR!';
          else if (d.runs_bat === 6) description = 'SIX!';
          else description = `${d.runs_bat} run(s)`;
          out.push([q(`${t(inn.batting_team_id)}${inn.is_super_over ? ` (Super Over ${inn.super_over_number})` : ''}`), `${d.over_number}.${d.ball_in_over || (idx + 1)}`, q(playersMap[d.bowler_id]?.name || 'Unknown'), q(playersMap[d.striker_id]?.name || 'Unknown'), q(description)].join(','));
        });
      });
      out.push('');
    }

    return out.join('\n');
  };

  const handleDownloadCSV = () => {
    const blob = new Blob([buildCSV()], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match_scorecard_${t(match?.team1_id)}_vs_${t(match?.team2_id)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const Section = ({ icon: Icon, title, children }) => (
    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-emerald-400" />
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      {children}
    </div>
  );

  const Stat = ({ label, value, sub }) => (
    <div className="flex items-baseline justify-between text-xs py-1">
      <span className="text-slate-400">{label}</span>
      <span className="text-right">
        <span className="text-white font-medium">{value}</span>
        {sub && <span className="text-slate-500 ml-1">{sub}</span>}
      </span>
    </div>
  );

  return (
    <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Match Report</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors">
            <Clipboard className="w-3.5 h-3.5" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors">
              <Download className="w-3.5 h-3.5" />
              Report
              <ChevronDown className="w-3 h-3" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-lg bg-slate-800 border border-slate-700 shadow-xl py-1 overflow-hidden">
                  <label className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBallLog}
                      onChange={(e) => setIncludeBallLog(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-emerald-500"
                    />
                    Include ball-by-ball log
                  </label>
                  <div className="border-t border-slate-700 my-1" />
                  <button onClick={() => { handleDownloadHTML(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors">
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-400" />
                    Download HTML
                  </button>
                  <button onClick={() => { handleDownloadCSV(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors">
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Download CSV
                  </button>
                  <button onClick={() => { handleDownload(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    Download Text
                  </button>
                  <button onClick={() => { handleCopy(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 transition-colors">
                    <Clipboard className="w-3.5 h-3.5 text-amber-400" />
                    Copy to clipboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Innings scoreline */}
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        {data.perInnings.map(({ inn, topBatter, topBowler }) => (
          <div key={inn.id} className="bg-slate-900/40 rounded-xl p-3 border border-slate-700/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-white">{t(inn.batting_team_id)}</span>
              <span className="text-lg font-bold text-white">{inn.total_runs}/{inn.total_wickets} <span className="text-xs text-slate-500 font-normal">({ovStr(inn.total_balls)})</span></span>
            </div>
            {topBatter && <Stat label={`Bat: ${p(topBatter.player_id)}`} value={`${topBatter.runs}(${topBatter.balls_faced})`} sub={`SR ${topBatter.balls_faced ? ((topBatter.runs / topBatter.balls_faced) * 100).toFixed(0) : 0}`} />}
            {topBowler && <Stat label={`Bowl: ${p(topBowler.player_id)}`} value={`${topBowler.wickets}/${topBowler.runs_conceded}`} sub={`econ ${econOf(topBowler).toFixed(1)}`} />}
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Section icon={Award} title="Batting Highlights">
          {data.topScorer && <Stat label="Top Scorer" value={p(data.topScorer.player_id)} sub={`${data.topScorer.runs}(${data.topScorer.balls_faced}), ${data.topScorer.fours}x4 ${data.topScorer.sixes}x6`} />}
          {data.bestSR && <Stat label="Best Strike Rate" value={p(data.bestSR.player_id)} sub={`${data.bestSR.runs}(${data.bestSR.balls_faced})`} />}
        </Section>

        <Section icon={Target} title="Bowling Highlights">
          {data.topWicketTaker && <Stat label="Top Wicket-taker" value={p(data.topWicketTaker.player_id)} sub={`${data.topWicketTaker.wickets}wkts, ${data.topWicketTaker.runs_conceded}r`} />}
          {data.mostEconomical && <Stat label="Most Economical" value={p(data.mostEconomical.player_id)} sub={`econ ${econOf(data.mostEconomical).toFixed(2)}`} />}
        </Section>

        <Section icon={Users} title="Key Partnership">
          {data.highestPartnership ? (
            <Stat label={`Highest (Wk ${data.highestPartnership.wicket_number})`} value={p(data.highestPartnership.batter1_id)} sub={`& ${p(data.highestPartnership.batter2_id)} — ${data.highestPartnership.runs}(${data.highestPartnership.balls})`} />
          ) : <p className="text-xs text-slate-500">No partnership data</p>}
        </Section>

        <Section icon={Zap} title="Tactical Trends">
          <Stat label="Boundaries" value={`${data.totals.fours}x4 / ${data.totals.sixes}x6`} />
          <Stat label="Dot ball %" value={`${data.totals.legal ? ((data.totals.dots / data.totals.legal) * 100).toFixed(0) : 0}%`} />
          <Stat label="Pace vs Spin" value={`${data.byType.pace.w}/${data.byType.pace.r} | ${data.byType.spin.w}/${data.byType.spin.r}`} sub="wkts/runs" />
          {data.lenSorted[0] && <Stat label="Top length" value={data.lenSorted[0][0]} sub={`${data.lenSorted[0][1]} balls`} />}
        </Section>
      </div>

      {/* Phase breakdown */}
      <div className="mt-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/50">
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Phase Breakdown</h4>
        {data.perInnings.map(({ inn, phases }) => (
          <div key={inn.id} className="mb-2 last:mb-0">
            <p className="text-xs text-slate-400 mb-1">{t(inn.batting_team_id)}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['Powerplay', 'Middle', 'Death'].map(ph => (
                <div key={ph} className="bg-slate-900/40 rounded-lg p-2 text-center">
                  <div className="text-slate-500">{ph}</div>
                  <div className="text-white font-medium">{phases[ph].r}/{ovStr(phases[ph].b)}</div>
                  <div className="text-emerald-400">{rr(phases[ph].r, phases[ph].b)} RR</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}