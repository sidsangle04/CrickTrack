import React, { useMemo, useState } from 'react';
import { Clipboard, Download, Award, Zap, Target, TrendingUp, Users } from 'lucide-react';

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

export default function MatchReport({ match, innings, batterInnings, bowlerInnings, deliveries, partnerships, playersMap, teamsMap }) {
  const [copied, setCopied] = useState(false);

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
    const topWicketTaker = [...allBowlers].sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)[0];
    const mostEconomical = [...allBowlers].filter(b => (b.overs + b.balls / 6) >= 1).sort((a, b) => a.economy - b.economy)[0];

    const highestPartnership = [...partnerships].filter(p => reg.some(i => i.id === p.innings_id)).sort((a, b) => b.runs - a.runs)[0];

    const totals = {
      runs: allDels.reduce((s, d) => s + (d.runs_total || 0), 0),
      wickets: allDels.filter(d => d.is_wicket).length,
      fours: allDels.filter(d => d.runs_bat === 4).length,
      sixes: allDels.filter(d => d.runs_bat === 6).length,
      dots: allDels.filter(d => d.is_dot_ball || (d.runs_total === 0 && !d.is_wicket && d.is_legal_delivery !== false)).length,
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
      if (topBowler) lines.push(`  Top bowler: ${p(topBowler.player_id)} ${topBowler.wickets}/${topBowler.runs_conceded} (${topBowler.overs}.${topBowler.balls % 6}), econ ${topBowler.economy?.toFixed(2) || '0.00'}`);
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
      lines.push(`Top wicket-taker: ${p(b.player_id)} — ${b.wickets} wickets (${b.runs_conceded} runs, econ ${b.economy?.toFixed(2) || '0.00'})`);
    }
    if (data.mostEconomical) {
      const b = data.mostEconomical;
      lines.push(`Most economical: ${p(b.player_id)} — econ ${b.economy?.toFixed(2) || '0.00'} (${b.overs}.${b.balls % 6} ov)`);
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
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors">
            <Download className="w-3.5 h-3.5" />
            Share
          </button>
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
            {topBowler && <Stat label={`Bowl: ${p(topBowler.player_id)}`} value={`${topBowler.wickets}/${topBowler.runs_conceded}`} sub={`econ ${topBowler.economy?.toFixed(1) || '0.0'}`} />}
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
          {data.mostEconomical && <Stat label="Most Economical" value={p(data.mostEconomical.player_id)} sub={`econ ${data.mostEconomical.economy?.toFixed(2) || '0.00'}`} />}
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