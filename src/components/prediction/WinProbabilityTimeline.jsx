import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

// How the match swung: team 1's win chance ball by ball, across all innings.
export default function WinProbabilityTimeline({ innings = [], deliveries = [], teamsMap = {}, team1Id, team2Id }) {
  const team1Name = teamsMap[team1Id]?.name || 'Team 1';
  const team2Name = teamsMap[team2Id]?.name || 'Team 2';

  const inningsById = innings.reduce((acc, i) => ({ ...acc, [i.id]: i }), {});

  const data = deliveries
    .filter((d) => !d.is_voided && typeof d.batting_win_prob === 'number')
    .map((d, idx) => {
      const inn = inningsById[d.innings_id];
      const team1Batting = inn?.batting_team_id === team1Id;
      return {
        ball: idx + 1,
        chance: Math.round(team1Batting ? d.batting_win_prob : 100 - d.batting_win_prob)
      };
    });

  if (data.length < 2) return null;

  return (
    <div className="mb-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
      <h2 className="text-lg font-bold text-white">Win Probability</h2>
      <p className="mb-4 text-xs text-slate-400">
        {team1Name} vs {team2Name} — how the match swung
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" />
          <XAxis dataKey="ball" tick={{ fill: '#6C757D', fontSize: 11 }} />
          <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#6C757D', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#FFFFFF', border: '1px solid #DEE2E6', borderRadius: 12 }}
            labelStyle={{ color: '#6C757D' }}
            labelFormatter={(v) => `Ball ${v}`}
            formatter={(v) => [`${v}%`, team1Name]}
          />
          <ReferenceLine y={50} stroke="#CED4DA" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="chance" stroke="#008C45" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}