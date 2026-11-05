import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Home as HomeIcon,
  LayoutDashboard,
  BarChart3,
  Users,
  Trophy,
  Target,
  Upload,
  Settings as SettingsIcon,
  RefreshCw,
  Info,
  Mail,
  Quote,
} from 'lucide-react';
import { createPageUrl } from '../utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const TRUST_LINKS = [
  { label: 'About', page: 'About', to: '/About', icon: Info },
  { label: "Founder's Note", page: 'FoundersNote', to: '/FoundersNote', icon: Quote },
  { label: 'Contact', page: 'Contact', to: '/Contact', icon: Mail },
];

const LINKS = [
  { label: 'Home', page: 'Landing', to: '/', icon: HomeIcon },
  { label: 'Matches', page: 'Home', to: null, icon: Target },
  { label: 'Dashboard', page: 'Dashboard', to: '/Dashboard', icon: LayoutDashboard },
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
export default function HeaderMenu({ currentPageName, modeLabel, onSwitchMode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 hover:border-emerald-500/40 transition-all shrink-0"
          title="Jump to a section"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 bg-slate-800 border-slate-700">
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

        <DropdownMenuSeparator className="bg-slate-700" />

        {TRUST_LINKS.map(({ label, page, to, icon: Icon }) => (
          <DropdownMenuItem key={label} asChild>
            <Link
              to={to}
              className={`flex items-center gap-3 cursor-pointer ${
                currentPageName === page ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}

        {/* The inline mode switcher is hidden on phones; it lives here instead. */}
        {onSwitchMode && (
          <>
            <DropdownMenuSeparator className="bg-slate-700 sm:hidden" />
            <DropdownMenuItem
              onSelect={() => onSwitchMode()}
              className="sm:hidden gap-3 text-slate-300 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Switch mode{modeLabel ? ` (${modeLabel})` : ''}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}