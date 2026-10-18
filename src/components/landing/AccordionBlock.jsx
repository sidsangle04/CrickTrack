import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * Compact inline disclosure list. Each row is a real button with
 * aria-expanded, so it works from the keyboard, and the open/close
 * transition is skipped when the visitor prefers reduced motion.
 */
export default function AccordionBlock({ items, className = '' }) {
  const [openKey, setOpenKey] = useState(null);
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={`divide-y divide-slate-700/50 overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/40 ${className}`}>
      {items.map(({ key, title, text, Icon }) => {
        const isOpen = openKey === key;
        return (
          <div key={key}>
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-800/60">
              {Icon && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <Icon className="h-4 w-4 text-emerald-400" />
                </span>
              )}
              <span className="flex-1 text-sm font-semibold text-white">{title}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-emerald-400 transition-transform duration-200 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                  className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{text}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}