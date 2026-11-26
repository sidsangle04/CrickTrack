import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronRight, Pencil, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamBadge } from '@/components/auction/Shared';
import TeamSquadDialog from './TeamSquadDialog';
import TeamEditDialog from './TeamEditDialog';

// Every team in the tournament — tap one to see its players, or edit its name,
// colour and logo.
export default function TournamentTeams({ tournament, teams, onAddTeam, onTeamUpdated }) {
  const [openTeam, setOpenTeam] = useState(null);
  const [editTeam, setEditTeam] = useState(null);

  const { data: players = [] } = useQuery({
    queryKey: ['players', tournament.ground_mode || 'turf'],
    queryFn: () => base44.entities.Player.list()
  });

  const counts = useMemo(
    () =>
      players
        .filter((p) => (p.ground_mode || 'turf') === (tournament.ground_mode || 'turf'))
        .reduce((a, p) => {
          a[p.team_id] = (a[p.team_id] || 0) + 1;
          return a;
        }, {}),
    [players, tournament.ground_mode]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
          Teams · {teams.length}
        </h2>
        <Button
          onClick={onAddTeam}
          size="sm"
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-slate-800/40 border border-slate-700/60">
          <Users className="w-7 h-7 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No teams in this tournament yet — add one to get started.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center gap-1 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/50 transition-colors"
            >
              <button
                onClick={() => setOpenTeam(team)}
                className="flex items-center gap-3 text-left min-w-0 flex-1"
              >
                <TeamBadge
                  team={{ name: team.name, color: team.primary_color, logo_url: team.logo_url }}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {counts[team.id] || 0} players
                  </p>
                </div>
              </button>
              <button
                onClick={() => setEditTeam(team)}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
                title="Edit team name, colour or logo"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {openTeam && (
        <TeamSquadDialog
          team={openTeam}
          tournament={tournament}
          open={!!openTeam}
          onOpenChange={(v) => !v && setOpenTeam(null)}
        />
      )}

      <TeamEditDialog
        team={editTeam}
        open={!!editTeam}
        onOpenChange={(v) => !v && setEditTeam(null)}
        onSaved={onTeamUpdated}
      />
    </div>
  );
}