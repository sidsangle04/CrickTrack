/**
 * Generates inline SVG strings for wagon wheel and pitch map
 * to be embedded in exported HTML reports.
 */

// ── Wagon Wheel (Rectangular Turf Ground) ───────────────────────────────────

export function generateWagonWheelSVG(deliveries = [], size = 260) {
  const shots = deliveries.filter(d => d.shot_x != null && d.shot_y != null && !d.is_voided);
  const W = Math.round(size * 0.72);
  const H = size;
  const pad = 12;
  const gX = pad, gY = pad;
  const gW = W - pad * 2;
  const gH = H - pad * 2;
  const cx = W / 2;
  const cy = H / 2;
  const rX = gW / 2 * 0.87;
  const rY = gH / 2 * 0.87;
  const pitchW = gW * 0.13;
  const pitchH = gH * 0.44;
  const pitchX = cx - pitchW / 2;
  const pitchY = cy - pitchH / 2;
  const so = [-pitchW * 0.32, 0, pitchW * 0.32];

  const getBoundaryPoint = (x, y) => {
    const dx = x * rX, dy = -y * rY;
    if (dx === 0 && dy === 0) return { ex: cx, ey: cy };
    const sX = dx !== 0 ? (gW / 2 - 3) / Math.abs(dx) : Infinity;
    const sY = dy !== 0 ? (gH / 2 - 3) / Math.abs(dy) : Infinity;
    const s = Math.min(sX, sY);
    return { ex: cx + dx * s, ey: cy + dy * s };
  };

  const stripes = Array.from({ length: 8 }).map((_, i) =>
    `<rect x="${gX}" y="${(gY + i * gH / 8).toFixed(1)}" width="${gW}" height="${(gH/8).toFixed(1)}" fill="${i%2===0?'#166534':'#15803d'}" opacity="0.5"/>`
  ).join('');

  const stumpsSvg = so.map(off =>
    `<line x1="${(cx+off).toFixed(1)}" y1="${(pitchY+pitchH*0.08).toFixed(1)}" x2="${(cx+off).toFixed(1)}" y2="${(pitchY-pitchH*0.06).toFixed(1)}" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"/>
     <line x1="${(cx+off).toFixed(1)}" y1="${(pitchY+pitchH*0.92).toFixed(1)}" x2="${(cx+off).toFixed(1)}" y2="${(pitchY+pitchH*1.06).toFixed(1)}" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"/>`
  ).join('');

  const shotMarkers = shots.map(s => {
    const sx = cx + s.shot_x * rX, sy = cy - s.shot_y * rY;
    const runs = s.runs_bat || 0;
    const col = s.is_wicket ? '#ef4444' : runs===6 ? '#f59e0b' : runs===4 ? '#10b981' : runs===0 ? '#64748b' : '#60a5fa';
    const isBoundary = runs === 4 || runs === 6;
    const dx = s.shot_x * rX, dy = -s.shot_y * rY;
    let ex = sx, ey = sy;
    if (isBoundary && (dx !== 0 || dy !== 0)) {
      const sX = dx !== 0 ? (gW/2-3)/Math.abs(dx) : Infinity;
      const sY = dy !== 0 ? (gH/2-3)/Math.abs(dy) : Infinity;
      const sc = Math.min(sX, sY);
      ex = cx + dx * sc; ey = cy + dy * sc;
    }
    return `<line x1="${cx.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${col}" stroke-width="${isBoundary?2:1.4}" opacity="${isBoundary?0.8:0.55}"/>
<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5" fill="${col}" opacity="0.92" stroke="#000" stroke-width="0.5"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="0" width="${W}" height="${H}" fill="#0d1f0d" rx="6"/>
  <rect x="${gX}" y="${gY}" width="${gW}" height="${gH}" fill="#15803d" rx="3"/>
  ${stripes}
  <rect x="${gX+3}" y="${gY+3}" width="${gW-6}" height="${gH-6}" fill="none" stroke="white" stroke-width="1.8" rx="2"/>
  <rect x="${pitchX.toFixed(1)}" y="${pitchY.toFixed(1)}" width="${pitchW.toFixed(1)}" height="${pitchH.toFixed(1)}" fill="#78350f" stroke="#d97706" stroke-width="1" rx="2"/>
  <line x1="${(pitchX-pitchW*0.6).toFixed(1)}" y1="${(pitchY+pitchH*0.1).toFixed(1)}" x2="${(pitchX+pitchW*1.6).toFixed(1)}" y2="${(pitchY+pitchH*0.1).toFixed(1)}" stroke="white" stroke-width="1"/>
  <line x1="${(pitchX-pitchW*0.6).toFixed(1)}" y1="${(pitchY+pitchH*0.9).toFixed(1)}" x2="${(pitchX+pitchW*1.6).toFixed(1)}" y2="${(pitchY+pitchH*0.9).toFixed(1)}" stroke="white" stroke-width="1"/>
  ${stumpsSvg}
  ${shotMarkers}
</svg>`;
}

// ── Pitch Map ─────────────────────────────────────────────────────────────────

const LENGTH_ZONES = [
  { label: 'Full Toss',      y: 0.025, color: '#be123c' },
  { label: 'Yorker',         y: 0.11,  color: '#7c3aed' },
  { label: 'Full',           y: 0.265, color: '#0284c7' },
  { label: 'Good Length',    y: 0.45,  color: '#15803d' },
  { label: 'Back of Length', y: 0.635, color: '#b45309' },
  { label: 'Short',          y: 0.81,  color: '#9a3412' },
  { label: 'Bouncer',        y: 0.945, color: '#7f1d1d' },
];

function pitchMarkColor(runs, isWicket) {
  if (isWicket) return '#ef4444';
  if (runs === 4 || runs === 6) return '#f59e0b';
  if (runs === 0) return '#64748b';
  return '#10b981';
}

export function generatePitchMapSVG(deliveries = [], width = 130, height = 300) {
  const marks = deliveries.filter(d => d.pitch_x != null && d.pitch_y != null && !d.is_voided);
  const ox = 10, oy = 20;
  const pw = width - 20;
  const ph = height - 40;

  const toSvg = (px, py) => ({ sx: ox + px * pw, sy: oy + py * ph });

  const zoneBands = LENGTH_ZONES.map((z, i) => {
    const y1 = i === 0 ? oy : oy + LENGTH_ZONES[i - 1].y * ph + (z.y - LENGTH_ZONES[i - 1].y) * ph / 2;
    const y2 = i === LENGTH_ZONES.length - 1 ? oy + ph : oy + z.y * ph + ((LENGTH_ZONES[i + 1]?.y ?? z.y + 0.055) - z.y) * ph / 2;
    return `<rect x="${ox}" y="${y1.toFixed(1)}" width="${pw}" height="${(y2 - y1).toFixed(1)}" fill="${z.color}" opacity="0.18"/>`;
  }).join('');

  const stumpGuides = [0.35, 0.45, 0.55, 0.65].map(pct =>
    `<line x1="${ox + pct * pw}" y1="${oy}" x2="${ox + pct * pw}" y2="${oy + ph}" stroke="#78716c" stroke-width="0.5" stroke-dasharray="3,4"/>`
  ).join('');

  const lengthLabels = LENGTH_ZONES.map(z => {
    const { sy } = toSvg(0, z.y);
    return `<text x="${ox + pw + 3}" y="${sy.toFixed(1)}" fill="${z.color}" font-size="7" dominant-baseline="middle" opacity="0.9">${z.label}</text>`;
  }).join('');

  const stumpLabels = ['Off', 'Mid', 'Leg'].map((l, i) => {
    const x = ox + [0.4, 0.5, 0.6][i] * pw;
    return `<text x="${x}" y="${oy + ph + 26}" fill="#a8a29e" font-size="8" text-anchor="middle">${l}</text>`;
  }).join('');

  const pitchMarkers = marks.map(m => {
    const { sx, sy } = toSvg(m.pitch_x, m.pitch_y);
    const col = pitchMarkColor(m.runs_bat || 0, m.is_wicket);
    return `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5" fill="${col}" opacity="0.85" stroke="#000" stroke-width="0.5"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 60}" height="${height}">
  <rect x="${ox}" y="${oy}" width="${pw}" height="${ph}" fill="#1c1917" rx="4"/>
  ${zoneBands}
  ${stumpGuides}
  <rect x="${ox}" y="${oy}" width="${pw}" height="${ph}" fill="none" stroke="#57534e" stroke-width="1.5" rx="4"/>
  <line x1="${ox}" y1="${oy + 0.1 * ph}" x2="${ox + pw}" y2="${oy + 0.1 * ph}" stroke="#fbbf24" stroke-width="1.2" opacity="0.6"/>
  <line x1="${ox}" y1="${oy + 0.9 * ph}" x2="${ox + pw}" y2="${oy + 0.9 * ph}" stroke="#fbbf24" stroke-width="1.2" opacity="0.6"/>
  <text x="${ox + pw / 2}" y="${oy - 6}" fill="#fbbf24" font-size="8" text-anchor="middle" opacity="0.8">▼ Batter</text>
  <text x="${ox + pw / 2}" y="${oy + ph + 13}" fill="#94a3b8" font-size="8" text-anchor="middle" opacity="0.7">▲ Bowler</text>
  ${lengthLabels}
  ${stumpLabels}
  ${pitchMarkers}
</svg>`;
}

// ── Legend helpers ────────────────────────────────────────────────────────────

export function wagonWheelLegend(shots) {
  const fours = shots.filter(d => (d.runs_bat || 0) === 4).length;
  const sixes = shots.filter(d => (d.runs_bat || 0) === 6).length;
  const ones  = shots.filter(d => { const r = d.runs_bat||0; return r > 0 && r < 4; }).length;
  const dots  = shots.filter(d => (d.runs_bat||0) === 0 && !d.is_wicket).length;
  const wkts  = shots.filter(d => d.is_wicket).length;
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:0.75rem;color:#94a3b8">
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#60a5fa;margin-right:4px"></span>1-3 (${ones})</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;margin-right:4px"></span>4s (${fours})</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f59e0b;margin-right:4px"></span>6s (${sixes})</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;margin-right:4px"></span>W (${wkts})</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#64748b;margin-right:4px"></span>Dots (${dots})</span>
  </div>`;
}

// ── Worm Graph (both teams run progression) ───────────────────────────────────

export function generateWormGraphSVG(innings = [], deliveries = [], teamsMap = {}, maxOvers, width = 520, height = 260) {
  const regular = innings.filter(i => !i.is_super_over).sort((a, b) => a.innings_number - b.innings_number);
  if (!regular.length) return '';

  const series = regular.map((inn, idx) => {
    const team = teamsMap[inn.batting_team_id];
    const color = team?.primary_color || (idx === 0 ? '#38bdf8' : '#f59e0b');
    const dels = deliveries
      .filter(d => d.innings_id === inn.id && !d.is_voided)
      .sort((a, b) => a.over_number !== b.over_number ? a.over_number - b.over_number : (a.ball_in_over || 0) - (b.ball_in_over || 0));
    let cum = 0, legal = 0, wk = 0;
    const pts = [{ over: 0, runs: 0, wk: false }];
    dels.forEach(d => {
      cum += d.runs_total || 0;
      if (d.is_legal_delivery !== false) legal++;
      if (d.is_wicket) wk++;
      pts.push({ over: +(legal / 6).toFixed(2), runs: cum, wk: !!d.is_wicket });
    });
    return { color, name: team?.short_name || team?.name || `Team ${idx + 1}`, pts };
  });

  const maxRuns = Math.max(...series.flatMap(s => s.pts.map(p => p.runs)), 1);
  const maxOv = maxOvers || Math.max(...series.flatMap(s => s.pts.map(p => p.over)), 1);

  const padL = 36, padR = 16, padT = 16, padB = 30;
  const X = over => padL + (over / maxOv) * (width - padL - padR);
  const Y = runs => height - padB - (runs / maxRuns) * (height - padT - padB);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const r = Math.round(maxRuns * f);
    const y = Y(r);
    return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${width - padR}" y2="${y.toFixed(1)}" stroke="#334155" stroke-width="0.5" stroke-dasharray="3,3"/>
<text x="${padL - 6}" y="${(y + 3).toFixed(1)}" fill="#94a3b8" font-size="9" text-anchor="end">${r}</text>`;
  }).join('');

  const xTicks = Array.from({ length: Math.ceil(maxOv) + 1 }).map((_, o) => {
    const x = X(o);
    return `<text x="${x.toFixed(1)}" y="${height - padB + 14}" fill="#94a3b8" font-size="9" text-anchor="middle">${o}</text>`;
  }).join('');

  const lines = series.map(s => {
    const path = s.pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.over).toFixed(1)},${Y(p.runs).toFixed(1)}`).join(' ');
    const dots = s.pts.filter(p => p.wk).map(p =>
      `<circle cx="${X(p.over).toFixed(1)}" cy="${Y(p.runs).toFixed(1)}" r="3.5" fill="${s.color}" stroke="#0f172a" stroke-width="1"/>`
    ).join('');
    return `<path d="${path}" stroke="${s.color}" stroke-width="2.4" fill="none" opacity="0.92"/>${dots}`;
  }).join('');

  const legend = series.map(s =>
    `<span style="display:inline-flex;align-items:center;margin-right:14px;font-size:0.78rem;color:#cbd5e1">
      <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.color};margin-right:5px"></span>${s.name}
    </span>`
  ).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#0f172a" rx="6"/>
  ${yTicks}
  <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${height - padB}" stroke="#475569" stroke-width="1"/>
  <line x1="${padL}" y1="${height - padB}" x2="${width - padR}" y2="${height - padB}" stroke="#475569" stroke-width="1"/>
  ${xTicks}
  <text x="${padL}" y="${padT - 4}" fill="#94a3b8" font-size="9">Runs</text>
  ${lines}
</svg>
<div style="margin-top:8px">${legend}<span style="font-size:0.72rem;color:#64748b;margin-left:8px">● = wicket</span></div>`;
}

export function pitchLegend() {
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:0.75rem;color:#94a3b8">
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;margin-right:4px"></span>Wicket</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f59e0b;margin-right:4px"></span>Boundary</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;margin-right:4px"></span>Run</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#64748b;margin-right:4px"></span>Dot</span>
  </div>`;
}