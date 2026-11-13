import React from 'react';
import { format } from 'date-fns';
import { CalendarDays, Mail, Shield } from 'lucide-react';

export default function ProfileCard({ user }) {
  const name = user?.full_name || 'CrickTrack member';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
  const role = user?.role === 'admin' ? 'Admin' : 'Member';
  const memberSince = user?.member_since || user?.created_date;
  const joined = memberSince ? format(new Date(memberSince), 'd MMM yyyy') : null;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-lg font-bold text-slate-900">
          {initials || 'CT'}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-white">{name}</h2>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
            <Shield className="h-3 w-3" />
            {role}
          </span>
        </div>
      </div>

      <dl className="mt-6 space-y-3 border-t border-slate-700/50 pt-5 text-sm">
        {user?.email && (
          <div className="flex items-center gap-2.5 text-slate-300">
            <Mail className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        {joined && (
          <div className="flex items-center gap-2.5 text-slate-300">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
            Member since {joined}
          </div>
        )}
      </dl>
    </div>
  );
}