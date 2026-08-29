import React, { useRef } from 'react';
import { classifyShot, FIELDING_POSITIONS, polarToSvg } from '@/lib/groundShape';

// Circular cricket ground — tap to place a shot. Uses the same (x,y)
// coordinate convention and classifyShot as the rectangular GroundMap, so
// recorded shot_x/shot_y/shot_region are identical in meaning.
export default function CircularGroundMap({ onShot, shots = [], highlightShot = null, size = 280 }) {
  const svgRef = useRef();
  const W = size;
  const H = size;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 10; // boundary radius
  const innerR = R * 0.45;           // 30-yd inner circle

  const toSvg = (x, y) => ({ sx: cx + x * R, sy: cy - y * R });

  const boundaryPoint = (x, y) => {
    const d = Math.sqrt(x * x + y * y);
    if (d === 0) return { ex: cx, ey: cy };
    return { ex: cx + (x / d) * R, ey: cy - (y / d) * R };
  };

  const handleClick = (e) => {
    if (!onShot) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    let x = (px - cx) / R;
    let y = -(py - cy) / R;
    // Clamp to the circular boundary
    const d = Math.sqrt(x * x + y * y);
    if (d > 1) {
      x = x / d;
      y = y / d;
    }
    onShot({ x, y, ...classifyShot(x, y) });
  };

  const shotColor = (s) => {
    if (s.is_wicket) return '#ef4444';
    if (s.runs === 6) return '#f59e0b';
    if (s.runs === 4) return '#10b981';
    if (s.runs === 0) return '#64748b';
    return '#60a5fa';
  };

  // Pitch strip (vertical, center)
  const pitchW = R * 0.12;
  const pitchH = R * 0.5;
  const pitchX = cx - pitchW / 2;
  const pitchY = cy - pitchH / 2;
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
      <rect x={0} y={0} width={W} height={H} fill="#0d1f0d" rx="6" />

      {/* Field */}
      <circle cx={cx} cy={cy} r={R} fill="#15803d" />

      {/* Mow stripes (concentric) */}
      {[0.82, 0.64, 0.46].map((rr, i) => (
        <circle key={i} cx={cx} cy={cy} r={R * rr}
          fill={i % 2 === 0 ? '#166534' : '#15803d'} opacity="0.4" />
      ))}

      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />

      {/* Fielding-position wedge separators + labels */}
      {FIELDING_POSITIONS.map((p) => {
        const mid = (p.from + p.to) / 2;
        const labelPos = polarToSvg(cx, cy, R, mid, 0.8);
        return (
          <g key={p.key}>
            <line
              x1={cx} y1={cy}
              x2={polarToSvg(cx, cy, R, p.from, 1).x}
              y2={polarToSvg(cx, cy, R, p.from, 1).y}
              stroke="white" strokeWidth="0.4" opacity="0.18"
            />
            <text
              x={labelPos.x} y={labelPos.y}
              fill="white" fontSize="7" opacity="0.55"
              textAnchor="middle" dominantBaseline="middle"
            >
              {p.key}
            </text>
          </g>
        );
      })}

      {/* Boundary */}
      <circle cx={cx} cy={cy} r={R - 2} fill="none" stroke="white" strokeWidth="1.8" />

      {/* Pitch */}
      <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH}
        fill="#78350f" stroke="#d97706" strokeWidth="1" rx="2" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.1}
            x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.1}
            stroke="white" strokeWidth="1" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.9}
            x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.9}
            stroke="white" strokeWidth="1" />
      {/* Stumps */}
      {stumpOffsets.map((off, i) => (
        <g key={i}>
          <line x1={cx + off} y1={pitchY + pitchH * 0.08}
                x2={cx + off} y2={pitchY - pitchH * 0.06}
                stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1={cx + off} y1={pitchY + pitchH * 0.92}
                x2={cx + off} y2={pitchY + pitchH * 1.06}
                stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}

      {/* Shots */}
      {shots.map((s, i) => {
        const { sx, sy } = toSvg(s.x, s.y);
        const col = shotColor(s);
        const isBoundary = s.runs === 4 || s.runs === 6;
        const { ex, ey } = isBoundary ? boundaryPoint(s.x, s.y) : { ex: sx, ey: sy };
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
        <text x={cx} y={cy + R * 0.7} textAnchor="middle" fill="#4ade80" fontSize="10" opacity="0.7">
          Tap to mark shot
        </text>
      )}
    </svg>
  );
}