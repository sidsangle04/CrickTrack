import React from 'react';
import { Link } from 'react-router-dom';

export default function TrustFooter() {
  return (
    <footer className="border-t border-slate-700/50 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} CrickTrack
        </p>
        <nav className="flex items-center gap-6">
          <Link to="/About" className="text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors">
            About
          </Link>
          <Link to="/FoundersNote" className="text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors">
            Founder's Note
          </Link>
          <Link to="/Contact" className="text-xs font-medium text-slate-400 hover:text-emerald-400 transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}