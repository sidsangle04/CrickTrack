import React from 'react';

// Small stat/insight cards shared by Analytics and Player Profiles.
export function StatCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}

export function InsightCard({ icon: Icon, title, value, color }) {
  return (
    <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xs text-slate-400">{title}</div>
        <div className="text-sm font-semibold text-white">{value || '—'}</div>
      </div>
    </div>
  );
}