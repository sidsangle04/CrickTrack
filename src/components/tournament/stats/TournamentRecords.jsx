import React from 'react';
import {
  Award, TrendingDown, Trophy, Gauge, Flame, Zap, Crosshair, Target, Users, Crown, Medal,
} from 'lucide-react';

const CONFIG = [
  { key: 'highest_team_total', label: 'Highest team total', icon: Award, accent: 'text-emerald-400' },
  { key: 'lowest_team_total', label: 'Lowest team total', icon: TrendingDown, accent: 'text-sky-400' },
  { key: 'highest_individual', label: 'Highest individual score', icon: Trophy, accent: 'text-amber-400' },
  { key: 'fastest_innings', label: 'Fastest innings', icon: Gauge, accent: 'text-cyan-400' },
  { key: 'most_sixes_innings', label: 'Most sixes in an innings', icon: Flame, accent: 'text-amber-400' },
  { key: 'most_fours_innings', label: 'Most fours in an innings', icon: Zap, accent: 'text-cyan-400' },
  { key: 'best_bowling', label: 'Best bowling figures', icon: Crosshair, accent: 'text-rose-400' },
  { key: 'most_wickets_match', label: 'Most wickets in a match', icon: Target, accent: 'text-rose-400' },
  { key: 'highest_partnership', label: 'Highest partnership', icon: Users, accent: 'text-violet-400' },
  { key: 'most_runs', label: 'Most runs in the tournament', icon: Crown, accent: 'text-emerald-400' },
  { key: 'most_wickets', label: 'Most wickets in the tournament', icon: Medal, accent: 'text-amber-400' },
];

export default function TournamentRecords({ records, onSelectPlayer, onOpenMatch }) {
  const filled = CONFIG.filter((c) => records[c.key]);

  if (!filled.length) {
    return (
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 py-12 text-center">
        <Award className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Records appear once a match in this tournament is complete.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filled.map(({ key, label, icon: Icon, accent }) => {
        const r = records[key];
        return (
          <div
            key={key}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 shrink-0 ${accent}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </span>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums leading-tight">{r.value}</div>
            <div className="text-sm text-slate-200 truncate">
              {r.player_id ? (
                <button
                  onClick={() => onSelectPlayer(r.player_id)}
                  className="hover:text-emerald-400 hover:underline truncate"
                >
                  {r.name}
                </button>
              ) : (
                <span className="truncate">{r.name}</span>
              )}
              {r.sub && <span className="text-slate-500 text-xs"> · {r.sub}</span>}
            </div>
            {r.match && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-auto pt-1">
                <span className="truncate">{r.match}</span>
                {r.match_id && (
                  <button
                    onClick={() => onOpenMatch(r.match_id)}
                    className="text-emerald-400 hover:text-emerald-300 shrink-0"
                  >
                    view
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}