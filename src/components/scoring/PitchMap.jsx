import React, { useRef } from 'react';

export function classifyPitch(px, py) {
  // px: 0=off side, 1=leg side
  // py: 0=top (bouncer end / bowler end), 1=bottom (batter end / full toss)

  let line;
  if (px < 0.12) line = 'Wide Outside Off';
  else if (px < 0.3) line = 'Outside Off';
  else if (px < 0.45) line = 'Off Stump';
  else if (px < 0.55) line = 'Middle';
  else if (px < 0.68) line = 'Leg Stump';
  else if (px < 0.88) line = 'Outside Leg';
  else line = 'Wide Outside Leg';

  let length;
  if (py < 0.05) length = 'Bouncer';
  else if (py < 0.18) length = 'Short';
  else if (py < 0.35) length = 'Back of Length';
  else if (py < 0.55) length = 'Good Length';
  else if (py < 0.72) length = 'Full';
  else if (py < 0.9) length = 'Yorker';
  else length = 'Full Toss';

  return { line, length };
}

const LENGTH_ZONES = [
  { label: 'Bouncer', y: 0.025, color: '#7f1d1d' },
  { label: 'Short', y: 0.11, color: '#9a3412' },
  { label: 'Back of Length', y: 0.265, color: '#b45309' },
  { label: 'Good Length', y: 0.45, color: '#15803d' },
  { label: 'Full', y: 0.635, color: '#0284c7' },
  { label: 'Yorker', y: 0.81, color: '#7c3aed' },
  { label: 'Full Toss', y: 0.945, color: '#be123c' },
];

export default function PitchMap({ onPitch, pitchMarks = [], highlightMark = null, width = 130, height = 320 }) {
  const svgRef = useRef();

  const pw = width - 20;
  const ph = height - 20;
  const ox = 10;
  const oy = 10;

  const toSvg = (px, py) => ({
    sx: ox + px * pw,
    sy: oy + py * ph
  });

  const handleClick = (e) => {
    if (!onPitch) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left - ox) / pw));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top - oy) / ph));
    const classified = classifyPitch(px, py);
    onPitch({ px, py, ...classified });
  };

  const markColor = (m) => {
    if (m.is_wicket) return '#ef4444';
    if (m.runs === 4 || m.runs === 6) return '#f59e0b';
    if (m.runs === 0) return '#64748b';
    return '#10b981';
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="cursor-crosshair select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Background */}
      <rect x={ox} y={oy} width={pw} height={ph} fill="#1c1917" rx="4" />

      {/* Length zone bands */}
      {LENGTH_ZONES.map((z, i) => {
        const y1 = i === 0 ? oy : oy + LENGTH_ZONES[i - 1].y * ph + (z.y - LENGTH_ZONES[i - 1].y) * ph / 2;
        const y2 = i === LENGTH_ZONES.length - 1 ? oy + ph : oy + z.y * ph + (LENGTH_ZONES[i + 1]?.y - z.y || 0.055) * ph / 2;
        return (
          <rect key={z.label} x={ox} y={y1} width={pw} height={y2 - y1}
            fill={z.color} opacity="0.18" />
        );
      })}

      {/* Stump lines */}
      {[0.35, 0.45, 0.55, 0.65].map((pct, i) => (
        <line key={i} x1={ox + pct * pw} y1={oy} x2={ox + pct * pw} y2={oy + ph}
          stroke="#78716c" strokeWidth="0.5" strokeDasharray="3,4" />
      ))}

      {/* Pitch outline */}
      <rect x={ox} y={oy} width={pw} height={ph} fill="none" stroke="#57534e" strokeWidth="1.5" rx="4" />

      {/* Crease lines */}
      <line x1={ox} y1={oy + 0.12 * ph} x2={ox + pw} y2={oy + 0.12 * ph} stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
      <line x1={ox} y1={oy + 0.88 * ph} x2={ox + pw} y2={oy + 0.88 * ph} stroke="#fbbf24" strokeWidth="1" opacity="0.5" />

      {/* Length labels */}
      {LENGTH_ZONES.map((z) => {
        const { sy } = toSvg(0, z.y);
        return (
          <text key={z.label} x={ox + pw + 2} y={sy} fill={z.color} fontSize="7.5"
            dominantBaseline="middle" opacity="0.9">{z.label}</text>
        );
      })}

      {/* Stump labels */}
      {['Off', 'Mid', 'Leg'].map((l, i) => {
        const x = ox + [0.4, 0.5, 0.6][i] * pw;
        return <text key={l} x={x} y={oy + ph + 12} fill="#a8a29e" fontSize="8" textAnchor="middle">{l}</text>;
      })}

      {/* Pitch marks */}
      {pitchMarks.map((m, i) => {
        const { sx, sy } = toSvg(m.px, m.py);
        const col = markColor(m);
        return (
          <circle key={i} cx={sx} cy={sy} r={m === highlightMark ? 7 : 5}
            fill={col} opacity="0.85" stroke="#000" strokeWidth="0.5" />
        );
      })}

      {/* Click hint */}
      {pitchMarks.length === 0 && onPitch && (
        <text x={ox + pw / 2} y={oy + ph * 0.5} textAnchor="middle" fill="#a8a29e" fontSize="10" opacity="0.7">
          Click pitch
        </text>
      )}
    </svg>
  );
}