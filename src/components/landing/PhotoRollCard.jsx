import React from 'react';

export default function PhotoRollCard({ label, caption, photo, Panel, contain }) {
  return (
    <article className="w-[268px] shrink-0 overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 sm:w-[320px]">
      <div
        className={`relative h-[248px] sm:h-[286px] ${contain ? 'bg-slate-950' : 'bg-slate-900/60'}`}>
        {photo ? (
          <img
            src={photo}
            alt={caption}
            loading="lazy"
            draggable={false}
            className={`h-full w-full ${contain ? 'object-contain' : 'object-cover'}`}
          />
        ) : (
          <Panel />
        )}
        {!contain && (
          <span className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur">
            {label}
          </span>
        )}
      </div>
      <div className="px-4 py-3">
        {contain && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            {label}
          </span>
        )}
        <p className={`text-sm leading-relaxed text-slate-300 ${contain ? 'mt-1' : ''}`}>{caption}</p>
      </div>
    </article>
  );
}