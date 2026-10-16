import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Subtle scroll-in entrance. Fades and lifts its children once, the first
 * time they come into view. Falls back to a plain, static element when the
 * visitor has asked for reduced motion.
 */
export default function Reveal({ children, delay = 0, y = 22, className }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}