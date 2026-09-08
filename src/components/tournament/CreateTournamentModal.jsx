import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Check, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  generateBracket,
  generateLeague,
  generateLeagueKnockoutBracket,
  generateLeaguePlayoffs
} from '@/lib/bracket';
import { useGroundShape } from '@/lib/GroundShapeContext';

const shuffleArray = (a) => [...a].sort(() => Math.random() - 0.5);

export default function CreateTournamentModal({ teams, onClose, onCreated }) {
  const queryClient = useQueryClient();
  const { mode } = useGroundShape();
  const [name, setName] = useState('');
  const [format, setFormat] = useState('knockout');
  const [knockoutTeams, setKnockoutTeams] = useState(4);
  const [shuffle, setShuffle] = useState(false);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    if (format === 'league_playoffs' && next.length !== 4) setFormat('knockout');
  };

  const isLeagueKO = format === 'league_knockout';
  const isPlayoffs = format === 'league_playoffs';
  const canCreate =
    name.trim() && selected.length >= 2 && (!isPlayoffs || selected.length === 4);

  const handleCreate = async () => {
    if (!canCreate || saving) return;
    setSaving(true);
    try {
      const ordered = shuffle ? shuffleArray(selected) : selected;
      const tour = await base44.entities.Tournament.create({
        name: name.trim(),
        team_ids: ordered,
        num_teams: ordered.length,
        format,
        knockout_teams: isLeagueKO ? knockoutTeams : 4,
        ground_mode: mode,
        status: 'in_progress'
      });

      let matches = [];
      if (isPlayoffs) {
        matches = generateLeaguePlayoffs(tour.id, ordered);
      } else if (isLeagueKO) {
        matches = [
          ...generateLeague(tour.id, ordered),
          ...generateLeagueKnockoutBracket(tour.id, knockoutTeams)
        ];
      } else {
        matches = generateBracket(tour.id, ordered);
      }
      if (matches.length) await base44.entities.TournamentMatch.bulkCreate(matches);
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

          {/* Format */}
          <div>
            <Label className="text-slate-200">Format</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFormat('knockout')}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  format === 'knockout'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-medium text-white">Knockout</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Straight bracket draw</div>
              </button>
              <button
                onClick={() => setFormat('league_knockout')}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  format === 'league_knockout'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-medium text-white">League + Knockout</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Round-robin then semis</div>
              </button>
              <button
                onClick={() => setFormat('league_playoffs')}
                disabled={selected.length !== 4}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  format === 'league_playoffs'
                    ? 'bg-emerald-500/20 border-emerald-500/50'
                    : selected.length !== 4
                    ? 'bg-slate-800/60 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    selected.length !== 4 && format !== 'league_playoffs'
                      ? 'text-slate-500'
                      : 'text-white'
                  }`}
                >
                  League + Playoffs
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {selected.length !== 4 ? 'Exactly 4 teams' : 'Topper straight to final'}
                </div>
              </button>
            </div>
          </div>

          {isLeagueKO && (
            <div>
              <Label className="text-slate-200">Teams qualifying for knockout</Label>
              <div className="flex gap-2">
                {[4, 8].map((k) => (
                  <button
                    key={k}
                    onClick={() => setKnockoutTeams(k)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      knockoutTeams === k
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    Top {k}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Shuffle draw */}
          <button
            onClick={() => setShuffle((s) => !s)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
              shuffle
                ? 'bg-emerald-500/10 border-emerald-500/40'
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-slate-600">
              {shuffle && <Check className="w-3 h-3 text-emerald-400" />}
            </div>
            <Shuffle className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-white">Shuffle teams in the draw</span>
          </button>

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
            {isPlayoffs
              ? 'Each team plays every other team once. The table topper goes straight to the Final, 2nd plays 3rd in the Semifinal, and the last team is eliminated.'
              : isLeagueKO
              ? 'Each team plays every other team once. The top teams then advance to a seeded knockout bracket.'
              : 'A single-elimination bracket is generated automatically. Teams get byes if the count isn\u2019t a power of 2.'}
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