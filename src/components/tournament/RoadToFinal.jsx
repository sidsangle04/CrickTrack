import React from 'react';
import { ChevronDown, Trophy } from 'lucide-react';
import RoadToFinalDiagram from './RoadToFinalDiagram';
import { Frame, MatchCardBody, SeedBoxBody } from './roadToFinal/Card';

const STAGES = [
  { label: 'Qualifier 1', hint: '1st vs 2nd' },
  { label: 'Eliminator', hint: '3rd vs 4th' },
  { label: 'Qualifier 2', hint: 'Loser Q1 vs Winner Eliminator' },
  { label: 'Final', hint: 'Winner Q1 vs Winner Q2' },
];

/**
 * Road to the Final — the qualifier chain drawn as a wired flow chart:
 * 1st/2nd feed Qualifier 1, 3rd/4th feed the Eliminator, then Q1's loser and
 * the Eliminator's winner meet in Qualifier 2, and the two qualifier winners
 * play the Final.
 */
export default function RoadToFinal({
  seeds = [],
  matches = [],
  teamsMap = {},
  matchesMap = {},
  onSetWinner,
  onStartGame,
  onOpenMatch,
}) {
  const rows = STAGES.map((_, i) => matches[i] || {});

  return (
    <div
      className="mt-6 rounded-2xl border border-slate-700/60 p-4 sm:p-5"
      style={{
        backgroundColor: '#0b1220',
        backgroundImage:
          'linear-gradient(rgba(16,185,129,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.07) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-emerald-400">
          ROAD TO THE FINAL
        </span>
        <span className="flex-1 h-px bg-slate-700" />
      </div>

      <RoadToFinalDiagram
        seeds={seeds}
        matches={rows}
        teamsMap={teamsMap}
        matchesMap={matchesMap}
        stages={STAGES}
        onSetWinner={onSetWinner}
        onStartGame={onStartGame}
        onOpenMatch={onOpenMatch}
      />

      {/* Phones: the same chain, stacked with arrows running down it. */}
      <div className="md:hidden space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {['1st', '2nd', '3rd', '4th'].map((place, i) => (
            <div key={place} className="h-9">
              <Frame tone="slate" className="h-full">
                <SeedBoxBody place={place} teamId={seeds[i]} teamsMap={teamsMap} />
              </Frame>
            </div>
          ))}
        </div>
        {STAGES.map((stage, i) => (
          <div key={stage.label}>
            <div className="flex items-center justify-center py-1">
              <ChevronDown className="w-4 h-4 text-emerald-400/80" />
            </div>
            <div className="h-[96px]">
              <Frame tone={i === 3 ? 'amber' : 'emerald'} className="h-full">
                <MatchCardBody
                  stage={stage}
                  row={rows[i]}
                  teamsMap={teamsMap}
                  matchesMap={matchesMap}
                  crown={i === 3}
                  onSetWinner={onSetWinner}
                  onStartGame={onStartGame}
                  onOpenMatch={onOpenMatch}
                />
              </Frame>
            </div>
            <div className="text-[9px] text-slate-500 text-center mt-1">{stage.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}