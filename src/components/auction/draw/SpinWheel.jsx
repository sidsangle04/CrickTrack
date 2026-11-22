import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SPIN_MS = 4200;
const R = 96;

const pointAt = (deg, radius) => {
  const rad = (deg * Math.PI) / 180;
  return [radius * Math.sin(rad), -radius * Math.cos(rad)];
};

// One wheel per bowl: the arrow sits at the top and the sector it stops on is the
// player that team gets. The winner is picked first, then the wheel is turned to it.
export default function SpinWheel({ title, entries, hint, active, busy, accent, maxEntries, onSpinComplete }) {
  const [rotation, setRotation] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const timer = useRef(null);

  const cap = maxEntries || 12;
  const sourceKey = entries.map((e) => e.id).join(',');
  // A large pool goes on the wheel as a fresh random shortlist each time it changes,
  // so the names stay readable and every player keeps the same chance of coming up.
  const shown = useMemo(() => {
    if (entries.length <= cap) return entries;
    const copy = [...entries];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, cap);
  }, [sourceKey, cap]);

  const count = shown.length;
  const step = count ? 360 / count : 360;
  const shownKey = shown.map((e) => e.id).join(',');
  const color = accent || '#10b981';

  // A changed wheel means the old landing spot no longer points at anything.
  useEffect(() => {
    setAnimate(false);
    setRotation(0);
  }, [shownKey]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const spin = () => {
    if (spinning || !active || busy || !count) return;
    const winnerIndex = Math.floor(Math.random() * count);
    const centre = winnerIndex * step + step / 2;
    const jitter = (Math.random() - 0.5) * step * 0.45;
    const targetMod = (((360 - centre - jitter) % 360) + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (((targetMod - currentMod) % 360) + 360) % 360;
    setAnimate(true);
    setSpinning(true);
    setRotation(rotation + 360 * 6 + delta);
    timer.current = setTimeout(() => {
      setSpinning(false);
      onSpinComplete && onSpinComplete(shown[winnerIndex]);
    }, SPIN_MS + 140);
  };

  const fontSize = count <= 6 ? 9.5 : count <= 8 ? 8.5 : 7.5;

  const sectors = shown.map((entry, i) => {
    const start = i * step;
    const end = start + step;
    const [x1, y1] = pointAt(start, R);
    const [x2, y2] = pointAt(end, R);
    const large = step > 180 ? 1 : 0;
    const mid = start + step / 2;
    const label = entry.name.length > 15 ? `${entry.name.slice(0, 14)}…` : entry.name;
    const flip = mid > 90 && mid < 270;
    return (
      <g key={entry.id}>
        <path
          d={`M 0 0 L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
          fill={i % 2 ? '#0f766e' : '#134e4a'}
          stroke="#0b1220"
          strokeWidth="1"
        />
        <text
          transform={`rotate(${mid - 90}) translate(${R * 0.6} 0)${flip ? ' rotate(180)' : ''}`}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight="700"
          fill="#ecfdf5"
        >
          {label}
        </text>
      </g>
    );
  });

  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">{title}</p>
        <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
          {entries.length} left
        </span>
      </div>

      <div className="relative w-full aspect-square max-w-[240px] mx-auto">
        {count > 0 ? (
          <>
            <div
              className="absolute inset-0"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: animate
                  ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.72, 0.05, 1)`
                  : 'none'
              }}
            >
              <svg viewBox="-110 -110 220 220" className="w-full h-full">
                {count === 1 ? <circle r={R} fill="#134e4a" stroke="#0b1220" strokeWidth="1" /> : sectors}
                <circle r={R} fill="none" stroke="#334155" strokeWidth="3" />
                <circle r="15" fill="#0b1220" stroke="#334155" strokeWidth="2" />
                <circle r="6" fill={color} />
                {count === 1 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#ecfdf5"
                  >
                    {shown[0].name.length > 15
                      ? `${shown[0].name.slice(0, 14)}…`
                      : shown[0].name}
                  </text>
                )}
              </svg>
            </div>
            <div className="absolute left-1/2 top-0 -ml-[11px] z-10">
              <svg width="22" height="26" viewBox="0 0 22 26">
                <polygon
                  points="11,26 1,1 21,1"
                  fill={color}
                  stroke="#0b1220"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-center px-4">
            <p className="text-xs text-slate-500">Every player from this bowl is drawn</p>
          </div>
        )}
      </div>

      <Button
        onClick={spin}
        disabled={!active || busy || spinning || !count}
        className="mt-3 w-full font-bold"
        style={active && !busy && !spinning && count ? { backgroundColor: color, color: '#04120c' } : undefined}
      >
        {spinning || busy ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <RotateCw className="w-4 h-4 mr-2" />
        )}
        {spinning ? 'Spinning…' : busy ? 'Saving…' : 'Spin'}
      </Button>
      {hint && <p className="mt-1.5 text-[10px] text-slate-500 text-center">{hint}</p>}
    </div>
  );
}