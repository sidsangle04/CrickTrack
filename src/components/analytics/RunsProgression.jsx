import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

function ovStr(ball) {
  return `${Math.floor(ball / 6)}.${ball % 6}`;
}

export default function RunsProgression({ deliveries, maxOvers }) {
  const { data } = useMemo(() => {
    const sorted = [...deliveries]
      .filter(d => !d.is_voided)
      .sort((a, b) => {
        if (a.over_number !== b.over_number) return a.over_number - b.over_number;
        return (a.ball_in_over ?? 0) - (b.ball_in_over ?? 0);
      });

    let cum = 0;
    let legal = 0;
    let wk = 0;
    const pts = [{ over: 0, runs: 0, wicketRuns: null, wicketLabel: null }];

    sorted.forEach(d => {
      const isLegal = d.is_legal_delivery !== false;
      cum += d.runs_total || 0;
      if (isLegal) legal++;
      if (d.is_wicket) {
        wk++;
        pts.push({
          over: +(legal / 6).toFixed(2),
          runs: cum,
          wicketRuns: cum,
          wicketLabel: `W${wk}`,
        });
      } else {
        pts.push({ over: +(legal / 6).toFixed(2), runs: cum, wicketRuns: null, wicketLabel: null });
      }
    });

    return { data: pts };
  }, [deliveries]);

  if (data.length <= 1) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">
        No runs progression data
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-700/50">
      <h3 className="font-semibold text-white mb-1">Runs Progression</h3>
      <p className="text-xs text-slate-500 mb-3">Cumulative runs by over — dots mark wickets fallen</p>
      <div style={{ width: '100%', height: 260 }}>
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
              formatter={(v) => [v, 'Runs']}
              labelFormatter={(l) => `Over ${ovStr(Math.round(l * 6))}`}
              contentStyle={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: 8, color: '#212529' }}
            />
            <Line type="monotone" dataKey="runs" stroke="#008C45" strokeWidth={2.5} dot={false} name="Runs" />
            <Line
              type="monotone"
              dataKey="wicketRuns"
              stroke="none"
              dot={{ r: 5, fill: '#d33a2a', stroke: '#fff', strokeWidth: 1 }}
              connectNulls={false}
              name="Wickets"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}