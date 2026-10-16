import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, LogIn } from 'lucide-react';

const NEXT_URL = '/Dashboard';

// Opens the platform's secure sign-in screen, which handles both logging in
// and creating a new account.
const openAuth = () => base44.auth.redirectToLogin(NEXT_URL);

export default function AuthButtons({ variant = 'header' }) {
  const { isAuthenticated } = useAuth();
  const isHero = variant === 'hero';

  const base = isHero
    ? 'inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all'
    : 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all';

  const icon = isHero ? 'h-4 w-4' : 'h-3.5 w-3.5';

  if (isAuthenticated) {
    return (
      <Link
        to={NEXT_URL}
        className={`${base} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.03] hover:shadow-emerald-500/40`}>
        <LayoutDashboard className={icon} />
        My dashboard
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openAuth}
        className={`${base} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 hover:scale-[1.03] hover:shadow-emerald-500/40`}>
        <LogIn className={icon} />
        Log in
      </button>
      {/* The hero carries the Register action; the header stays uncluttered on phones. */}
      {isHero && (
        <button
          type="button"
          onClick={openAuth}
          className={`${base} border border-slate-700 bg-slate-800/70 text-slate-200 hover:border-slate-600 hover:text-white`}>
          Register
        </button>
      )}
    </>
  );
}