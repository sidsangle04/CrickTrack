import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Home, BarChart3, Users, Trophy, Upload, Settings as SettingsIcon } from 'lucide-react';
import { createPageUrl } from '../utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const LINKS = [
  { label: 'Matches', page: 'Home', to: null, icon: Home },
  { label: 'Analytics', page: 'Analytics', to: null, icon: BarChart3 },
  { label: 'Players', page: 'Players', to: null, icon: Users },
  { label: 'Tournaments', page: 'Tournaments', to: null, icon: Trophy },
  { label: 'Import', page: 'ImportMatch', to: null, icon: Upload },
  { label: 'Settings', page: 'Settings', to: '/Settings', icon: SettingsIcon },
];

/**
 * Header navigation for narrow screens: the wide-screen inline menu is hidden
 * below the md breakpoint, so this button keeps every section one tap away.
 */
export default function HeaderMenu({ currentPageName }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all shrink-0"
          title="Menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-slate-800 border-slate-700">
        {LINKS.map(({ label, page, to, icon: Icon }) => (
          <DropdownMenuItem key={label} asChild>
            <Link
              to={to || createPageUrl(page)}
              className={`flex items-center gap-3 cursor-pointer ${
                currentPageName === page ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}