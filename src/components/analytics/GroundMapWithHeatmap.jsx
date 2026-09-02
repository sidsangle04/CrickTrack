import React from 'react';
import GroundMap from '../scoring/GroundMap';
import CircularHeatmap from './CircularHeatmap';
import { getTurfZone, TURF_ZONES } from '@/lib/groundShape';

// Rectangular-ground heatmap overlay (per-zone shot density).
function HeatmapOverlay({ deliveries, groundW, groundH }) {
  const zoneCounts = {};
  TURF_ZONES.forEach(z => { zoneCounts[z] = 0; });
  deliveries.forEach(d => {
    if (d.shot_x == null || d.shot_y == null) return;
    const zone = getTurfZone(d.shot_x, d.shot_y);
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });
  const max = Math.max(...Object.values(zoneCounts), 1);
  const zoneRects = {
    'Back Left':    { x: 0,    y: 0,   w: 0.5,  h: 0.5 },
    'Back Right':   { x: 0.5,  y: 0,   w: 0.5,  h: 0.5 },
    'Front Left':   { x: 0,    y: 0.5, w: 0.34, h: 0.5 },
    'Front Center': { x: 0.34, y: 0.5, w: 0.32, h: 0.5 },
    'Front Right':  { x: 0.66, y: 0.5, w: 0.34, h: 0.5 },
  };
  const getHeatColor = (norm) => {
    if (norm < 0.001) return 'rgba(59,130,246,0.05)';
    if (norm < 0.25) return `rgba(59,130,246,${0.15 + norm * 0.6})`;
    if (norm < 0.6) return `rgba(234,179,8,${0.3 + norm * 0.4})`;
    return `rgba(239,68,68,${0.4 + norm * 0.5})`;
  };
  const pad = 12;
  return (
    <>
      {TURF_ZONES.map(zone => {
        const r = zoneRects[zone];
        return (
          <rect key={zone} x={pad + r.x * groundW} y={pad + r.y * groundH}
            width={r.w * groundW} height={r.h * groundH}
            fill={getHeatColor(zoneCounts[zone] / max)} rx="2" />
        );
      })}
      {TURF_ZONES.map(zone => {
        const r = zoneRects[zone];
        const lx = pad + (r.x + r.w / 2) * groundW;
        const ly = pad + (r.y + r.h / 2) * groundH;
        return (
          <g key={`l-${zone}`}>
            <text x={lx} y={ly - 7} textAnchor="middle" fill="white" fontSize="8" opacity="0.8">{zone}</text>
            <text x={lx} y={ly + 7} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity="0.95">{zoneCounts[zone]}</text>
          </g>
        );
      })}
    </>
  );
}

// Shape-aware ground visual: shot plot (wagon wheel) or density heatmap,
// for rectangular (turf) or circular grounds.
export default function GroundMapWithHeatmap({ shots, deliveries, showHeatmap, size, shape }) {
  if (shape === 'circular') {
    return showHeatmap
      ? <CircularHeatmap deliveries={deliveries} size={size} />
      : <GroundMap shots={shots} size={size} />;
  }

  const W = Math.round(size * 0.72), H = size, pad = 12;
  const gW = W - pad * 2, gH = H - pad * 2;
  const cx = W / 2, cy = H / 2;
  const pitchW = gW * 0.13, pitchH = gH * 0.44;
  const pitchX = cx - pitchW / 2, pitchY = cy - pitchH / 2;
  const so = [-pitchW * 0.32, 0, pitchW * 0.32];

  if (!showHeatmap) return <GroundMap shots={shots} size={size} />;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="select-none">
      <rect x={0} y={0} width={W} height={H} fill="#0d1f0d" rx="6" />
      <rect x={pad} y={pad} width={gW} height={gH} fill="#15803d" rx="3" />
      {Array.from({ length: 8 }).map((_, i) => (
        <rect key={i} x={pad} y={pad + i * gH / 8} width={gW} height={gH / 8}
          fill={i % 2 === 0 ? '#166534' : '#15803d'} opacity="0.5" />
      ))}
      <HeatmapOverlay deliveries={deliveries} groundW={gW} groundH={gH} />
      <rect x={pad + 3} y={pad + 3} width={gW - 6} height={gH - 6} fill="none" stroke="white" strokeWidth="1.8" rx="2" />
      <rect x={pitchX} y={pitchY} width={pitchW} height={pitchH} fill="#78350f" stroke="#d97706" strokeWidth="1" rx="2" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.1} x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.1} stroke="white" strokeWidth="1" />
      <line x1={pitchX - pitchW * 0.6} y1={pitchY + pitchH * 0.9} x2={pitchX + pitchW * 1.6} y2={pitchY + pitchH * 0.9} stroke="white" strokeWidth="1" />
      {so.map((off, i) => (
        <g key={i}>
          <line x1={cx + off} y1={pitchY + pitchH * 0.08} x2={cx + off} y2={pitchY - pitchH * 0.06} stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
          <line x1={cx + off} y1={pitchY + pitchH * 0.92} x2={cx + off} y2={pitchY + pitchH * 1.06} stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}