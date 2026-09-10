import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown, Check } from 'lucide-react';

export default function PlayerSearchSelect({ value, onChange, players, teamsMap, placeholder, accentClass }) {
  const [open, setOpen] = useState(false);
  const selected = players.find(p => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`w-full flex items-center justify-between gap-2 rounded-lg bg-slate-800 border px-3 py-2.5 text-sm transition-colors ${accentClass}`}
        >
          <span className={selected ? 'text-white font-medium truncate' : 'text-slate-500'}>
            {selected
              ? `${selected.name} — ${teamsMap[selected.team_id]?.short_name || '?'}`
              : placeholder}
          </span>
          <ChevronsUpDown className="w-4 h-4 text-slate-500 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type a player's name to search..." />
          <CommandList>
            <CommandEmpty>No players found.</CommandEmpty>
            <CommandGroup>
              {players.map(p => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${teamsMap[p.team_id]?.name || ''} ${p.role?.replace('_', ' ') || ''}`}
                  onSelect={() => { onChange(p.id); setOpen(false); }}
                >
                  <Check className={`w-4 h-4 mr-2 ${value === p.id ? 'opacity-100' : 'opacity-0'}`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      {teamsMap[p.team_id]?.short_name || '?'} · {p.role?.replace('_', ' ') || ''}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}