import React from 'react';

// Short chapter list, so the page can be long on paper but quick to move around.
const CHAPTERS = [
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'insight', label: 'Insight' },
  { id: 'community', label: 'Community' },
];

export default function LandingNav() {
  const jump = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="Jump to a section" className="mt-8 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Jump to
      </span>
      {CHAPTERS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => jump(id)}
          className="rounded-full border border-slate-700 bg-slate-800/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 transition-colors hover:border-emerald-500/40 hover:text-white">
          {label}
        </button>
      ))}
    </nav>
  );
}