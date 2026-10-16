import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * A faint field-line highlight that sweeps gently across the hero image,
 * rests, then repeats. Decorative only, and removed entirely for visitors
 * who prefer reduced motion.
 */
export default function FieldSweep() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <motion.div
        className="absolute bottom-[-40%] top-[-40%] w-[28%] -skew-x-12"
        initial={{ x: '-170%' }}
        animate={{ x: ['-170%', '480%'] }}
        transition={{ duration: 5.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.5 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-md" />
        <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-gradient-to-b from-transparent via-emerald-200/45 to-transparent blur-[2px]" />
      </motion.div>
    </div>
  );
}