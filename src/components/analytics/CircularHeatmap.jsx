import React from 'react';
import { FIELDING_POSITIONS, getCircularZone, polarToSvg, wedgePath } from '@/lib/groundShape';

// Circular ground heatmap: each fielding-position wedge is filled by shot
// density, with a count label. Drop-in replacement for the rectangular
// HeatmapOverlay used in Analytics when ground shape is circular.
export default function CircularHeatmap({ deliveries = [], size = 300 }) {
  const W = size;
  const H = size;
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W, H) / 2 - 10;
  const innerR = R * 0.45;

  const counts = {};
  FIELDING_POSITIONS.forEach((p) => { counts[p.key] = 0; });
  deliveries.forEach((d) => {
    if (d.shot_x == null && d.shot_y == null && !d.shot_region) return;
    const z = getCircularZone(d);
    if (z && counts[z] != null) counts[z]++;
  });
  const max = Math.max(...Object.values(counts), 1);

  const heatColor = (norm) => {
    if (norm < 0.001) return 'rgba(59,130,246,0.05)';
    if (norm < 0.25) return `rgba(59,130,246,${0.15 + norm * 0.6})`;
    if (norm < 0.6) return `rgba(234,179,8,${0.3 + norm * 0.4})`;
    return `rgba(239,68,68,${0.4 + norm * 0.5})`;
  };

  const pitchW = R * 0.12;
  const pitchH = R * 0.5;
  const pitchX = cx - pitchW / 2;
  const pitchY = cy - pitchH / 2;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="select-none">
      <rect x={0} y={0} width={W} height={H} fill="#0d1f0d" rx="6" />
      <circle cx={cx} cy={cy} r={R} fill="#15803d" />

      {/* Wedge heat fills */}
      {FIELDING_POSITIONS.map((p) => (
        <path
          key={p.key}
          d={wedgePath(cx, cy, R, p.from, p.to)}
          fill={heatColor(counts[p.key] / max)}
          stroke="white" strokeWidth="0.4" opacity="0.85"
        />
      ))}

      {/* Wedge labels with counts */}
      {FIELDING_POSITIONS.map((p) => {
        const mid = (p.from + p.to) / 2;
        const pos = polarToSvg(cx, cy, R, mid, 0.78);
        return (
          <g key={`l-${p.key}`}>
            <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill="white" fontSize="7" opacity="0.8">
              {p.key}
            </text>
            <text x={pos.x} y={pos.y + 7} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity="0.95">
              {counts[p.key]}
            </text>
          </g>
        );
      })}

      {/* Inner circle + boundary */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="white" strokeWidth="0.8" opacity="0.4" />
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
    </svg>
  );
}