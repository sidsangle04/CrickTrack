import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';

const ROLE_LABELS = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  all_rounder: 'All-rounder',
  wicket_keeper: 'Wicket-keeper'
};

// Name field that suggests players already saved in this account while typing,
// so the same person is not registered twice under a slightly different name.
export default function PlayerNameInput({ value, onChange, onPick, mode, className, ...props }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  const { data: players = [] } = useQuery({
    queryKey: ['players', mode || 'all'],
    queryFn: () => base44.entities.Player.list(),
    staleTime: 60000
  });

  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const suggestions = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return [];
    const seen = new Set();
    const out = [];
    players.forEach((p) => {
      const name = (p.name || '').trim();
      const key = name.toLowerCase();
      if (!name || seen.has(key) || key === q) return;
      if (mode && (p.ground_mode || 'turf') !== mode) return;
      if (!key.includes(q)) return;
      seen.add(key);
      out.push({ name, role: p.role, player: p });
    });
    return out
      .sort((a, b) => {
        const ap = a.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bp = b.name.toLowerCase().startsWith(q) ? 0 : 1;
        return ap - bp || a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [players, mode, value]);

  const pick = (s) => {
    onChange(s.name);
    onPick && onPick(s.player);
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        className={className}
        {...props}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-slate-800 transition-colors"
            >
              <span className="text-sm text-white truncate">{s.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {ROLE_LABELS[s.role] || 'Player'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}