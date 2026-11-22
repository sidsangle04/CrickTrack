import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const SEGMENT_COLORS = [
  '#10b981',
  '#0ea5e9',
  '#8b5cf6',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#6366f1',
  '#f97316',
  '#22c55e',
  '#a855f7'
];

const SIZE = 288;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 6;
const LABEL_RADIUS = RADIUS * 0.64;
const SPIN_MS = 4200;
const TURNS = 5;

// Point on the wheel, 0deg at the top going clockwise.
const pointAt = (deg, radius) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
};

const slicePath = (from, to) => {
  const [x1, y1] = pointAt(from, RADIUS);
  const [x2, y2] = pointAt(to, RADIUS);
  const large = to - from > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x2} ${y2} Z`;
};

const fitName = (name, max) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

// A spinning wheel of the players still left in the bowl. The arrow sits at the top;
// whichever name it stops under is handed back to the caller.
export default function SpinWheel({ options, onResult, disabled = false, idleLabel = 'SPIN' }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef(null);

  const count = options.length;
  const seg = count ? 360 / count : 360;
  const fontSize = count > 8 ? 8 : count > 5 ? 9 : 10;
  const maxChars = count > 8 ? 9 : count > 5 ? 11 : 14;

  useEffect(() => () => timer.current && clearTimeout(timer.current), []);

  const spin = () => {
    if (spinning || disabled || !count) return;
    const index = Math.floor(Math.random() * count);
    // Land somewhere inside the winning slice rather than exactly on its edge.
    const mid = (index + 0.5 + (Math.random() - 0.5) * 0.5) * seg;
    let target = rotation + 360 * TURNS;
    const remainder = (((target + mid) % 360) + 360) % 360;
    target += (360 - remainder) % 360;
    setRotation(target);
    setSpinning(true);
    timer.current = setTimeout(() => {
      setSpinning(false);
      onResult && onResult(options[index]);
    }, SPIN_MS);
  };

  return (
    <div className="relative mx-auto w-full max-w-[300px] aspect-square">
      {/* The arrow the wheel stops under */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20 w-0 h-0 border-x-[11px] border-x-transparent border-t-[22px] border-t-emerald-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full block">
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${CENTER}px ${CENTER}px`,
            transition: spinning
              ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.78, 0.16, 1)`
              : 'none'
          }}
        >
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="#1e293b" />
          {options.map((o, i) => (
            <path
              key={`slice-${o.id}`}
              d={slicePath(i * seg, (i + 1) * seg)}
              fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          ))}
          {options.map((o, i) => {
            const mid = (i + 0.5) * seg;
            const [x, y] = pointAt(mid, LABEL_RADIUS);
            return (
              <text
                key={`label-${o.id}`}
                x={x}
                y={y}
                fill="#ffffff"
                fontSize={fontSize}
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ paintOrder: 'stroke', stroke: 'rgba(15,23,42,0.55)', strokeWidth: 2 }}
              >
                {fitName(o.name, maxChars)}
              </text>
            );
          })}
        </g>
      </svg>

      <button
        type="button"
        onClick={spin}
        disabled={spinning || disabled || !count}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[26%] h-[26%] rounded-full bg-slate-950 border-4 border-emerald-500 text-white text-xs font-extrabold tracking-wider shadow-xl flex items-center justify-center disabled:opacity-70"
      >
        {spinning ? <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" /> : idleLabel}
      </button>
    </div>
  );
}