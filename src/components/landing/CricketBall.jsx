import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Decorative cricket ball that drifts across the hero as a gentle accent.
 * Purely presentational: it never overlaps copy and is hidden from screen
 * readers. Motion is reduced to a static ball when the visitor prefers it.
 */
export default function CricketBall({ className = '' }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 ${className}`}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={
        reduceMotion
          ? { opacity: 0.85, scale: 1 }
          : {
              opacity: [0, 0.9, 0.9, 0],
              scale: [0.7, 1, 1, 0.85],
              x: [0, 120, 260, 370],
              y: [0, -16, 8, -6],
              rotate: [0, 240, 480, 720],
            }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              duration: 12,
              times: [0, 0.12, 0.85, 1],
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: 4,
            }
      }
    >
      <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-[0_6px_16px_rgba(0,0,0,0.55)]">
        <defs>
          <radialGradient id="cricktrack-ball" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="45%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#cricktrack-ball)" />
        <ellipse
          cx="20"
          cy="20"
          rx="6.4"
          ry="18.6"
          fill="none"
          stroke="#f8fafc"
          strokeWidth="1.3"
          strokeDasharray="2.4 2.2"
          opacity="0.92"
        />
        <ellipse cx="14" cy="13" rx="4.6" ry="3.2" fill="#ffffff" opacity="0.16" transform="rotate(-28 14 13)" />
      </svg>
    </motion.div>
  );
}