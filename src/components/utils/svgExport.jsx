/**
 * Generates inline SVG strings for wagon wheel and pitch map
 * to be embedded in exported HTML reports.
 */

// ── Wagon Wheel ──────────────────────────────────────────────────────────────

const REGION_LABELS = [
  { label: 'Fine Leg',   angle: 38,  r: 0.82 },
  { label: 'Sq Leg',     angle: 90,  r: 0.84 },
  { label: 'Mid Wicket', angle: 122, r: 0.80 },
  { label: 'Mid On',     angle: 152, r: 0.82 },
  { label: 'Straight',   angle: 178, r: 0.82 },
  { label: 'Mid Off',    angle: 208, r: 0.82 },
  { label: 'Cover',      angle: 242, r: 0.80 },
  { label: 'Point',      angle: 272, r: 0.84 },
  { label: 'Gully',      angle: 310, r: 0.68 },
  { label: 'Third Man',  angle: 332, r: 0.82 },
];

const SECTOR_ANGLES = [22, 60, 105, 135, 165, 195, 225, 248, 270, 300, 324, 355];

function shotColor(runs, isWicket) {
  if (isWicket) return '#ef4444';
  if (runs === 6) return '#f59e0b';
  if (runs === 4) return '#10b981';
  if (runs === 0) return '#64748b';
  return '#60a5fa';
}

export function generateWagonWheelSVG(deliveries = [], size = 260) {
  const shots = deliveries.filter(d => d.shot_x != null && d.shot_y != null && !d.is_voided);
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 12;

  const labelToSvg = (angle, r) => {
    const rad = (angle - 90) * Math.PI / 180;
    return { lx: cx + Math.cos(rad) * R * r, ly: cy + Math.sin(rad) * R * r };
  };

  const toSvg = (x, y) => ({ sx: cx + x * R, sy: cy - y * R });

  const sectorLines = SECTOR_ANGLES.map(deg => {
    const rad = (deg - 90) * Math.PI / 180;
    return `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(rad) * R}" y2="${cy + Math.sin(rad) * R}" stroke="#14532d" stroke-width="0.8" stroke-dasharray="3,8"/>`;
  }).join('');

  const regionLabels = REGION_LABELS.map(({ label, angle, r }) => {
    const { lx, ly } = labelToSvg(angle, r);
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="#bbf7d0" font-size="9" font-weight="500" opacity="0.9">${label}</text>`;
  }).join('');

  const shotMarkers = shots.map(s => {
    const { sx, sy } = toSvg(s.shot_x, s.shot_y);
    const runs = s.runs_bat || 0;
    const col = shotColor(runs, s.is_wicket);
    const isBoundary = runs === 4 || runs === 6;
    const dist = Math.sqrt(s.shot_x * s.shot_x + s.shot_y * s.shot_y) || 1;
    const ex = isBoundary ? cx + (s.shot_x / dist) * R : sx;
    const ey = isBoundary ? cy - (s.shot_y / dist) * R : sy;
    return `<line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="${col}" stroke-width="${isBoundary ? 1.8 : 1.2}" opacity="${isBoundary ? 0.75 : 0.5}"/>
<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="5" fill="${col}" opacity="0.9"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="#166534" stroke="#22c55e" stroke-width="2.5"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.95}" fill="none" stroke="#14532d" stroke-width="${R * 0.08}" opacity="0.35"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.48}" fill="#16a34a" opacity="0.5"/>
  <circle cx="${cx}" cy="${cy}" r="${R * 0.48}" fill="none" stroke="#bbf7d0" stroke-width="1.5" stroke-dasharray="6,5" opacity="0.7"/>
  ${sectorLines}
  <rect x="${cx - R * 0.045}" y="${cy - R * 0.23}" width="${R * 0.09}" height="${R * 0.46}" fill="#ca8a04" stroke="#fbbf24" stroke-width="1" rx="2"/>
  <line x1="${cx - R*0.1}" y1="${cy - R*0.23}" x2="${cx + R*0.1}" y2="${cy - R*0.23}" stroke="#fff" stroke-width="1.2"/>
  <line x1="${cx - R*0.1}" y1="${cy + R*0.23}" x2="${cx + R*0.1}" y2="${cy + R*0.23}" stroke="#fff" stroke-width="1.2"/>
  <circle cx="${cx}" cy="${cy - R*0.32}" r="${R*0.025}" fill="#ef4444"/>
  <text x="${cx + R*0.04}" y="${cy - R*0.31}" fill="#fca5a5" font-size="8" dominant-baseline="middle">WK</text>
  ${regionLabels}
  <text x="${cx - R * 0.82}" y="${cy - R * 0.05}" fill="#6ee7b7" font-size="10" text-anchor="middle" font-weight="bold">OFF</text>
  <text x="${cx + R * 0.82}" y="${cy - R * 0.05}" fill="#fcd34d" font-size="10" text-anchor="middle" font-weight="bold">LEG</text>
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

export function pitchLegend() {
  return `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:0.75rem;color:#94a3b8">
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;margin-right:4px"></span>Wicket</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f59e0b;margin-right:4px"></span>Boundary</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#10b981;margin-right:4px"></span>Run</span>
    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#64748b;margin-right:4px"></span>Dot</span>
  </div>`;
}