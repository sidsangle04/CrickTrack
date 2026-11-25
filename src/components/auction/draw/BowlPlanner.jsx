import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Check, GripVertical, Loader2, Save, Users, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { PlayerAvatar } from '../Shared';
import { bowlsReady } from '@/lib/auction/draw';

const BOWL_IDS = ['pool', 'bowl1', 'bowl2'];

function BowlPill({ value, onChange }) {
  const options = [
    { id: 'none', label: 'Pool' },
    { id: 'bowl1', label: 'B1' },
    { id: 'bowl2', label: 'B2' }
  ];
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors ${
            (value || 'none') === o.id
              ? 'bg-emerald-500/25 text-emerald-300'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Column({ id, title, subtitle, count, tone, children }) {
  return (
    <Droppable droppableId={id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`rounded-2xl border p-3 min-h-[180px] transition-colors ${
            snapshot.isDraggingOver
              ? 'border-emerald-500/70 bg-emerald-500/5'
              : 'border-slate-700/70 bg-slate-900/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${tone}`}>{title}</p>
              <p className="text-[10px] text-slate-500">{subtitle}</p>
            </div>
            <span className="text-sm font-bold text-white tabular-nums">{count}</span>
          </div>
          <div className="space-y-1.5">{children}</div>
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

export default function BowlPlanner({ auction, teams, players, refresh, canEdit = true }) {
  const [assign, setAssign] = useState({});
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  // Bowls the organiser placed by hand while picking the icon players.
  const [bowlChoice, setBowlChoice] = useState({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const iconList = useMemo(() => players.filter((p) => p.category === 'icon'), [players]);

  useEffect(() => {
    if (dirty) return;
    const next = {};
    iconList.forEach((p) => {
      next[p.id] = p.bowl || 'none';
    });
    setAssign(next);
  }, [players, dirty]);

  const effective = useMemo(
    () => iconList.map((p) => ({ ...p, bowl: assign[p.id] || 'none' })),
    [iconList, assign]
  );

  const pool = effective.filter((p) => p.bowl === 'none');
  const bowl1 = effective.filter((p) => p.bowl === 'bowl1');
  const bowl2 = effective.filter((p) => p.bowl === 'bowl2');
  const validation = bowlsReady({ players: effective, teams });

  const move = (playerId, target) => {
    setAssign((a) => ({ ...a, [playerId]: target }));
    setDirty(true);
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    move(draggableId, destination.droppableId === 'pool' ? 'none' : destination.droppableId);
  };

  const saveBowls = async () => {
    if (!effective.length) {
      setError('Choose the icon players first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await base44.entities.AuctionPlayer.bulkUpdate(
        effective.map((p) => ({ id: p.id, bowl: p.bowl }))
      );
      setDirty(false);
      refresh && refresh();
    } catch (e) {
      setError(e?.message || 'Could not save the bowls.');
    } finally {
      setSaving(false);
    }
  };

  const openPicker = () => {
    setSelectedIds(iconList.map((p) => p.id));
    setBowlChoice({});
    setSearch('');
    setError('');
    setPicker(true);
  };

  // How the chosen players will be split — the same order the save uses: a bowl you
  // tapped wins, then the bowl the player already sits in, then the bowls fill up.
  const preview = useMemo(() => {
    const counts = { bowl1: 0, bowl2: 0 };
    const resolved = {};
    selectedIds.forEach((id) => {
      const p = players.find((x) => x.id === id);
      if (!p) return;
      const explicit = bowlChoice[id];
      const kept =
        !explicit && p.category === 'icon' && (p.bowl === 'bowl1' || p.bowl === 'bowl2')
          ? p.bowl
          : null;
      const bowl = explicit || kept;
      if (bowl) {
        resolved[id] = bowl;
        counts[bowl] += 1;
      }
    });
    const nextBowl = () => {
      if (counts.bowl1 < teams.length) {
        counts.bowl1 += 1;
        return 'bowl1';
      }
      if (counts.bowl2 < teams.length) {
        counts.bowl2 += 1;
        return 'bowl2';
      }
      return 'none';
    };
    selectedIds.forEach((id) => {
      if (resolved[id]) return;
      const bowl = nextBowl();
      if (bowl !== 'none') resolved[id] = bowl;
    });
    return { resolved, counts };
  }, [selectedIds, bowlChoice, players, teams.length]);

  const togglePlayer = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) {
        setBowlChoice((c) => {
          const next = { ...c };
          delete next[id];
          return next;
        });
        return ids.filter((x) => x !== id);
      }
      return [...ids, id];
    });
  };

  const saveSelection = async () => {
    if (selectedIds.length !== teams.length * 2 || saving) return;
    if (preview.counts.bowl1 !== teams.length || preview.counts.bowl2 !== teams.length) {
      setError(
        `Each bowl needs exactly ${teams.length} player${teams.length === 1 ? '' : 's'} — tap B1 or B2 to move someone across.`
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      const chosen = new Set(selectedIds);
      const updates = [];
      players
        .filter((p) => !p.sold_to_team_id)
        .forEach((p) => {
          const isIcon = p.category === 'icon';
          if (chosen.has(p.id)) {
            updates.push({ id: p.id, category: 'icon', bowl: preview.resolved[p.id] || 'none' });
          } else if (isIcon) {
            updates.push({
              id: p.id,
              category: 'gold',
              bowl: 'none',
              sold_price: 0,
              status: 'available'
            });
          }
        });
      if (updates.length) await base44.entities.AuctionPlayer.bulkUpdate(updates);
      setDirty(false);
      setPicker(false);
      refresh && refresh();
    } catch (e) {
      setError(e?.message || 'Could not save the icon players.');
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (player, index) => (
    <Draggable key={player.id} draggableId={player.id} index={index} isDragDisabled={!canEdit}>
      {(dp) => (
        <div
          ref={dp.innerRef}
          {...dp.draggableProps}
          {...dp.dragHandleProps}
          className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <PlayerAvatar player={player} size="sm" />
          <p className="text-xs font-medium text-white truncate flex-1">{player.name}</p>
          {canEdit && <BowlPill value={player.bowl} onChange={(v) => move(player.id, v)} />}
        </div>
      )}
    </Draggable>
  );

  const candidates = players
    .filter((p) => !p.sold_to_team_id)
    .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="rounded-2xl bg-slate-800/50 border border-slate-700/60 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-semibold text-white">Icon player bowls</h2>
          <p className="text-xs text-slate-400">
            Pick {teams.length * 2} icon players, then drag them so each bowl holds exactly{' '}
            {teams.length} — one per team.
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={openPicker}
              className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" /> Choose icon players ({iconList.length})
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              onClick={saveBowls}
              disabled={saving || !dirty}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-1.5" />
              )}
              Save bowls
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-3 md:grid-cols-3">
          <Column
            id="pool"
            title="Registered icons"
            subtitle="Drag into a bowl"
            count={pool.length}
            tone="text-slate-300"
          >
            {pool.map((p, i) => renderRow(p, i))}
          </Column>
          <Column
            id="bowl1"
            title="Bowl 1"
            subtitle={`Needs ${teams.length}`}
            count={bowl1.length}
            tone="text-blue-300"
          >
            {bowl1.map((p, i) => renderRow(p, i))}
          </Column>
          <Column
            id="bowl2"
            title="Bowl 2"
            subtitle={`Needs ${teams.length}`}
            count={bowl2.length}
            tone="text-pink-300"
          >
            {bowl2.map((p, i) => renderRow(p, i))}
          </Column>
        </div>
      </DragDropContext>

      <div className="mt-3 space-y-1">
        {validation.ready ? (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Both bowls are ready.
          </p>
        ) : (
          validation.errors.map((e) => (
            <p key={e} className="text-xs text-amber-400 flex items-center gap-1.5">
              <X className="w-3.5 h-3.5 shrink-0" /> {e}
            </p>
          ))
        )}
      </div>

      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose icon players</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400">
            Select {teams.length * 2} players for {teams.length} team
            {teams.length === 1 ? '' : 's'} — {teams.length} for each bowl. Tap B1 or B2 on a
            player to put them in a different bowl.
          </p>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players"
            className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
          />
          <div className="max-h-[45vh] overflow-y-auto space-y-1.5 py-1">
            {candidates.map((p) => {
              const checked = selectedIds.includes(p.id);
              const placed = preview.resolved[p.id];
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => togglePlayer(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      togglePlayer(p.id);
                    }
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left cursor-pointer ${
                    checked
                      ? 'bg-purple-500/15 border-purple-500/50'
                      : 'bg-slate-950 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      checked ? 'bg-purple-500 border-purple-500' : 'border-slate-600'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <PlayerAvatar player={p} size="sm" />
                  <span className="text-sm text-white truncate flex-1">{p.name}</span>
                  {checked ? (
                    <div
                      className="flex gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {['bowl1', 'bowl2'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBowlChoice((c) => ({ ...c, [p.id]: b }))}
                          title={b === 'bowl1' ? 'Put in Bowl 1' : 'Put in Bowl 2'}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold transition-colors ${
                            placed === b
                              ? b === 'bowl1'
                                ? 'bg-blue-500/30 text-blue-200'
                                : 'bg-pink-500/30 text-pink-200'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {b === 'bowl1' ? 'B1' : 'B2'}
                        </button>
                      ))}
                    </div>
                  ) : (
                    p.category === 'icon' && (
                      <span className="text-[10px] uppercase text-purple-300">icon</span>
                    )
                  )}
                </div>
              );
            })}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <DialogFooter className="flex-col-reverse sm:flex-row sm:items-center gap-2">
            <p className="text-[11px] text-slate-400 sm:mr-auto text-center sm:text-left">
              {selectedIds.length === teams.length * 2
                ? `Bowl 1 ${preview.counts.bowl1}/${teams.length} · Bowl 2 ${preview.counts.bowl2}/${teams.length}`
                : `Select exactly ${teams.length * 2} players (${selectedIds.length} chosen).`}
            </p>
            <Button variant="ghost" onClick={() => setPicker(false)} className="text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={saveSelection}
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={saving || selectedIds.length !== teams.length * 2}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Use {selectedIds.length} players
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}