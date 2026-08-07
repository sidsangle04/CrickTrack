import React, { useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Scatter, ReferenceLine
} from 'recharts';

function overStr(ball) {
  return `${Math.floor(ball / 6)}.${ball % 6}`;
}

function CustomTooltip({ active, payload, label, wickets }) {
  if (!active || !payload?.length) return null;
  const cumRuns = payload.find(p => p.dataKey === 'cumRuns')?.value;
  const runRate = payload.find(p => p.dataKey === 'runRate')?.value;
  const w = wickets?.find(wk => wk.ball === label);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs">
      <div className="text-slate-400 mb-1">Over {overStr(label)}</div>
      <div className="text-emerald-400">Runs: {cumRuns ?? 0}</div>
      <div className="text-amber-400">Run Rate: {runRate ?? 0}</div>
      {w && (
        <div className="text-red-400 mt-1 pt-1 border-t border-slate-700">
          W{w.wicketNumber} — {w.type} ({w.playerOut || 'out'})
        </div>
      )}
    </div>
  );
}

export default function PartnershipTimeline({ deliveries, partnerships, playersMap }) {
  const { chartData, wickets, pships, totalBalls } = useMemo(() => {
    const sorted = [...deliveries]
      .filter(d => !d.is_voided)
      .sort((a, b) => {
        if (a.over_number !== b.over_number) return a.over_number - b.over_number;
        return (a.ball_in_over ?? 0) - (b.ball_in_over ?? 0);
      });

    let cumRuns = 0;
    let legalBalls = 0;
    let wicketCount = 0;
    const data = [{ ball: 0, over: '0.0', cumRuns: 0, runRate: 0 }];
    const wicks = [];

    sorted.forEach(d => {
      const isLegal = d.is_legal_delivery !== false;
      cumRuns += d.runs_total || 0;
      if (isLegal) legalBalls++;
      if (d.is_wicket) {
        wicketCount++;
        wicks.push({
          ball: legalBalls,
          cumRuns,
          wicketNumber: wicketCount,
          type: d.wicket_type,
          playerOut: playersMap[d.player_out_id]?.name,
        });
      }
      data.push({
        ball: legalBalls,
        over: overStr(legalBalls),
        cumRuns,
        runRate: legalBalls > 0 ? +((cumRuns / legalBalls) * 100).toFixed(1) : 0,
      });
    });

    const p = [...partnerships].sort((a, b) => a.wicket_number - b.wicket_number);
    return { chartData: data, wickets: wicks, pships: p, totalBalls: legalBalls };
  }, [deliveries, partnerships, playersMap]);

  if (chartData.length <= 1) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center text-slate-500 text-sm">
        No partnership timeline data
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="font-semibold text-white mb-1">Partnership Timeline</h3>
      <p className="text-xs text-slate-500 mb-3">
        Cumulative runs & run rate across the innings — dashed lines mark wickets (partnership ends)
      </p>

      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="ball" tickFormatter={overStr} stroke="#475569" fontSize={11} tick={{ fill: '#94a3b8' }} />
            <YAxis yAxisId="left" stroke="#10b981" fontSize={11} tick={{ fill: '#94a3b8' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tick={{ fill: '#94a3b8' }} />
            <Tooltip content={<CustomTooltip wickets={wickets} />} />
            {wickets.map(w => (
              <ReferenceLine
                key={w.wicketNumber}
                x={w.ball}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.45}
                label={{ value: `W${w.wicketNumber}`, fill: '#ef4444', fontSize: 10, position: 'top' }}
              />
            ))}
            <Area
              yAxisId="left"
              type="stepAfter"
              dataKey="cumRuns"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.15}
              strokeWidth={2}
              name="Runs"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="runRate"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Run Rate"
            />
            <Scatter yAxisId="left" data={wickets} dataKey="cumRuns" fill="#ef4444" name="Wickets" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 justify-center mt-2 mb-3 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Cumulative Runs</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Run Rate</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Wickets</span>
      </div>

      <div className="space-y-1.5">
        {pships.map((p, i) => {
          const endBall = wickets[i]?.ball ?? totalBalls;
          const startBall = i === 0 ? 0 : (wickets[i - 1]?.ball ?? 0);
          const b1 = playersMap[p.batter1_id]?.name || '?';
          const b2 = playersMap[p.batter2_id]?.name || '?';
          return (
            <div key={p.id} className="flex items-center text-xs bg-slate-900/40 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-500 w-6 text-center">W{p.wicket_number}</span>
              <span className="text-slate-300 flex-1 truncate ml-2">{b1} & {b2}</span>
              <span className="text-slate-500 mx-2">{overStr(startBall)}–{overStr(endBall)}</span>
              <span className="text-emerald-400 font-semibold">{p.runs || 0}</span>
              <span className="text-slate-500 ml-1">({p.balls || 0})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}