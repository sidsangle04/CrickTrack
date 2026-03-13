import React, { useRef } from 'react';

// Returns region name from click coordinates (center=0,0, radius=1)
// x>0 = OFF side (right), y>0 = BEHIND batter (top), y<0 = IN FRONT toward bowler (bottom)
export function classifyShot(x, y) {
  const angle = Math.atan2(-y, x) * (180 / Math.PI);
  const normalized = ((angle % 360) + 360) % 360;
  const dist = Math.sqrt(x * x + y * y);

  let region;
  // 0=right(point/off), going clockwise
  // lower-right = cover/mid-off, lower = straight/mid-on, left = leg side, upper = fine leg/third man
  if (normalized >= 345 || normalized < 15) region = 'Point';
  else if (normalized >= 15 && normalized < 55) region = 'Cover';
  else if (normalized >= 55 && normalized < 80) region = 'Extra Cover';
  else if (normalized >= 80 && normalized < 105) region = 'Mid Off';
  else if (normalized >= 105 && normalized < 130) region = 'Straight';
  else if (normalized >= 130 && normalized < 160) region = 'Mid On';
  else if (normalized >= 160 && normalized < 200) region = 'Mid Wicket';
  else if (normalized >= 200 && normalized < 230) region = 'Square Leg';
  else if (normalized >= 230 && normalized < 270) region = 'Fine Leg';
  else if (normalized >= 270 && normalized < 315) region = 'Third Man';
  else if (normalized >= 315 && normalized < 345) region = 'Gully';
  else region = 'Point';

  const side = x > 0 ? 'off' : 'leg';
  const distance = dist < 0.35 ? 'inner' : dist < 0.72 ? 'mid' : 'boundary';

  return { region, side, distance };
}

// angle=0 → top, increases clockwise. Formula: rad = (angle-90)*π/180
const REGION_LABELS = [
  { label: 'Third Man', angle: 38,  r: 0.82 },
  { label: 'Gully',     angle: 68,  r: 0.68 },
  { label: 'Point',     angle: 90,  r: 0.84 },
  { label: 'Cover',     angle: 128, r: 0.80 },
  { label: 'Mid Off',   angle: 158, r: 0.84 },
  { label: 'Straight',  angle: 180, r: 0.84 },
  { label: 'Mid On',    angle: 202, r: 0.84 },
  { label: 'Mid Wicket',angle: 232, r: 0.80 },
  { label: 'Sq Leg',    angle: 268, r: 0.84 },
  { label: 'Fine Leg',  angle: 322, r: 0.82 },
];

export default function GroundMap({ onShot, shots = [], highlightShot = null, size = 280 }) {
  const svgRef = useRef();
  const cx = size / 2;
  const cy = size / 2;
  const R = (size / 2) - 12;

  const toSvg = (x, y) => ({
    sx: cx + x * R,
    sy: cy - y * R
  });

  const fromSvg = (sx, sy) => ({
    x: (sx - cx) / R,
    y: -(sy - cy) / R
  });

  const handleClick = (e) => {
    if (!onShot) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = (px - cx) / R;
    const y = -(py - cy) / R;
    const dist = Math.sqrt(x * x + y * y);
    if (dist > 1.05) return;
    const classified = classifyShot(x, y);
    onShot({ x, y, ...classified });
  };

  const shotColor = (s) => {
    if (s.runs === 6) return '#f59e0b';
    if (s.runs === 4) return '#10b981';
    if (s.is_wicket) return '#ef4444';
    if (s.runs === 0) return '#64748b';
    return '#60a5fa';
  };

  // sector boundary angles (0=top, clockwise) between regions
  const sectorAngles = [0, 30, 53, 68, 80, 93, 118, 143, 180, 215, 248, 285, 330];

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      onClick={handleClick}
      className="cursor-crosshair select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Outer boundary - circle */}
      <circle cx={cx} cy={cy} r={R} fill="#166534" stroke="#22c55e" strokeWidth="2" />
      
      {/* Inner grass rings */}
      <circle cx={cx} cy={cy} r={R * 0.92} fill="none" stroke="#14532d" strokeWidth="8" opacity="0.3" />

      {/* 30-yard circle */}
      <circle cx={cx} cy={cy} r={R * 0.48} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="6,5" />

      {/* Sector lines */}
      {sectorAngles.map(deg => {
        const rad = (deg - 90) * Math.PI / 180;
        return (
          <line key={deg}
            x1={cx} y1={cy}
            x2={cx + Math.cos(rad) * R}
            y2={cy + Math.sin(rad) * R}
            stroke="#14532d" strokeWidth="0.8" strokeDasharray="3,7"
          />
        );
      })}

      {/* Pitch rectangle - vertical, batter at bottom, bowler at top */}
      <rect
        x={cx - R * 0.04} y={cy - R * 0.22}
        width={R * 0.08} height={R * 0.44}
        fill="#ca8a04" stroke="#fbbf24" strokeWidth="1" rx="2"
      />

      {/* Batting crease (bottom of pitch - batter's end) */}
      <line x1={cx - R*0.09} y1={cy + R*0.22} x2={cx + R*0.09} y2={cy + R*0.22} stroke="#fff" strokeWidth="1.2" />
      {/* Bowling crease (top of pitch - bowler's end) */}
      <line x1={cx - R*0.09} y1={cy - R*0.22} x2={cx + R*0.09} y2={cy - R*0.22} stroke="#fff" strokeWidth="1.2" />

      {/* Stumps - batter end (bottom) */}
      <line x1={cx} y1={cy + R*0.22} x2={cx} y2={cy + R*0.27} stroke="#fff" strokeWidth="2.5" />
      {/* Stumps - bowler end (top) */}
      <line x1={cx} y1={cy - R*0.22} x2={cx} y2={cy - R*0.27} stroke="#fff" strokeWidth="2.5" />

      {/* Region labels */}
      {REGION_LABELS.map(({ label, angle, r }) => {
        const rad = (angle - 90) * Math.PI / 180;
        const lx = cx + Math.cos(rad) * R * r;
        const ly = cy + Math.sin(rad) * R * r;
        return (
          <text key={label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="#bbf7d0" fontSize={size < 250 ? 7 : 9} fontWeight="500" opacity="0.85">
            {label}
          </text>
        );
      })}

      {/* OFF / LEG labels */}
      <text x={cx + R * 0.78} y={cy + R * 0.15} fill="#6ee7b7" fontSize={size < 250 ? 8 : 10} textAnchor="middle" fontWeight="bold">OFF</text>
      <text x={cx - R * 0.78} y={cy + R * 0.15} fill="#fcd34d" fontSize={size < 250 ? 8 : 10} textAnchor="middle" fontWeight="bold">LEG</text>

      {/* Bowler label at top */}
      <text x={cx} y={cy - R * 0.35} fill="#94a3b8" fontSize="8" textAnchor="middle" opacity="0.7">▲ Bowler</text>

      {/* Shot markers */}
      {shots.map((s, i) => {
        const { sx, sy } = toSvg(s.x, s.y);
        const col = shotColor(s);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={sx} y2={sy} stroke={col} strokeWidth="1.2" opacity="0.5" />
            <circle cx={sx} cy={sy} r={s === highlightShot ? 7 : 5} fill={col} opacity="0.85" />
          </g>
        );
      })}

      {/* Click hint */}
      {shots.length === 0 && onShot && (
        <text x={cx} y={cy + R * 0.5} textAnchor="middle" fill="#4ade80" fontSize="11" opacity="0.7">
          Tap to mark shot
        </text>
      )}
    </svg>
  );
}