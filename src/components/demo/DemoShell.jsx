import React from 'react';
import DemoBanner from './DemoBanner';

/** Page frame shared by every demo section: title, demo notice, then content. */
export default function DemoShell({ title, subtitle, action = null, children }) {
  return (
    <div className="pb-24 md:pb-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
        </div>
        {action}
      </div>
      <DemoBanner />
      {children}
    </div>
  );
}