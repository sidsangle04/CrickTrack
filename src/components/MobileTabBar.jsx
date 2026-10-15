import React from 'react';
import { Home, BarChart3, Users, Trophy, Upload } from 'lucide-react';

const TABS = [
  { key: 'matches', label: 'Matches', Icon: Home },
  { key: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { key: 'players', label: 'Players', Icon: Users },
  { key: 'cup', label: 'Cup', Icon: Trophy },
  { key: 'import', label: 'Import', Icon: Upload }
];

export default function MobileTabBar({ activeTab, onSelectTab }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 px-2 py-2 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex justify-around">
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectTab(key)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg ${
                active ? 'text-emerald-400' : 'text-slate-500'
              }`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}