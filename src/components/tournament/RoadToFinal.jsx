import React from 'react';
import { ChevronDown, ChevronRight, Crown, Trophy } from 'lucide-react';

// Chamfered frame — an outer clipped layer acts as the 1px light-blue border.
const CHAMFER = 'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)';
const HATCH = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(161,192,232,0.75) 0 1px, transparent 1px 3px)',
};
const STAGES = [
  { label: 'Qualifier 1', hint: '1st vs 2nd' },
  { label: 'Eliminator', hint: '3rd vs 4th' },
  { label: 'Qualifier 2', hint: 'Loser Q1 vs Winner Eliminator' },
  { label: 'Final', hint: 'Winner Q1 vs Winner Q2' },
];

function Frame({ children, className = '' }) {
  return (
    <div
      className={`p-px ${className}`}
      style={{ clipPath: CHAMFER, backgroundColor: 'rgba(161,192,232,0.6)' }}
    >
      <div className="h-full" style={{ clipPath: CHAMFER, backgroundColor: '#15336a' }}>
        {children}
      </div>
    </div>
  );
}

function TeamLine({ teamId, winner, crown, teamsMap }) {
  const team = teamId ? teamsMap[teamId] : null;
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-sm ${winner ? 'bg-[#ffcc00]/15' : ''}`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: team?.primary_color || 'rgba(161,192,232,0.45)' }}
      />
      <span
        className={`text-[11px] truncate ${
          winner ? 'text-[#ffcc00] font-semibold' : team ? 'text-white' : 'text-[#a1c0e8]/60'
        }`}
      >
        {team ? team.name || team.short_name : 'To be decided'}
      </span>
      {crown && winner && <Crown className="w-3 h-3 text-[#ffcc00] ml-auto shrink-0" />}
    </div>
  );
}

function SeedBox({ place, teamId, teamsMap }) {
  const team = teamId ? teamsMap[teamId] : null;
  return (
    <Frame className="w-full md:w-[152px]">
      <div className="px-2.5 py-1.5 flex items-center gap-2">
        <span className="text-[9px] font-bold tracking-wide text-[#a1c0e8] uppercase shrink-0">
          {place}
        </span>
        <span className={`text-[11px] truncate ml-auto ${team ? 'text-white' : 'text-[#a1c0e8]/60'}`}>
          {team ? team.name || team.short_name : 'TBD'}
        </span>
      </div>
    </Frame>
  );
}

function MatchCard({ stage, row, teamsMap, crown }) {
  const team1 = row?.team1 || '';
  const team2 = row?.team2 || '';
  const winner = row?.winner || '';
  return (
    <div className="w-full md:w-[168px]">
      <Frame>
        <div className="px-2.5 py-2">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-[9px] font-bold tracking-[0.12em] text-[#ffcc00] uppercase">
              {stage.label}
            </span>
            <span className="w-5 h-2 shrink-0 mt-0.5" style={HATCH} />
          </div>
          <TeamLine teamId={team1} winner={winner && winner === team1} crown={crown} teamsMap={teamsMap} />
          <TeamLine teamId={team2} winner={winner && winner === team2} crown={crown} teamsMap={teamsMap} />
        </div>
      </Frame>
      <div className="text-[9px] text-[#a1c0e8]/70 text-center mt-1 leading-tight">{stage.hint}</div>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center md:w-6 shrink-0">
      <ChevronRight className="hidden md:block w-5 h-5 text-[#a1c0e8]/80" />
      <ChevronDown className="md:hidden w-5 h-5 text-[#a1c0e8]/80" />
    </div>
  );
}

/**
 * Road to the Final — the qualifier chain drawn as a flow chart:
 * 1st/2nd -> Qualifier 1, 3rd/4th -> Eliminator, both feed Qualifier 2 and the Final.
 */
export default function RoadToFinal({ seeds = [], matches = [], teamsMap = {} }) {
  const rows = STAGES.map((_, i) => matches[i] || {});
  return (
    <div
      className="mt-6 rounded-2xl border border-[#a1c0e8]/25 p-4 sm:p-5"
      style={{
        backgroundColor: '#0a2558',
        backgroundImage:
          'linear-gradient(rgba(161,192,232,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(161,192,232,0.10) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-[#ffcc00] shrink-0" />
        <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-[#ffcc00]">
          ROAD TO THE FINAL
        </span>
        <span className="flex-1 h-px bg-[#a1c0e8]/25" />
      </div>

      <div className="flex flex-col md:flex-row md:items-stretch gap-1">
        <div className="flex flex-col justify-around gap-3 md:gap-8">
          <div className="space-y-1.5">
            <SeedBox place="1st" teamId={seeds[0]} teamsMap={teamsMap} />
            <SeedBox place="2nd" teamId={seeds[1]} teamsMap={teamsMap} />
          </div>
          <div className="space-y-1.5">
            <SeedBox place="3rd" teamId={seeds[2]} teamsMap={teamsMap} />
            <SeedBox place="4th" teamId={seeds[3]} teamsMap={teamsMap} />
          </div>
        </div>

        <Connector />

        <div className="flex flex-col justify-around gap-3 md:gap-8">
          <MatchCard stage={STAGES[0]} row={rows[0]} teamsMap={teamsMap} />
          <MatchCard stage={STAGES[1]} row={rows[1]} teamsMap={teamsMap} />
        </div>

        <Connector />

        <div className="flex flex-col justify-center">
          <MatchCard stage={STAGES[2]} row={rows[2]} teamsMap={teamsMap} />
        </div>

        <Connector />

        <div className="flex flex-col justify-center">
          <MatchCard stage={STAGES[3]} row={rows[3]} teamsMap={teamsMap} crown />
        </div>
      </div>
    </div>
  );
}