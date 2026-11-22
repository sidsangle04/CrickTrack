import React, { useState } from 'react';
import { Loader2, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Panel, TeamBadge, contrastText } from '../Shared';
import TeamFormModal from './TeamFormModal';

export default function TeamsPanel({ auction, teams, players, tournament, refresh }) {
  const [modal, setModal] = useState({ open: false, team: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const addFromTournament = async () => {
    if (!tournament?.team_ids?.length) return;
    setBusy(true);
    setError('');
    try {
      const all = await base44.entities.Team.list();
      const existing = new Set(teams.map((t) => t.name.trim().toLowerCase()));
      const missing = all.filter(
        (t) => tournament.team_ids.includes(t.id) && !existing.has((t.name || '').trim().toLowerCase())
      );
      if (!missing.length) {
        setError('Every team from this tournament is already in the auction.');
        return;
      }
      await base44.entities.AuctionTeam.bulkCreate(
        missing.map((t, i) => ({
          tournament_id: auction.tournament_id,
          team_id: t.id,
          name: t.name,
          logo_url: t.logo_url || '',
          color: t.primary_color || '#10b981',
          owner_name: '',
          order_index: teams.length + i
        }))
      );
      refresh && refresh();
    } finally {
      setBusy(false);
    }
  };

  const removeTeam = async (team) => {
    if (players.some((p) => p.sold_to_team_id === team.id)) {
      setError(`${team.name} already has players, so it cannot be removed.`);
      return;
    }
    if (!window.confirm(`Remove ${team.name} from the auction?`)) return;
    await base44.entities.AuctionTeam.delete(team.id);
    refresh && refresh();
  };

  return (
    <Panel
      title={`Teams (${teams.length})`}
      action={
        <div className="flex items-center gap-2">
          {!!tournament?.team_ids?.length && (
            <Button
              variant="outline"
              size="sm"
              onClick={addFromTournament}
              disabled={busy}
              className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Users className="w-3.5 h-3.5 mr-1.5" />}
              From tournament
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setModal({ open: true, team: null })}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add team
          </Button>
        </div>
      }
    >
      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {teams.length === 0 ? (
        <p className="text-sm text-slate-400">
          Add the teams taking part. A name and a colour are required, the logo and owner are optional.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3 flex items-center gap-3"
              style={{ borderLeft: `4px solid ${team.color || '#10b981'}` }}
            >
              <TeamBadge team={team} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {team.owner_name || 'No owner set'}
                </p>
                <span
                  className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: team.color, color: contrastText(team.color) }}
                >
                  {team.color}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => setModal({ open: true, team })}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Edit team"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => removeTeam(team)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                  title="Remove team"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TeamFormModal
        open={modal.open}
        onOpenChange={(open) => setModal({ open, team: open ? modal.team : null })}
        team={modal.team}
        tournamentId={auction.tournament_id}
        orderIndex={teams.length}
        onSaved={refresh}
      />
    </Panel>
  );
}