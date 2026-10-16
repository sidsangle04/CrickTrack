import React from 'react';
import { Upload, FileText, Link2, CheckCircle2, Lock } from 'lucide-react';
import DemoShell from '@/components/demo/DemoShell';
import DemoLockedAction from '@/components/demo/DemoLockedAction';

const CARDS = [
  {
    icon: FileText,
    title: 'Play-Cricket PDF scorecard',
    body: 'Drop in a printed Play-Cricket scorecard PDF. CrickTrack reads both innings, the batting and bowling figures, and builds the full match record.',
    hint: 'Best for a complete paper scorecard',
  },
  {
    icon: Upload,
    title: 'Ball-by-ball Excel / CSV',
    body: 'Import a ball-by-ball log and get wagon wheels, pitch maps, over-by-over momentum and a full match report.',
    hint: 'Best for detailed analysis',
  },
  {
    icon: Link2,
    title: 'Play-Cricket URL',
    body: 'Paste a Play-Cricket results link and pull the completed match in directly, teams and players included.',
    hint: 'Best for quick entry',
  },
];

export default function DemoImport() {
  return (
    <DemoShell
      title="Import Match Data"
      subtitle="Bring existing scorecards into CrickTrack for full reports and analytics"
    >
      <div className="space-y-4">
        {CARDS.map(({ icon: Icon, title, body, hint }) => (
          <div
            key={title}
            className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5"
          >
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-emerald-400" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-semibold">{title}</h3>
                <p className="text-sm text-slate-400 mt-1">{body}</p>
                <p className="text-xs text-slate-500 mt-2">{hint}</p>
              </div>
            </div>

            {/* The drop zone is shown, but imports are locked until you sign in. */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/40 px-4 py-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Lock className="w-4 h-4" />
                Importing is available after you log in
              </div>
              <DemoLockedAction label="Log in to import" className="sm:w-auto w-full" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 p-5">
        <h3 className="text-white font-semibold mb-3">What you get from an import</h3>
        <ul className="space-y-2">
          {[
            'Teams and full squads created automatically',
            'Both innings with batting and bowling figures',
            'Ball-by-ball charts where the scorecard supports them',
            'Player career stats updated straight away',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </DemoShell>
  );
}