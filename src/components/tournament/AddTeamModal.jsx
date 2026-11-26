import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
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

// Adds a team to a tournament after the auction is done — team details plus a
// squad picked from unsold players, existing players, new names, or all three.
// The second step asks who the team's ICON player is.
export default function AddTeamModal({ open, onOpenChange, tournament, onSaved }) {
  const [step, setStep] = useState('squad');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [selected, setSelected] = useState([]);
  const [pickedUnsold, setPickedUnsold] = useState([]);
  const [newPlayers, setNewPlayers] = useState([]);
  const [iconName, setIconName] = useState('');
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
    setIconName('');
    setError('');
  }, [open]);

  const squadNames = [
    ...selected.map((p) => p.name),
    ...pickedUnsold.map((p) => p.name),
    ...newPlayers.filter((p) => (p.name || '').trim()).map((p) => p.name.trim())
  ].filter(Boolean);

  const save = async () => {
    if (squadNames.length && !iconName) {
      setError('Pick the ICON player.');
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
        iconName
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
    // No squad means there is no one to pick as ICON.
    if (!squadNames.length) {
      save();
      return;
    }
    setStep('icon');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === 'icon' ? 'Who is the ICON player?' : 'Add a team'}</DialogTitle>
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

            <div className="rounded-lg border border-slate-700/60 divide-y divide-slate-700/40 max-h-72 overflow-y-auto">
              {squadNames.map((playerName) => (
                <button
                  key={playerName}
                  type="button"
                  onClick={() => setIconName(playerName)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/60 transition-colors"
                >
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      iconName === playerName
                        ? 'bg-purple-500 border-purple-500 text-slate-900'
                        : 'border-slate-600'
                    }`}
                  >
                    {iconName === playerName && <Check className="w-3 h-3" />}
                  </span>
                  <PlayerAvatar player={{ name: playerName }} size="sm" className="!w-7 !h-7 !rounded-md" />
                  <span className="text-xs text-white truncate flex-1">{playerName}</span>
                  {iconName === playerName && (
                    <span className="text-[9px] uppercase text-purple-300">icon</span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              The ICON player is shown in the squad like the auction's icon picks.
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
                {squadNames.length ? 'Continue' : 'Add team'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}