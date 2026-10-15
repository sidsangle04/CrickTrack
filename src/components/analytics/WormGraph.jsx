import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function WormGraph({ innings, deliveries, teamsMap, maxOvers }) {
  const { data, series } = useMemo(() => {
    const regular = (innings || [])
      .filter(i => !i.is_super_over)
      .sort((a, b) => a.innings_number - b.innings_number);

    const series = regular.map((inn, idx) => {
      const team = teamsMap[inn.batting_team_id];
      const color = team?.primary_color || (idx === 0 ? '#38bdf8' : '#f59e0b');
      const key = `t${inn.batting_team_id}`;
      const dels = (deliveries || [])
        .filter(d => d.innings_id === inn.id && !d.is_voided)
        .sort((a, b) =>
          a.over_number !== b.over_number
            ? a.over_number - b.over_number
            : (a.ball_in_over || 0) - (b.ball_in_over || 0)
        );

      let cum = 0, legal = 0, wk = 0;
      const points = [{ over: 0, runs: 0, wicketRuns: null }];
      dels.forEach(d => {
        cum += d.runs_total || 0;
        if (d.is_legal_delivery !== false) legal++;
        if (d.is_wicket) wk++;
        points.push({
          over: +(legal / 6).toFixed(2),
          runs: cum,
          wicketRuns: d.is_wicket ? cum : null,
          wkNum: d.is_wicket ? wk : null,
        });
      });

      return {
        key,
        color,
        name: team?.short_name || team?.name || `Team ${idx + 1}`,
        points,
        finalRuns: cum,
        finalWk: wk,
        finalOver: legal / 6,
      };
    });

    const overSet = new Set([0]);
    series.forEach(s => s.points.forEach(p => overSet.add(p.over)));
    const overs = [...overSet].sort((a, b) => a - b);

    const data = overs.map(o => {
      const entry = { over: o };
      series.forEach(s => {
        const p = s.points.find(pp => pp.over === o);
        entry[s.key] = p ? p.runs : null;
        entry[`${s.key}_w`] = p && p.wicketRuns != null ? p.wicketRuns : null;
        entry[`${s.key}_wk`] = p && p.wkNum != null ? p.wkNum : null;
      });
      return entry;
    });

    return { data, series };
  }, [innings, deliveries, teamsMap]);

  if (series.length === 0 || data.length <= 1) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">
        No worm graph data yet
      </div>
    );
  }

  const ovStr = (o) => `${Math.floor(o)}.${Math.round((o % 1) * 6)}`;

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/50">
      <h3 className="font-semibold text-white mb-1">Worm Graph</h3>
      <p className="text-xs text-slate-500 mb-3">Cumulative runs by over — both teams compared; dots mark wickets fallen</p>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 14, left: -14, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" />
            <XAxis
              dataKey="over"
              type="number"
              domain={[0, maxOvers ?? 'dataMax']}
              tick={{ fill: '#6C757D' }}
              stroke="#CED4DA"
              fontSize={11}
              label={{ value: 'Overs', position: 'insideBottom', offset: -2, fill: '#6C757D', fontSize: 11 }}
            />
            <YAxis
              tick={{ fill: '#6C757D' }}
              stroke="#CED4DA"
              fontSize={11}
              label={{ value: 'Runs', angle: -90, position: 'insideLeft', fill: '#6C757D', fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const rows = series
                  .map(s => {
                    const entry = payload.find(p => p.dataKey === s.key);
                    if (!entry || entry.value == null) return null;
                    const wEntry = payload.find(p => p.dataKey === `${s.key}_wk`);
                    const wkNum = wEntry && wEntry.value != null ? wEntry.value : null;
                    return (
                      <div key={s.key} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                        <span style={{ color: s.color }} className="font-medium">{s.name}</span>
                        <span className="text-slate-300">: {entry.value}{wkNum != null ? `/${wkNum}` : ''}</span>
                      </div>
                    );
                  })
                  .filter(Boolean);
                if (!rows.length) return null;
                return (
                  <div style={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: 8, color: '#212529', padding: '8px 10px' }}>
                    <div style={{ fontSize: 11, color: '#6C757D', marginBottom: 4 }}>Over {ovStr(Number(label))}</div>
                    {rows}
                  </div>
                );
              }}
            />
            {series.map(s => (
              <Line key={s.key} type="monotone" dataKey={s.key} name={s.name}
                stroke={s.color} strokeWidth={2.5} dot={false} connectNulls />
            ))}
            {series.map(s => (
              <Line key={`${s.key}_w`} type="monotone" dataKey={`${s.key}_w`}
                stroke="none" connectNulls={false} legendType="none"
                dot={{ r: 4, fill: s.color, stroke: '#FFFFFF', strokeWidth: 1 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {series.map(s => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
            <span className="text-white font-medium">{s.name}</span>
            <span className="text-slate-400">
              {s.finalRuns}/{s.finalWk} ({ovStr(s.finalOver)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}