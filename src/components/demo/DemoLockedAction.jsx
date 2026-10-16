import React from 'react';
import { Lock } from 'lucide-react';
import { signIn } from '@/lib/signIn';

/**
 * Stands in for any button that would create, edit, score or import data while
 * browsing the demo. It never touches the database — it only offers sign-in.
 */
export default function DemoLockedAction({ label, className = '', variant = 'solid' }) {
  const styles =
    variant === 'ghost'
      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
      : 'bg-emerald-500 text-white hover:bg-emerald-600';

  return (
    <button
      type="button"
      onClick={signIn}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${styles} ${className}`}
    >
      <Lock className="w-4 h-4" />
      {label}
    </button>
  );
}