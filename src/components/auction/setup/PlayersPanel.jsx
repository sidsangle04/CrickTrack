import React, { useMemo, useState } from 'react';
import { Eye, Loader2, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategoryBadge, Panel, PlayerAvatar } from '../Shared';
import PlayerFormModal from './PlayerFormModal';
import PlayerProfileDialog from './PlayerProfileDialog';

const ROLE_LABELS = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  all_rounder: 'All-rounder',
  wicket_keeper: 'Wicket keeper'
};

const STATUS_STYLES = {
  available: 'bg-slate-500/20 text-slate-300',
  sold: 'bg-emerald-500/20 text-emerald-300',
  unsold: 'bg-red-500/20 text-red-300'
};

export default function PlayersPanel({ auction, players, teams, tournament, refresh }) {
  const [modal, setModal] = useState({ open: false, player: null });
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const teamName = (id) => teams.find((t) => t.id === id)?.name || '';

  // Brings everyone from the Players section into this auction, skipping anyone
  // already in the pool by name.
  const importFromPlayers = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const query = tournament?.ground_mode ? { ground_mode: tournament.ground_mode } : {};
      const roster = await base44.entities.Player.filter(query, 'name', 2000);
      const known = new Set(players.map((p) => (p.name || '').trim().toLowerCase()));
      const picks = [];
      roster.forEach((p) => {
        const name = (p.name || '').trim();
        const key = name.toLowerCase();
        if (!key || known.has(key)) return;
        known.add(key);
        picks.push({
          tournament_id: auction.tournament_id,
          name,
          photo_url: p.photo_url || '',
          primary_role: p.role,
          batting_style: p.batting_style,
          bowling_style: p.bowling_style,
          category: 'gold',
          status: 'available',
          bowl: 'none'
        });
      });
      if (!picks.length) {
        setNotice(
          roster.length
            ? 'Everyone from your Players section is already in the pool.'
            : 'No players found in your Players section yet.'
        );
        return;
      }
      await base44.entities.AuctionPlayer.bulkCreate(picks);
      setNotice(`Added ${picks.length} player${picks.length === 1 ? '' : 's'} from your Players section.`);
      refresh && refresh();
    } catch (e) {
      setError(e?.message || 'Could not bring the players across.');
    } finally {
      setBusy(false);
    }
  };

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, search]);

  const remove = async (player) => {
    if (player.sold_to_team_id) {
      setError(`${player.name} is already with a team, so cannot be removed.`);
      return;
    }
    if (!window.confirm(`Remove ${player.name} from the player pool?`)) return;
    await base44.entities.AuctionPlayer.delete(player.id);
    refresh && refresh();
  };

  return (
    <Panel
      title={`Players (${players.length})`}
      action={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={importFromPlayers}
            disabled={busy}
            className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            title="Bring every player from your Players section into the auction"
          >
            {busy ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Users className="w-3.5 h-3.5 mr-1.5" />
            )}
            From players
          </Button>
          <Button
            size="sm"
            onClick={() => setModal({ open: true, player: null })}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add player
          </Button>
        </div>
      }
    >
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players"
          className="pl-9 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
      {notice && <p className="text-xs text-emerald-400 mb-3">{notice}</p>}

      {list.length === 0 ? (
        <p className="text-sm text-slate-400">
          Add players with just a name. Photo, signature, age, styles, role, experience and category are
          all optional.
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/60"
            >
              <PlayerAvatar player={player} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                  <CategoryBadge category={player.category} />
                  {player.bowl !== 'none' && player.bowl && (
                    <span className="text-[10px] uppercase tracking-wide text-slate-400">
                      {player.bowl === 'bowl1' ? 'Bowl 1' : 'Bowl 2'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {[ROLE_LABELS[player.primary_role], player.age ? `${player.age} yrs` : '']
                    .filter(Boolean)
                    .join(' · ') || 'No extra details'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                    STATUS_STYLES[player.status] || STATUS_STYLES.available
                  }`}
                >
                  {player.status || 'available'}
                </span>
                {player.sold_to_team_id && (
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[110px]">
                    {teamName(player.sold_to_team_id)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => setProfile(player)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  title="View player profile"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setModal({ open: true, player })}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Edit player"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(player)}
                  className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                  title="Remove player"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlayerFormModal
        open={modal.open}
        onOpenChange={(open) => setModal({ open, player: open ? modal.player : null })}
        player={modal.player}
        tournamentId={auction.tournament_id}
        mode={tournament?.ground_mode || 'turf'}
        onSaved={refresh}
      />
      <PlayerProfileDialog
        player={profile}
        open={!!profile}
        onOpenChange={(open) => !open && setProfile(null)}
      />
    </Panel>
  );
}