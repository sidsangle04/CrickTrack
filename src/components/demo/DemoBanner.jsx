import React from 'react';
import { Eye, LogIn } from 'lucide-react';
import { signIn } from '@/lib/signIn';

/**
 * Shown at the top of every section a signed-out visitor can browse: makes it
 * unmistakable that the numbers on screen are sample data, and offers the way in.
 */
export default function DemoBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Eye className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-200">Demo mode · sample data</p>
          <p className="text-xs text-amber-200/70">
            This is example data so you can see how CrickTrack works. Log in to score your own matches,
            teams and tournaments.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={signIn}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 shrink-0"
      >
        <LogIn className="w-4 h-4" />
        Log in / Register
      </button>
    </div>
  );
}