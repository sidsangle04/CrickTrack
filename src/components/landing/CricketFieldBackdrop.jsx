import React from 'react';
import { useReducedMotion } from 'framer-motion';

const MOW_RINGS = [0.22, 0.38, 0.54, 0.7, 0.86];

/**
 * Animated cricket ground behind the hero: floodlit outfield, mown rings,
 * a slow zoom, a chasing boundary rope, a drifting 30-yard circle and a ball
 * struck out towards the boundary. Decorative only, and held still for
 * visitors who prefer reduced motion.
 */
export default function CricketFieldBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 overflow-hidden bg-slate-950" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-10%,rgba(16,185,129,0.32),rgba(2,6,23,0)_62%)]" />

      <svg
        viewBox="0 0 1200 720"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {!reduceMotion && (
          <style>{`
            .cf-drift { animation: cf-drift 30s ease-in-out infinite; transform-origin: 600px 380px; }
            @keyframes cf-drift { 0%, 100% { transform: scale(1.04); } 50% { transform: scale(1.11); } }
            .cf-spin { animation: cf-spin 130s linear infinite; transform-origin: 600px 380px; }
            @keyframes cf-spin { to { transform: rotate(360deg); } }
            .cf-rope { animation: cf-rope 9s linear infinite; }
            @keyframes cf-rope { to { stroke-dashoffset: -260; } }
            .cf-ball { animation: cf-ball 7s ease-in-out infinite; }
            @keyframes cf-ball {
              0%   { transform: translate(0px, 0px) scale(0.7); opacity: 0; }
              8%   { opacity: 1; }
              55%  { transform: translate(215px, -140px) scale(1); opacity: 1; }
              88%  { transform: translate(350px, -202px) scale(0.9); opacity: 0.85; }
              100% { transform: translate(382px, -216px) scale(0.7); opacity: 0; }
            }
          `}</style>
        )}

        <defs>
          <radialGradient id="cf-outfield" cx="50%" cy="45%" r="62%">
            <stop offset="0%" stopColor="#1f8a5b" />
            <stop offset="55%" stopColor="#156a46" />
            <stop offset="100%" stopColor="#0a3a29" />
          </radialGradient>
          <linearGradient id="cf-pitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a978" />
            <stop offset="50%" stopColor="#d8bb8e" />
            <stop offset="100%" stopColor="#a8865a" />
          </linearGradient>
          <radialGradient id="cf-rope" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="rgba(226,255,240,0)" />
            <stop offset="100%" stopColor="rgba(226,255,240,0.85)" />
          </radialGradient>
        </defs>

        <g className={reduceMotion ? undefined : 'cf-drift'}>
          {/* boundary glow */}
          <ellipse cx="600" cy="380" rx="524" ry="332" fill="none" stroke="url(#cf-rope)" strokeWidth="10" opacity="0.35" />

          {/* outfield */}
          <ellipse cx="600" cy="380" rx="512" ry="322" fill="url(#cf-outfield)" />

          {/* mown rings */}
          {MOW_RINGS.map((k, i) => (
            <ellipse
              key={k}
              cx="600"
              cy="380"
              rx={512 * k}
              ry={322 * k}
              fill={i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.045)'}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}

          {/* chasing boundary rope */}
          <ellipse
            className={reduceMotion ? undefined : 'cf-rope'}
            cx="600"
            cy="380"
            rx="512"
            ry="322"
            fill="none"
            stroke="rgba(209,250,229,0.55)"
            strokeWidth="2"
            strokeDasharray="18 26"
          />

          {/* 30-yard circle */}
          <ellipse
            className={reduceMotion ? undefined : 'cf-spin'}
            cx="600"
            cy="380"
            rx="298"
            ry="188"
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth="1.5"
            strokeDasharray="10 12"
          />

          {/* pitch and creases */}
          <rect x="586" y="300" width="28" height="160" rx="2" fill="url(#cf-pitch)" />
          <rect x="586" y="300" width="28" height="160" rx="2" fill="none" stroke="rgba(255,255,255,0.18)" />
          {[312, 448].map((y) => (
            <line key={y} x1="586" y1={y} x2="614" y2={y} stroke="rgba(255,255,255,0.65)" strokeWidth="1.5" />
          ))}
          {[300, 452].map((y) => (
            <g key={y}>
              {[594, 600, 606].map((x) => (
                <circle key={x} cx={x} cy={y} r="1.8" fill="rgba(255,255,255,0.85)" />
              ))}
            </g>
          ))}

          {/* the ball, struck out to the leg side */}
          <g className={reduceMotion ? undefined : 'cf-ball'}>
            <circle cx="600" cy="452" r="16" fill="rgba(255,255,255,0.16)" />
            <circle cx="600" cy="452" r="6" fill="#ffffff" />
          </g>
        </g>
      </svg>

      {/* legibility washes for the headline */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-slate-950/45" />
    </div>
  );
}