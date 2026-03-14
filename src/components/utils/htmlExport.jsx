export function downloadHTML(html, filename) {
  const full = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${filename}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #f1f5f9; padding: 24px; }
  h1 { font-size: 1.75rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
  h2 { font-size: 1.25rem; font-weight: 700; color: #10b981; margin: 24px 0 12px; }
  h3 { font-size: 1rem; font-weight: 600; color: #fff; margin-bottom: 8px; }
  p  { color: #94a3b8; font-size: 0.85rem; margin-bottom: 16px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-box { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 14px; text-align: center; }
  .stat-val { font-size: 1.6rem; font-weight: 800; color: #fff; }
  .stat-lbl { font-size: 0.75rem; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  th { text-align: left; padding: 8px 10px; color: #64748b; border-bottom: 1px solid #334155; font-weight: 600; }
  td { padding: 8px 10px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
  td:first-child, th:first-child { color: #fff; font-weight: 600; }
  .green { color: #10b981; } .red { color: #ef4444; } .amber { color: #f59e0b; } .cyan { color: #06b6d4; }
  .result-box { background: #10b98115; border: 1px solid #10b98140; border-radius: 10px; padding: 14px; margin-bottom: 20px; color: #10b981; font-weight: 600; font-size: 1rem; }
  .meta { font-size: 0.8rem; color: #64748b; margin-bottom: 16px; }
  .compare-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #1e293b; }
  .compare-a { color: #10b981; font-weight: 700; min-width: 60px; }
  .compare-b { color: #f59e0b; font-weight: 700; min-width: 60px; text-align: right; }
  .compare-lbl { color: #64748b; font-size: 0.8rem; text-align: center; flex: 1; }
  .player-header { border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 12px; }
  .player-a { background: #10b98115; border: 1px solid #10b98140; }
  .player-b { background: #f59e0b15; border: 1px solid #f59e0b40; }
  .verdict-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .verdict-card { border-radius: 8px; padding: 12px; }
  .verdict-a { background: #10b98115; border: 1px solid #10b98130; }
  .verdict-b { background: #f59e0b15; border: 1px solid #f59e0b30; }
  @media (max-width: 600px) { .grid2, .grid4, .verdict-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>${html}</body>
</html>`;
  const blob = new Blob([full], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}