import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { TeamBadge, contrastText } from '@/components/auction/Shared';
import { TEAM_COLOURS } from '@/components/auction/setup/TeamFormModal';
import SquadBuilder from './SquadBuilder';
import addTournamentTeam from '@/lib/tournament/addTeam';

// Adds a team to a tournament after the auction is done — team details plus a
// squad picked from existing players, new names, or both.
export default function AddTeamModal({ open, onOpenChange, tournament, onSaved }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#10b981');
  const [selected, setSelected] = useState([]);
  const [newPlayers, setNewPlayers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setColor('#10b981');
    setSelected([]);
    setNewPlayers([]);
    setError('');
  }, [open]);

  const save = async () => {
    if (!name.trim()) {
      setError('A team name is required.');
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
        newPlayers
      });
      onSaved && onSaved(result);
      onOpenChange(false);
    } catch (e) {
      setError(e?.message || 'Could not add the team.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a team</DialogTitle>
        </DialogHeader>

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
            newPlayers={newPlayers}
            onNewPlayersChange={setNewPlayers}
          />

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}