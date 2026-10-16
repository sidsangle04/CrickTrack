import React from 'react';
import { User, Mail, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import DeleteAccountCard from '@/components/settings/DeleteAccountCard';

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-700/40 last:border-0">
      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
      <span className="text-xs text-slate-500 uppercase tracking-wide w-20">{label}</span>
      <span className="text-sm text-white truncate">{value}</span>
    </div>
  );
}

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400">Your CrickTrack account.</p>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide mb-2">Account</h2>
        <DetailRow icon={User} label="Name" value={user?.full_name || '—'} />
        <DetailRow icon={Mail} label="Email" value={user?.email || '—'} />
        <DetailRow icon={Shield} label="Role" value={user?.role || 'user'} />
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-5">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Sign out</h2>
        <p className="mt-1 text-sm text-slate-400">
          You'll be taken back to the CrickTrack home page.
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:border-red-500/40 hover:text-red-400 sm:w-auto">
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>

      <DeleteAccountCard onDeleted={() => logout(true)} />
    </div>
  );
}