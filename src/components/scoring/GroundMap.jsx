import React, { useRef } from 'react';

// Returns region name from click coordinates (center=0,0, radius=1)
export function classifyShot(x, y) {
  const angle = Math.atan2(-y, x) * (180 / Math.PI); // 0=right(off), 90=straight(top)
  const normalized = ((angle % 360) + 360) % 360;
  const dist = Math.sqrt(x * x + y * y);

  let region;
  // Angle: 0=right (point/cover), 90=top (straight/long on), 180=left (leg/fine leg)
  if (normalized >= 345 || normalized < 15) region = 'Point';
  else if (normalized >= 15 && normalized < 55) region = 'Cover';
  else if (normalized >= 55 && normalized < 80) region = 'Extra Cover';
  else if (normalized >= 80 && normalized < 105) region = 'Mid Off';
  else if (normalized >= 105 && normalized < 130) region = 'Straight';
  else if (normalized >= 130 && normalized < 160) region = 'Mid On';
  else if (normalized >= 160 && normalized < 195) region = 'Mid Wicket';
  else if (normalized >= 195 && normalized < 230) region = 'Square Leg';
  else if (normalized >= 230 && normalized < 270) region = 'Fine Leg';
  else if (normalized >= 270 && normalized < 310) region = 'Third Man';
  else if (normalized >= 310 && normalized < 345) region = 'Backward Point';
  else region = 'Point';

  const side = x > 0 ? 'off' : 'leg';
  const distance = dist < 0.35 ? 'inner' : dist < 0.72 ? 'mid' : 'boundary';

  return { region, side, distance };
}

const REGION_LABELS = [
  { label: 'Third Man', angle: 290, r: 0.82 },
  { label: 'Point', angle: 0, r: 0.82 },
  { label: 'Cover', angle: 35, r: 0.82 },
  { label: 'Mid Off', angle: 92, r: 0.82 },
  { label: 'Straight', angle: 118, r: 0.75 },
  { label: 'Mid On', angle: 145, r: 0.82 },
  { label: 'Mid Wicket', angle: 175, r: 0.82 },
  { label: 'Sq Leg', angle: 212, r: 0.82 },
  { label: 'Fine Leg', angle: 250, r: 0.82 },
];

export default function GroundMap({ onShot, shots = [], highlightShot = null, size = 280 }) {
  const svgRef = useRef();
  const cx = size / 2;
  const cy = size / 2;
  const R = (size / 2) - 10;

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
    if (dist > 1.05) return; // outside field
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
      <ellipse cx={cx} cy={cy} rx={R} ry={R * 0.78} fill="#14532d" stroke="#22c55e" strokeWidth="2" />
      {/* Inner circle (30 yards) */}
      <ellipse cx={cx} cy={cy} rx={R * 0.42} ry={R * 0.33} fill="none" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="5,4" />
      {/* Pitch rectangle */}
      <rect x={cx - R * 0.05} y={cy - R * 0.18} width={R * 0.1} height={R * 0.36}
        fill="#ca8a04" stroke="#fbbf24" strokeWidth="1" rx="2" />
      {/* Stumps top */}
      <line x1={cx} y1={cy - R * 0.18} x2={cx} y2={cy - R * 0.22} stroke="#fff" strokeWidth="2" />
      {/* Stumps bottom */}
      <line x1={cx} y1={cy + R * 0.18} x2={cx} y2={cy + R * 0.22} stroke="#fff" strokeWidth="2" />
      {/* Crease lines */}
      <line x1={cx - R * 0.08} y1={cy - R * 0.18} x2={cx + R * 0.08} y2={cy - R * 0.18} stroke="#fff" strokeWidth="1" />
      <line x1={cx - R * 0.08} y1={cy + R * 0.18} x2={cx + R * 0.08} y2={cy + R * 0.18} stroke="#fff" strokeWidth="1" />
      
      {/* Sector lines */}
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map(deg => {
        const rad = (deg - 90) * Math.PI / 180;
        return (
          <line key={deg}
            x1={cx} y1={cy}
            x2={cx + Math.cos(rad) * R}
            y2={cy + Math.sin(rad) * R * 0.78}
            stroke="#166534" strokeWidth="0.7" strokeDasharray="4,6"
          />
        );
      })}

      {/* Region labels */}
      {REGION_LABELS.map(({ label, angle, r }) => {
        const rad = (angle - 90) * Math.PI / 180;
        const lx = cx + Math.cos(rad) * R * r;
        const ly = cy + Math.sin(rad) * R * r * 0.78;
        return (
          <text key={label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fill="#bbf7d0" fontSize={size < 250 ? 7 : 9} fontWeight="500" opacity="0.9">
            {label}
          </text>
        );
      })}

      {/* OFF / LEG labels */}
      <text x={cx + R * 0.55} y={cy - R * 0.3} fill="#6ee7b7" fontSize="9" textAnchor="middle">OFF</text>
      <text x={cx - R * 0.55} y={cy - R * 0.3} fill="#fcd34d" fontSize="9" textAnchor="middle">LEG</text>

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
        <text x={cx} y={cy + R * 0.45} textAnchor="middle" fill="#4ade80" fontSize="11" opacity="0.7">
          Click to mark shot
        </text>
      )}
    </svg>
  );
}