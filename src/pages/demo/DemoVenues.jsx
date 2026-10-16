import React from 'react';
import { MapPin, BarChart3, Pencil, Trash2 } from 'lucide-react';
import DemoShell from '@/components/demo/DemoShell';
import DemoLockedAction from '@/components/demo/DemoLockedAction';
import { DEMO_VENUES } from '@/lib/demoData';

export default function DemoVenues() {
  return (
    <DemoShell
      title="Venues"
      subtitle="Grounds and their average first-innings score, used for par scores and match previews"
      action={<DemoLockedAction label="Add venue" className="!px-3 !py-2 shrink-0" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_VENUES.map((v) => (
          <div
            key={v.id}
            className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold truncate">{v.name}</p>
                <p className="text-xs text-slate-400 truncate">{v.location}</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 px-3 py-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs text-slate-300">
                Avg 1st innings <span className="text-white font-bold">{v.average}</span>
                <span className="text-slate-500">
                  {' '}
                  · {v.matches} match{v.matches === 1 ? '' : 'es'}
                </span>
              </span>
            </div>

            <div className="flex gap-2 mt-auto">
              <DemoLockedAction
                label="Edit"
                variant="ghost"
                className="flex-1 !px-2 !py-1.5 !text-xs"
              />
              <DemoLockedAction
                label="Delete"
                variant="ghost"
                className="flex-1 !px-2 !py-1.5 !text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500 flex items-center gap-2">
        <Pencil className="w-3.5 h-3.5" />
        Venues you save are linked to matches and drive the par-score comparisons.
        <Trash2 className="w-3.5 h-3.5 ml-1" />
        Editing is available once you log in.
      </p>
    </DemoShell>
  );
}