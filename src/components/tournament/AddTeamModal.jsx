import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { PlayerAvatar, TeamBadge, contrastText } from '@/components/auction/Shared';
import { TEAM_COLOURS } from '@/components/auction/setup/TeamFormModal';
import SquadBuilder from './SquadBuilder';
import addTournamentTeam from '@/lib/tournament/addTeam';
import { iconCountFor } from '@/lib/auction/draw';

// Adds a team to a tournament after the auction is done — team details plus a
// squad picked from unsold players, existing players, new names, or all three.
// The second step asks which squad members are the ICON players, using the same
// number the tournament's auction uses.
export default function AddTeamModal({ open, onOpenChange, tournament, onSaved }) {
  const [step, setStep] = useState('squad');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [selected, setSelected] = useState([]);
  const [pickedUnsold, setPickedUnsold] = useState([]);
  const [newPlayers, setNewPlayers] = useState([]);
  const [iconNames, setIconNames] = useState([]);
  const [iconsNeeded, setIconsNeeded] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStep('squad');
    setName('');
    setColor('#10b981');
    setSelected([]);
    setPickedUnsold([]);
    setNewPlayers([]);
    setIconNames([]);
    setIconsNeeded(2);
    setError('');
    if (!tournament?.id) return;
    base44.entities.Auction.filter({ tournament_id: tournament.id }, '-created_date', 1)
      .then((list) => {
        const auction = list[0];
        setIconsNeeded(auction ? iconCountFor(auction) : 2);
      })
      .catch(() => setIconsNeeded(2));
  }, [open, tournament?.id]);

  const squadNames = [
    ...selected.map((p) => p.name),
    ...pickedUnsold.map((p) => p.name),
    ...newPlayers.filter((p) => (p.name || '').trim()).map((p) => p.name.trim())
  ].filter(Boolean);

  // Never ask for more icons than the squad actually holds.
  const iconTarget = Math.min(iconsNeeded, squadNames.length);

  const toggleIcon = (playerName) => {
    setIconNames((names) => {
      if (names.includes(playerName)) return names.filter((n) => n !== playerName);
      if (names.length >= iconTarget) return names;
      return [...names, playerName];
    });
  };

  const save = async () => {
    if (iconTarget && iconNames.length !== iconTarget) {
      setError(
        `Pick ${iconTarget} ICON player${iconTarget === 1 ? '' : 's'} (${iconNames.length} chosen).`
      );
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await addTournamentTeam({
        tournament,
        name,
        color,
        existingPlayers: selected,
        unsoldPlayers: pickedUnsold,
        newPlayers,
        iconNames
      });
      onSaved && onSaved(result);
      onOpenChange(false);
    } catch (e) {
      setError(e?.message || 'Could not add the team.');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!name.trim()) {
      setError('A team name is required.');
      return;
    }
    setError('');
    // No squad, or a tournament with no icons, means there is nothing to pick.
    if (!squadNames.length || !iconTarget) {
      save();
      return;
    }
    setStep('icon');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'icon'
              ? `Who are the ICON players? (${iconTarget})`
              : 'Add a team'}
          </DialogTitle>
        </DialogHeader>

        {step === 'icon' ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <TeamBadge team={{ name, color }} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{name}</p>
                <p className="text-xs text-slate-400">
                  {squadNames.length} players · no winning bids, they joined after the auction
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Pick {iconTarget} player{iconTarget === 1 ? '' : 's'} from the squad —{' '}
              {iconNames.length} chosen.
            </p>

            <div className="rounded-lg border border-slate-700/60 divide-y divide-slate-700/40 max-h-72 overflow-y-auto">
              {squadNames.map((playerName) => {
                const picked = iconNames.includes(playerName);
                return (
                  <button
                    key={playerName}
                    type="button"
                    onClick={() => toggleIcon(playerName)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/60 transition-colors"
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        picked ? 'bg-purple-500 border-purple-500 text-slate-900' : 'border-slate-600'
                      }`}
                    >
                      {picked && <Check className="w-3 h-3" />}
                    </span>
                    <PlayerAvatar
                      player={{ name: playerName }}
                      size="sm"
                      className="!w-7 !h-7 !rounded-md"
                    />
                    <span className="text-xs text-white truncate flex-1">{playerName}</span>
                    {picked && <span className="text-[9px] uppercase text-purple-300">icon</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500">
              ICON players are shown in the squad like the auction's icon picks.
            </p>

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <TeamBadge team={{ name, color }} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {name || 'New team'}
                </p>
                <p className="text-xs text-slate-400">
                  Joins {tournament?.name || 'this tournament'} only
                </p>
              </div>
            </div>

            <div>
              <Label className="text-slate-200">Team name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Strikers"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div>
              <Label className="text-slate-200">Team colour</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TEAM_COLOURS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      color?.toLowerCase() === c.hex ? 'border-white scale-110' : 'border-slate-600'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={c.name}
                  />
                ))}
              </div>
              <div
                className="mt-2 inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-semibold"
                style={{ backgroundColor: color, color: contrastText(color) }}
              >
                {color}
              </div>
            </div>

            <SquadBuilder
              mode={tournament?.ground_mode || 'turf'}
              tournamentId={tournament?.id}
              selected={selected}
              onSelectedChange={setSelected}
              pickedUnsold={pickedUnsold}
              onPickedUnsoldChange={setPickedUnsold}
              newPlayers={newPlayers}
              onNewPlayersChange={setNewPlayers}
            />

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {step === 'icon' ? (
            <>
              <Button variant="ghost" onClick={() => setStep('squad')} className="text-slate-300">
                Back
              </Button>
              <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add team
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300">
                Cancel
              </Button>
              <Button onClick={next} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {squadNames.length && iconTarget ? 'Continue' : 'Add team'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}