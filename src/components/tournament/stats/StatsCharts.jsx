import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, LineChart, Line,
} from 'recharts';

const AXIS = { fontSize: 10, fill: '#94a3b8' };
const TOOLTIP = {
  contentStyle: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    fontSize: 11,
  },
  labelStyle: { color: '#e2e8f0' },
};

export const ChartCard = ({ title, hint, children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 ${className}`}>
    <div className="flex items-baseline justify-between gap-2 mb-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">{title}</h3>
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </div>
    {children}
  </div>
);

const Empty = () => <div className="h-40 flex items-center justify-center text-xs text-slate-500">Not enough data yet</div>;

export function RunsByTeamChart({ data = [] }) {
  if (!data.length) return <Empty />;
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP} cursor={{ fill: '#1e293b66' }} />
          <Bar dataKey="runs" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color || '#10b981'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopPlayersChart({ data = [], dataKey, color, unit }) {
  if (!data.length) return <Empty />;
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={104}
            tick={AXIS}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...TOOLTIP} cursor={{ fill: '#1e293b66' }} formatter={(v) => [`${v} ${unit}`, '']} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WinsPieChart({ data = [] }) {
  const rows = data.filter((d) => d.wins > 0);
  if (!rows.length) return <Empty />;
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="wins"
            nameKey="name"
            innerRadius={42}
            outerRadius={70}
            paddingAngle={2}
            stroke="#0f172a"
          >
            {rows.map((d, i) => <Cell key={i} fill={d.color || '#10b981'} />)}
          </Pie>
          <Tooltip {...TOOLTIP} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {rows.map((d, i) => (
          <span key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color || '#10b981' }} />
            {d.name} {d.wins}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BoundariesChart({ data = [] }) {
  const rows = data.filter((d) => d.fours > 0 || d.sixes > 0);
  if (!rows.length) return <Empty />;
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP} cursor={{ fill: '#1e293b66' }} />
          <Bar dataKey="fours" fill="#06b6d4" radius={[3, 3, 0, 0]} barSize={12} />
          <Bar dataKey="sixes" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RunsPerMatchChart({ data = [] }) {
  if (!data.length) return <Empty />;
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} />
          <Tooltip {...TOOLTIP} formatter={(v, _n, p) => [`${v} runs`, p.payload.label]} />
          <Line type="monotone" dataKey="runs" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Per-player mini chart used on the player performance card.
export function PlayerFormChart({ data = [] }) {
  if (!data.length) return <Empty />;
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP} cursor={{ fill: '#1e293b66' }} />
          <Bar dataKey="runs" fill="#10b981" radius={[3, 3, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlayerWicketsChart({ data = [] }) {
  if (!data.length) return <Empty />;
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval={0} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip {...TOOLTIP} cursor={{ fill: '#1e293b66' }} />
          <Bar dataKey="wickets" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}