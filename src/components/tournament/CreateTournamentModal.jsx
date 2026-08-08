import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateBracket } from '@/lib/bracket';

export default function CreateTournamentModal({ teams, onClose, onCreated }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const canCreate = name.trim() && selected.length >= 2;

  const handleCreate = async () => {
    if (!canCreate || saving) return;
    setSaving(true);
    try {
      const tour = await base44.entities.Tournament.create({
        name: name.trim(),
        team_ids: selected,
        num_teams: selected.length,
        format: 'knockout',
        status: 'in_progress'
      });
      const bracket = generateBracket(tour.id, selected);
      if (bracket.length) await base44.entities.TournamentMatch.bulkCreate(bracket);
      queryClient.invalidateQueries(['tournaments']);
      onCreated(tour.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">New Tournament</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-200">Tournament Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunday Knockout Cup"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <Label className="text-slate-200">
              Select Teams ({selected.length} selected)
            </Label>
            {teams.length === 0 ? (
              <p className="text-sm text-slate-400">No teams found. Create teams first.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {teams.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => toggle(t.id)}
                    className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                      selected.includes(t.id)
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-600">
                      {selected.includes(t.id) && <Check className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <span className="text-sm font-medium text-white">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            A single-elimination bracket is generated automatically. Teams get byes if the count isn't a power of 2.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-slate-700 text-slate-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canCreate || saving}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Tournament
          </Button>
        </div>
      </div>
    </div>
  );
}