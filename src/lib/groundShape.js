// Centralized ground-shape helpers shared by scoring + analytics.
// Coordinate convention (identical for both shapes, so shot_x/shot_y data
// stays compatible):
//   x < 0 = OFF side (left),  x > 0 = LEG side (right)
//   y > 0 = toward wicket-keeper (top),  y < 0 = toward bowler (bottom)

// ── Rectangular TURF ground zones ───────────────────────────────────────────
export function getTurfZone(x, y) {
  if (y >= 0) return x < 0 ? 'Back Left' : 'Back Right';
  if (x < -0.3) return 'Front Left';
  if (x > 0.3) return 'Front Right';
  return 'Front Center';
}
export const TURF_ZONES = ['Front Left', 'Front Center', 'Front Right', 'Back Left', 'Back Right'];

// ── Shot classification (works for both shapes — angle based) ───────────────
export function classifyShot(x, y) {
  const angle = Math.atan2(-y, x) * (180 / Math.PI);
  const normalized = ((angle % 360) + 360) % 360;
  const dist = Math.sqrt(x * x + y * y);

  let region;
  if (normalized >= 345 || normalized < 20)  region = 'Square Leg';
  else if (normalized >= 20  && normalized < 60)  region = 'Mid Wicket';
  else if (normalized >= 60  && normalized < 80)  region = 'Mid On';
  else if (normalized >= 80  && normalized < 105) region = 'Straight';
  else if (normalized >= 105 && normalized < 130) region = 'Mid Off';
  else if (normalized >= 130 && normalized < 158) region = 'Extra Cover';
  else if (normalized >= 158 && normalized < 192) region = 'Cover';
  else if (normalized >= 192 && normalized < 228) region = 'Point';
  else if (normalized >= 228 && normalized < 258) region = 'Gully';
  else if (normalized >= 258 && normalized < 295) region = 'Third Man';
  else if (normalized >= 295 && normalized < 345) region = 'Fine Leg';
  else region = 'Square Leg';

  const side = x > 0 ? 'leg' : 'off';
  const distance = dist < 0.35 ? 'inner' : dist < 0.72 ? 'mid' : 'boundary';

  return { region, side, distance };
}

// ── Circular fielding-position taxonomy ────────────────────────────────────
// Angle ranges (normalized 0-360, same basis as classifyShot) so a shot's
// shot_region and the wedge it falls in always agree.
export const FIELDING_POSITIONS = [
  { key: 'Fine Leg',    from: 295, to: 345, color: '#0ea5e9' },
  { key: 'Third Man',   from: 258, to: 295, color: '#6366f1' },
  { key: 'Gully',       from: 228, to: 258, color: '#8b5cf6' },
  { key: 'Point',       from: 192, to: 228, color: '#a855f7' },
  { key: 'Cover',       from: 158, to: 192, color: '#ec4899' },
  { key: 'Extra Cover', from: 130, to: 158, color: '#f43f5e' },
  { key: 'Mid Off',     from: 105, to: 130, color: '#f97316' },
  { key: 'Straight',    from: 80,  to: 105, color: '#eab308' },
  { key: 'Mid On',      from: 60,  to: 80,  color: '#84cc16' },
  { key: 'Mid Wicket',  from: 20,  to: 60,  color: '#22c55e' },
  { key: 'Square Leg',  from: 345, to: 380, color: '#14b8a6' }, // wraps 360
];
export const CIRCULAR_ZONES = FIELDING_POSITIONS.map((p) => p.key);

export function getCircularZone(d) {
  if (d.shot_region) return d.shot_region;
  if (d.shot_x == null || d.shot_y == null) return null;
  return classifyShot(d.shot_x, d.shot_y).region;
}

// Shape-aware zone for a delivery record.
export function getZone(shape, d) {
  if (shape === 'circular') return getCircularZone(d);
  if (d.shot_x == null || d.shot_y == null) return null;
  return getTurfZone(d.shot_x, d.shot_y);
}

export function zonesFor(shape) {
  return shape === 'circular' ? CIRCULAR_ZONES : TURF_ZONES;
}

// Polar → SVG point. θ in degrees (normalized angle from classifyShot),
// ρ in [0,1] where 1 = boundary. Maps to the same (x,y) convention as shots.
export function polarToSvg(cx, cy, R, thetaDeg, rho = 1) {
  const t = (thetaDeg * Math.PI) / 180;
  const x = rho * Math.cos(t);
  const y = -rho * Math.sin(t);
  return { x: cx + x * R, y: cy - y * R };
}

// SVG path for a wedge (pie slice) from angle a→b at radius R.
export function wedgePath(cx, cy, R, a, b) {
  const start = polarToSvg(cx, cy, R, a, 1);
  const end = polarToSvg(cx, cy, R, b, 1);
  const large = b - a > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y} Z`;
}