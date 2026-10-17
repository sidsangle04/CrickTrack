import React from 'react';

export default function PhotoRollCard({ label, caption, photo, Panel }) {
  return (
    <article className="w-[268px] shrink-0 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 sm:w-[320px]">
      <div className="relative h-[248px] bg-slate-900/60 sm:h-[286px]">
        {photo ? (
          <img
            src={photo}
            alt={caption}
            loading="lazy"
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <Panel />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur">
          {label}
        </span>
      </div>
      <p className="px-4 py-3 text-sm leading-relaxed text-slate-300">{caption}</p>
    </article>
  );
}