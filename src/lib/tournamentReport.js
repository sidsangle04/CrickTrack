// Printable tournament statistical report. Opened in a new window with print
// styles so it can be saved as a PDF from the browser's print dialog. The
// document carries the same dark, emerald design language as the app itself.

const LOGO =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatLabel = (format) =>
  String(format || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const table = (head, rows) => `
  <div class="card table-card">
    <table>
      <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody>
    </table>
  </div>`;

export function buildTournamentReport(stats, tournament) {
  const { overview, pointsTable, batting, bowling, fielding, records } = stats;

  const recordRows = Object.entries(records)
    .filter(([, r]) => r)
    .map(([key, r]) => [
      key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      r.value,
      r.name,
      r.match || '',
    ]);

  const tiles = [
    ['Matches', overview.matches],
    ['Runs', overview.runs],
    ['Wickets', overview.wickets],
    ['Overs', overview.overs],
    ['Avg / match', overview.average_per_match ?? '—'],
    ['Fours', overview.fours],
    ['Sixes', overview.sixes],
    ['Highest team', overview.highest_team_score?.value || '—'],
    ['Highest score', overview.highest_individual?.value || '—'],
    ['Best bowling', overview.best_bowling?.value || '—'],
  ];

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<title>${esc(tournament?.name || 'Tournament')} — statistics</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#0f172a}
  body{
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    color:#e2e8f0;font-size:12px;line-height:1.45;
    padding:26px 26px 30px;
    background-image:linear-gradient(135deg,#0f172a 0%,#1e293b 52%,#0f172a 100%);
    background-repeat:no-repeat;background-attachment:fixed;
  }
  .mast{display:flex;align-items:center;justify-content:space-between;gap:16px;
    padding-bottom:14px;border-bottom:1px solid rgba(148,163,184,.22)}
  .brand{display:flex;align-items:center;gap:10px}
  .brand img{height:38px;width:auto;background:#fff;border-radius:8px;padding:4px}
  .brand .name{font-size:17px;font-weight:800;color:#fff;letter-spacing:-.01em}
  .brand .tag{font-size:9px;color:#94a3b8;letter-spacing:.12em;text-transform:uppercase}
  .stamp{text-align:right;font-size:9px;color:#94a3b8;letter-spacing:.08em;text-transform:uppercase}
  .stamp b{display:block;color:#34d399;font-size:11px;letter-spacing:.02em;margin-top:2px}
  .titleblock{margin:20px 0 18px}
  .eyebrow{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.18em;
    text-transform:uppercase;color:#34d399;background:rgba(16,185,129,.12);
    border:1px solid rgba(16,185,129,.35);border-radius:999px;padding:3px 9px}
  h1{font-size:26px;font-weight:800;color:#fff;letter-spacing:-.02em;margin:9px 0 3px}
  .sub{color:#94a3b8;font-size:10.5px}
  h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;
    color:#34d399;margin:20px 0 8px;padding-left:9px;border-left:3px solid #10b981}
  .card{background:#1e293b;border:1px solid rgba(148,163,184,.22);border-radius:12px}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
  .stat{background:#1e293b;border:1px solid rgba(148,163,184,.22);border-radius:10px;
    padding:9px 10px;border-top:2px solid rgba(16,185,129,.55)}
  .stat b{display:block;font-size:16px;font-weight:800;color:#fff;letter-spacing:-.01em}
  .stat span{display:block;margin-top:2px;font-size:8.5px;color:#94a3b8;
    text-transform:uppercase;letter-spacing:.08em}
  .table-card{overflow:hidden;padding:2px 0}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th{text-align:left;background:rgba(16,185,129,.14);color:#6ee7b7;
    padding:6px 8px;font-weight:700;font-size:8.5px;text-transform:uppercase;
    letter-spacing:.07em;border-bottom:1px solid rgba(16,185,129,.28)}
  td{padding:5.5px 8px;color:#cbd5e1;border-bottom:1px solid rgba(148,163,184,.14)}
  td:first-child{color:#64748b;font-variant-numeric:tabular-nums}
  tbody tr:nth-child(even) td{background:rgba(255,255,255,.025)}
  tbody tr:last-child td{border-bottom:none}
  footer{margin-top:22px;padding-top:12px;border-top:1px solid rgba(148,163,184,.22);
    display:flex;justify-content:space-between;gap:12px;
    font-size:8.5px;color:#64748b;letter-spacing:.04em}
  footer b{color:#34d399;font-weight:600}
  @page{size:A4;margin:12mm}
  @media print{
    body{padding:0;background-attachment:scroll}
    h2,table,.card{page-break-inside:avoid}
    tr{page-break-inside:avoid}
  }
</style></head><body>

<div class="mast">
  <div class="brand">
    <img src="${LOGO}" alt="CrickTrack" />
    <div>
      <div class="name">CrickTrack</div>
      <div class="tag">Tag | Analyse | Elevate</div>
    </div>
  </div>
  <div class="stamp">Tournament report<b>${overview.matches} completed ${
    overview.matches === 1 ? 'match' : 'matches'
  }</b></div>
</div>

<div class="titleblock">
  <span class="eyebrow">Tournament Statistics</span>
  <h1>${esc(tournament?.name || 'Tournament')}</h1>
  <div class="sub">Generated ${new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}${tournament?.format ? ` · ${esc(formatLabel(tournament.format))}` : ''}</div>
</div>

<div class="grid">
  ${tiles.map(([l, v]) => `<div class="stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}
</div>

<h2>Points table</h2>
${table(
  ['#', 'Team', 'P', 'W', 'L', 'T', 'NR', 'Pts', 'NRR'],
  pointsTable.map((t, i) => [
    i + 1,
    t.name,
    t.played,
    t.won,
    t.lost,
    t.tied,
    t.no_result,
    t.points,
    t.nrr === null ? '—' : t.nrr.toFixed(3),
  ])
)}

<h2>Batting</h2>
${table(
  ['#', 'Player', 'Team', 'M', 'Inn', 'Runs', 'Balls', 'HS', 'Avg', 'SR', '4s', '6s', '30s', '50s'],
  [...batting]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 25)
    .map((p, i) => [
      i + 1,
      p.name,
      p.team_name,
      p.matches,
      p.innings,
      p.runs,
      p.balls,
      p.hs_text,
      p.average ?? '—',
      p.strike_rate ?? '—',
      p.fours,
      p.sixes,
      p.thirties,
      p.fifties,
    ])
)}

<h2>Bowling</h2>
${table(
  ['#', 'Player', 'Team', 'Overs', 'Runs', 'Wkts', 'Best', 'Avg', 'Econ', 'SR', 'Dots', 'Mdns'],
  [...bowling]
    .sort((a, b) => b.wickets - a.wickets || b.best_sort - a.best_sort)
    .slice(0, 25)
    .map((p, i) => [
      i + 1,
      p.name,
      p.team_name,
      p.overs,
      p.runs,
      p.wickets,
      p.best_text,
      p.average ?? '—',
      p.economy ?? '—',
      p.strike_rate ?? '—',
      p.dots,
      p.maidens,
    ])
)}

<h2>Fielding</h2>
${table(
  ['#', 'Player', 'Team', 'Catches', 'Run-outs', 'Stumpings', 'Total'],
  [...fielding]
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)
    .map((p, i) => [i + 1, p.name, p.team_name, p.catches, p.run_outs, p.stumpings, p.total])
)}

<h2>Tournament records</h2>
${table(['Record', 'Value', 'Name', 'Match'], recordRows)}

<footer>
  <span>Generated by <b>CrickTrack</b> — every figure is calculated from recorded match data.</span>
  <span>cricktrack.com</span>
</footer>
</body></html>`;
}

export function openTournamentReport(stats, tournament) {
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(buildTournamentReport(stats, tournament));
  win.document.close();

  // Print only once the masthead logo has loaded, so it appears in the PDF.
  const print = () => setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  if (win.document.readyState === 'complete') print();
  else win.addEventListener('load', print);
  return true;
}