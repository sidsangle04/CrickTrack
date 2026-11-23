import React from 'react';
import { Frame, MatchCardBody, SeedBoxBody } from './Card';

const LINE = '#10b981';
const W = 300;
const H = 548;

const SEEDS = [
  { place: '1st', left: 4, top: 0 },
  { place: '2nd', left: 4, top: 36 },
  { place: '3rd', left: 180, top: 0 },
  { place: '4th', left: 180, top: 36 },
];
const CARD_POS = [
  { left: 4, top: 104, width: 146, height: 96 },
  { left: 150, top: 104, width: 146, height: 96 },
  { left: 4, top: 268, width: 292, height: 96 },
  { left: 4, top: 424, width: 292, height: 104 },
];

function Label({ x, y, children }) {
  return (
    <text x={x} y={y} fill="#34d399" fontSize="8" letterSpacing="0.8">
      {children}
    </text>
  );
}

/**
 * The same qualifier chain laid out for portrait phones: the league's top four
 * at the top, both branches side by side, then Qualifier 2 and the Final.
 */
export default function PortraitDiagram({
  seeds = [],
  matches = [],
  teamsMap = {},
  matchesMap = {},
  stages,
  onSetWinner,
  onStartGame,
  onOpenMatch,
}) {
  return (
    <div className="md:hidden flex justify-center overflow-x-auto">
      <div className="relative shrink-0" style={{ width: W, height: H }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          fill="none"
        >
          <defs>
            <marker
              id="rtf-arrow-v"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={LINE} />
            </marker>
          </defs>

          {/* 1st + 2nd -> Qualifier 1 */}
          <path d="M120,14 H134 M120,50 H134 M134,14 V50 M134,50 V90 H77" stroke={LINE} strokeOpacity="0.65" strokeWidth="1.2" />
          <path d="M77,90 V104" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow-v)" />

          {/* 3rd + 4th -> Eliminator */}
          <path d="M180,14 H166 M180,50 H166 M166,14 V50 M166,50 V90 H223" stroke={LINE} strokeOpacity="0.65" strokeWidth="1.2" />
          <path d="M223,90 V104" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow-v)" />

          {/* Loser of Q1 -> Qualifier 2 */}
          <path d="M77,200 V234 H105 V268" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow-v)" />
          <Label x={8} y={230}>Q1 LOSER</Label>

          {/* Winner of Eliminator -> Qualifier 2 */}
          <path d="M223,200 V234 H195 V268" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow-v)" />
          <Label x={202} y={230}>ELIMINATOR WINNER</Label>

          {/* Winner of Q2 -> Final */}
          <path d="M150,364 V424" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow-v)" />
        </svg>

        {SEEDS.map((s, i) => (
          <div
            key={s.place}
            className="absolute"
            style={{ left: s.left, top: s.top, width: 116, height: 28 }}
          >
            <Frame tone="slate" className="h-full">
              <SeedBoxBody place={s.place} teamId={seeds[i]} teamsMap={teamsMap} />
            </Frame>
          </div>
        ))}

        {stages.map((stage, i) => (
          <div key={stage.label} className="absolute" style={CARD_POS[i]}>
            <Frame tone={i === 3 ? 'amber' : 'emerald'} className="h-full">
              <MatchCardBody
                stage={stage}
                row={matches[i]}
                teamsMap={teamsMap}
                matchesMap={matchesMap}
                crown={i === 3}
                onSetWinner={onSetWinner}
                onStartGame={onStartGame}
                onOpenMatch={onOpenMatch}
              />
            </Frame>
          </div>
        ))}
      </div>
    </div>
  );
}