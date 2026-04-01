import React, { useRef } from 'react';

// OFF side = LEFT (x < 0), LEG side = RIGHT (x > 0)
// y > 0 = toward WK (top), y < 0 = toward bowler (bottom)
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

export default function GroundMap({ onShot, shots = [], highlightShot = null, size = 280 }) {
  const svgRef = useRef();

  // Rectangular turf ground — portrait orientation
  const W = Math.round(size * 0.72);
  const H = size;
  const pad = 12;
  const gX = pad, gY = pad;
  const gW = W - pad * 2;
  const gH = H - pad * 2;
  const cx = W / 2;
  const cy = H / 2;

  // Usable shot mapping radius (so shots don't land on boundary line)
  const rX = gW / 2 * 0.87;
  const rY = gH / 2 * 0.87;

  const toSvg = (x, y) => ({
    sx: cx + x * rX,
    sy: cy - y * rY,
  });

  // Find where direction (dx,dy) from center hits the ground rectangle edge
  const getBoundaryPoint = (x, y) => {
    const dx = x * rX;
    const dy = -y * rY;
    if (dx === 0 && dy === 0) return { ex: cx, ey: cy };
    const edgeX = gW / 2 - 3;
    const edgeY = gH / 2 - 3;
    const sX = dx !== 0 ? edgeX / Math.abs(dx) : Infinity;
    const sY = dy !== 0 ? edgeY / Math.abs(dy) : Infinity;
    const s = Math.min(sX, sY);
    return { ex: cx + dx * s, ey: cy + dy * s };
  };

  const handleClick = (e) => {
    if (!onShot) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    if (px < gX || px > gX + gW || py < gY || py > gY + gH) return;
    const x = Math.max(-1, Math.min(1, (px - cx) / rX));
    const y = Math.max(-1, Math.min(1, -(py - cy) / rY));
    onShot({ x, y, ...classifyShot(x, y) });
  };

  const shotColor = (s) => {
    if (s.is_wicket) return '#ef4444';
    if (s.runs === 6) return '#f59e0b';
    if (s.runs === 4) return '#10b981';
    if (s.runs === 0) return '#64748b';
    return '#60a5fa';
  };

  // Pitch strip dimensions
  const pitchW = gW * 0.13;
  const pitchH = gH * 0.44;
  const pitchX = cx - pitchW / 2;
  const pitchY = cy - pitchH / 2;

  // Stump x positions relative to pitch center
  const stumpOffsets = [-pitchW * 0.32, 0, pitchW * 0.32];

  return (
    <svg
      ref={svgRef}
      width={W}
      height={H}
      onClick={handleClick}
      className={onShot ? 'cursor-crosshair select-none' : 'select-none'}
      style={{ touchAction: 'none' }}
      viewBox={`0 0 ${W} ${H}`}
    >
      {/* Dark cage background */}
      <rect x={0} y={0} width={W} height={H} fill="#0d1f0d" rx="6" />

      {/* Green turf */}
      <rect x={gX} y={gY} width={gW} height={gH} fill="#15803d" rx="3" />

      {/* Subtle alternating mow stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={gX} y={gY + i * (gH / 8)}
          width={gW} height={gH / 8}
          fill={i % 2 === 0 ? '#166534' : '#15803d'}
          opacity="0.5"
        />
      ))}

      {/* White boundary line */}
      <rect x={gX + 3} y={gY + 3} width={gW - 6} height={gH - 6}
        fill="none" stroke="white" strokeWidth="1.8" rx="2" />

      {/* Cage corner poles */}
      {[[gX, gY], [gX + gW, gY], [gX, gY + gH], [gX + gW, gY + gH]].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r={3.5} fill="#374151" stroke="#6b7280" strokeWidth="0.8" />
      ))}

      {/* Floodlight glow top corners */}
      <circle cx={gX + gW * 0.15} cy={gY - 2} r={8} fill="#22d3ee" opacity="0.18" />
      <circle cx={gX + gW * 0.85} cy={gY - 2} r={8} fill="#22d3ee" opacity="0.18" />
      <circle cx={gX + gW * 0.15} cy={gY + gH + 2} r={8} fill="#22d3ee" opacity="0.18" />
      <circle cx={gX + gW * 0.85} cy={gY + gH + 2} r={8} fill="#22d3ee" opacity="0.18" />

      {/* Central pitch */}
      <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH}
        fill="#78350f" stroke="#d97706" strokeWidth="1" rx="2" />

      {/* Crease lines */}
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.1}
            x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.1}
            stroke="white" strokeWidth="1" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.9}
            x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.9}
            stroke="white" strokeWidth="1" />

      {/* Stumps — batter end (top) */}
      {stumpOffsets.map((off, i) => (
        <line key={`st${i}`}
          x1={cx + off} y1={pitchY + pitchH * 0.08}
          x2={cx + off} y2={pitchY - pitchH * 0.06}
          stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
      ))}

      {/* Bails top */}
      <line x1={cx + stumpOffsets[0]} y1={pitchY - pitchH * 0.06}
            x2={cx + stumpOffsets[2]} y2={pitchY - pitchH * 0.06}
            stroke="#fbbf24" strokeWidth="1" />

      {/* Stumps — bowler end (bottom) */}
      {stumpOffsets.map((off, i) => (
        <line key={`sb${i}`}
          x1={cx + off} y1={pitchY + pitchH * 0.92}
          x2={cx + off} y2={pitchY + pitchH * 1.06}
          stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
      ))}

      {/* Bails bottom */}
      <line x1={cx + stumpOffsets[0]} y1={pitchY + pitchH * 1.06}
            x2={cx + stumpOffsets[2]} y2={pitchY + pitchH * 1.06}
            stroke="#fbbf24" strokeWidth="1" />

      {/* Shot lines and markers */}
      {shots.map((s, i) => {
        const { sx, sy } = toSvg(s.x, s.y);
        const col = shotColor(s);
        const isBoundary = s.runs === 4 || s.runs === 6;
        const { ex, ey } = isBoundary ? getBoundaryPoint(s.x, s.y) : { ex: sx, ey: sy };
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={ex} y2={ey}
              stroke={col} strokeWidth={isBoundary ? 2 : 1.4} opacity={isBoundary ? 0.8 : 0.55} />
            <circle cx={sx} cy={sy} r={s === highlightShot ? 7 : 5} fill={col} opacity="0.92"
              stroke="#000" strokeWidth="0.5" />
          </g>
        );
      })}

      {shots.length === 0 && onShot && (
        <text x={cx} y={cy + pitchH * 0.85} textAnchor="middle" fill="#4ade80" fontSize="10" opacity="0.7">
          Tap to mark shot
        </text>
      )}
    </svg>
  );
}