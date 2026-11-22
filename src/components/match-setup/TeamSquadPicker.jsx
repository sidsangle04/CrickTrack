import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// One team's squad list on the playing-selection step. The cap is the tournament
// auction's squad size when this match belongs to an auction tournament.
export default function TeamSquadPicker({ name, players = [], selected = [], limit, onToggle, onChange }) {
  const cap = Math.min(players.length, limit);
  const allChosen = selected.length >= cap && cap > 0;

  return (
    <div>
      <h3 className="font-medium text-white mb-3 flex items-center justify-between">
        {name}
        <span className="text-sm text-slate-400">
          {selected.length}/{limit}
        </span>
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {players.length === 0 ? (
          <p className="text-sm text-slate-400">No players in this team</p>
        ) : (
          players.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  on
                    ? 'bg-emerald-500/20 border border-emerald-500/50'
                    : 'bg-slate-900 border border-slate-700 hover:border-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    on ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                  }`}
                >
                  {on && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm font-medium text-white">{p.name}</span>
              </button>
            );
          })
        )}
      </div>
      {players.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange(allChosen ? [] : players.slice(0, cap).map((p) => p.id))}
          className="mt-3 w-full border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          {allChosen ? 'Deselect All' : 'Select All'}
        </Button>
      )}
    </div>
  );
}