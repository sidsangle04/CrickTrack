import React, { useRef } from 'react';

// OFF side = LEFT (x < 0), LEG side = RIGHT (x > 0)
// y > 0 = toward WK (top), y < 0 = toward bowler (bottom)
export function classifyShot(x, y) {
  const angle = Math.atan2(-y, x) * (180 / Math.PI);
  const normalized = ((angle % 360) + 360) % 360;
  const dist = Math.sqrt(x * x + y * y);

  let region;
  // 0° = right (LEG), 90° = bottom (toward bowler), 180° = left (OFF), 270° = top (toward WK)
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

// angle: 0=top, clockwise. lx = cx + cos((a-90)*π/180)*R*r, ly = cy + sin((a-90)*π/180)*R*r
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

// Sector boundary lines (label-angle system, 0=top, clockwise)
const SECTOR_ANGLES = [22, 60, 105, 135, 165, 195, 225, 248, 270, 300, 324, 355];

export default function GroundMap({ onShot, shots = [], highlightShot = null, size = 280 }) {
  const svgRef = useRef();
  const cx = size / 2;
  const cy = size / 2;
  const R = (size / 2) - 12;

  // label-angle → SVG coordinate
  const labelToSvg = (angle, r) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      lx: cx + Math.cos(rad) * R * r,
      ly: cy + Math.sin(rad) * R * r,
    };
  };

  // shot coordinate → SVG (x right=LEG, y up=toward WK)
  const toSvg = (x, y) => ({
    sx: cx + x * R,
    sy: cy - y * R,
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
    if (s.is_wicket) return '#ef4444';
    if (s.runs === 6) return '#f59e0b';
    if (s.runs === 4) return '#10b981';
    if (s.runs === 0) return '#64748b';
    return '#60a5fa';
  };

  return (
    <svg
      ref={svgRef}
      width={size}
      height={size}
      onClick={handleClick}
      className="cursor-crosshair select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Outer boundary */}
      <circle cx={cx} cy={cy} r={R} fill="#166534" stroke="#22c55e" strokeWidth="2.5" />

      {/* Outfield ring shading */}
      <circle cx={cx} cy={cy} r={R * 0.95} fill="none" stroke="#14532d" strokeWidth={R * 0.08} opacity="0.35" />

      {/* 30-yard inner circle */}
      <circle cx={cx} cy={cy} r={R * 0.48} fill="#15803d" stroke="#bbf7d0" strokeWidth="1.5" strokeDasharray="6,5" opacity="0.7" />

      {/* Infield grass */}
      <circle cx={cx} cy={cy} r={R * 0.48} fill="#16a34a" opacity="0.5" />

      {/* Sector lines */}
      {SECTOR_ANGLES.map(deg => {
        const rad = (deg - 90) * Math.PI / 180;
        return (
          <line key={deg}
            x1={cx} y1={cy}
            x2={cx + Math.cos(rad) * R}
            y2={cy + Math.sin(rad) * R}
            stroke="#14532d" strokeWidth="0.8" strokeDasharray="3,8"
          />
        );
      })}

      {/* Pitch rectangle — vertical, batter-end top, bowler-end bottom */}
      <rect
        x={cx - R * 0.045} y={cy - R * 0.23}
        width={R * 0.09} height={R * 0.46}
        fill="#ca8a04" stroke="#fbbf24" strokeWidth="1" rx="2"
      />

      {/* Batting crease (top of pitch, batter's end toward WK) */}
      <line x1={cx - R*0.1} y1={cy - R*0.23} x2={cx + R*0.1} y2={cy - R*0.23} stroke="#fff" strokeWidth="1.2" />
      {/* Bowling crease (bottom, bowler's end) */}
      <line x1={cx - R*0.1} y1={cy + R*0.23} x2={cx + R*0.1} y2={cy + R*0.23} stroke="#fff" strokeWidth="1.2" />

      {/* Stumps batter end (top) */}
      <line x1={cx - R*0.025} y1={cy - R*0.23} x2={cx - R*0.025} y2={cy - R*0.28} stroke="#fff" strokeWidth="2" />
      <line x1={cx}            y1={cy - R*0.23} x2={cx}            y2={cy - R*0.28} stroke="#fff" strokeWidth="2" />
      <line x1={cx + R*0.025} y1={cy - R*0.23} x2={cx + R*0.025} y2={cy - R*0.28} stroke="#fff" strokeWidth="2" />

      {/* Stumps bowler end (bottom) */}
      <line x1={cx - R*0.025} y1={cy + R*0.23} x2={cx - R*0.025} y2={cy + R*0.28} stroke="#fff" strokeWidth="2" />
      <line x1={cx}            y1={cy + R*0.23} x2={cx}            y2={cy + R*0.28} stroke="#fff" strokeWidth="2" />
      <line x1={cx + R*0.025} y1={cy + R*0.23} x2={cx + R*0.025} y2={cy + R*0.28} stroke="#fff" strokeWidth="2" />

      {/* WK dot */}
      <circle cx={cx} cy={cy - R*0.32} r={R*0.025} fill="#ef4444" />
      <text x={cx + R*0.04} y={cy - R*0.31} fill="#fca5a5" fontSize={size < 250 ? 7 : 8} dominantBaseline="middle">WK</text>

      {/* Bowler dot */}
      <circle cx={cx} cy={cy + R*0.38} r={R*0.025} fill="#ef4444" />
      <text x={cx + R*0.04} y={cy + R*0.38} fill="#fca5a5" fontSize={size < 250 ? 7 : 8} dominantBaseline="middle">B</text>

      {/* Region labels */}
      {REGION_LABELS.map(({ label, angle, r }) => {
        const { lx, ly } = labelToSvg(angle, r);
        return (
          <text key={label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="#bbf7d0" fontSize={size < 250 ? 7 : 9} fontWeight="500" opacity="0.9">
            {label}
          </text>
        );
      })}

      {/* OFF / LEG side labels */}
      <text x={cx - R * 0.82} y={cy - R * 0.05} fill="#6ee7b7" fontSize={size < 250 ? 8 : 10} textAnchor="middle" fontWeight="bold">OFF</text>
      <text x={cx + R * 0.82} y={cy - R * 0.05} fill="#fcd34d" fontSize={size < 250 ? 8 : 10} textAnchor="middle" fontWeight="bold">LEG</text>

      {/* Shot markers */}
      {shots.map((s, i) => {
        const { sx, sy } = toSvg(s.x, s.y);
        const col = shotColor(s);
        const isBoundary = s.runs === 4 || s.runs === 6;
        const dist = Math.sqrt(s.x * s.x + s.y * s.y) || 1;
        // For boundaries: extend line to edge of field; for others: stop at clicked point
        const ex = isBoundary ? cx + (s.x / dist) * R : sx;
        const ey = isBoundary ? cy - (s.y / dist) * R : sy;

        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={ex} y2={ey}
              stroke={col} strokeWidth={isBoundary ? 1.8 : 1.2} opacity={isBoundary ? 0.75 : 0.5} />
            <circle cx={sx} cy={sy} r={s === highlightShot ? 7 : 5} fill={col} opacity="0.9" />
          </g>
        );
      })}

      {shots.length === 0 && onShot && (
        <text x={cx} y={cy + R * 0.55} textAnchor="middle" fill="#4ade80" fontSize="11" opacity="0.7">
          Tap to mark shot
        </text>
      )}
    </svg>
  );
}