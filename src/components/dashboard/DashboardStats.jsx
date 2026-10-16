import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useGroundShape } from '@/lib/GroundShapeContext';
import { Calendar, Trophy, UserRound, Users } from 'lucide-react';

export default function DashboardStats() {
  const { mode, isReady } = useGroundShape();

  const { data: counts, isLoading } = useQuery({
    queryKey: ['dashboard-counts', mode],
    queryFn: async () => {
      const [matches, teams, players, tournaments] = await Promise.all([
        base44.entities.Match.count({ ground_mode: mode }),
        base44.entities.Team.count({ ground_mode: mode }),
        base44.entities.Player.count({ ground_mode: mode }),
        base44.entities.Tournament.count({ ground_mode: mode }),
      ]);
      return { matches, teams, players, tournaments };
    },
    enabled: isReady,
  });

  if (!isReady) return null;

  const items = [
    { Icon: Calendar, label: 'Matches', value: counts?.matches },
    { Icon: Trophy, label: 'Teams', value: counts?.teams },
    { Icon: UserRound, label: 'Players', value: counts?.players },
    { Icon: Users, label: 'Tournaments', value: counts?.tournaments },
  ];

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        Your cricket
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
            <Icon className="h-4 w-4 text-emerald-400" />
            <p className="mt-3 text-2xl font-bold text-white">
              {isLoading ? '—' : value ?? 0}
            </p>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-slate-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}