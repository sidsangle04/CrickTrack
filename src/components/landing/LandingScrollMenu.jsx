import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

// Every section of the landing page, so a long page can be skipped through.
const SECTIONS = [
  { id: 'top', label: 'Top of page' },
  { id: 'overview', label: 'Overview' },
  { id: 'features', label: 'Features' },
  { id: 'insight', label: 'Insight' },
  { id: 'community', label: 'Community' },
];

export default function LandingScrollMenu() {
  const jump = (id) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Jump to a section on this page"
            className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800/95 border border-slate-700 text-slate-200 shadow-lg backdrop-blur hover:border-emerald-500/40 hover:text-white transition-colors"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-48 bg-slate-800 border-slate-700">
          {SECTIONS.map(({ id, label }) => (
            <DropdownMenuItem
              key={id}
              onSelect={() => jump(id)}
              className="cursor-pointer text-slate-300"
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}