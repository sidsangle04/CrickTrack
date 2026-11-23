import React from 'react';
import { Frame, MatchCardBody, SeedBoxBody } from './roadToFinal/Card';

const LINE = '#10b981';
const W = 1000;
const H = 430;

// Fixed coordinate space: the cards and the connector lines share it, so the
// arrows always land exactly on the boxes they feed.
const SEEDS = [
  { place: '1st', left: 0, top: 50 },
  { place: '2nd', left: 0, top: 120 },
  { place: '3rd', left: 0, top: 286 },
  { place: '4th', left: 0, top: 356 },
];
const CARD_POS = [
  { left: 230, top: 64, width: 200, height: 96 },
  { left: 230, top: 300, width: 200, height: 96 },
  { left: 520, top: 200, width: 200, height: 96 },
  { left: 790, top: 150, width: 210, height: 112 },
];

function Label({ x, y, children }) {
  return (
    <text x={x} y={y} fill="#34d399" fontSize="9" letterSpacing="1">
      {children}
    </text>
  );
}

export default function RoadToFinalDiagram({
  seeds = [],
  matches = [],
  teamsMap = {},
  matchesMap = {},
  onSetWinner,
  onStartGame,
  onOpenMatch,
  stages,
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          fill="none"
        >
          <defs>
            <marker
              id="rtf-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" fill={LINE} />
            </marker>
          </defs>

          {/* 1st + 2nd -> Qualifier 1 */}
          <path d="M170,71 H200 V141 H170" stroke={LINE} strokeOpacity="0.6" strokeWidth="1.2" />
          <path d="M200,112 H230" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow)" />

          {/* 3rd + 4th -> Eliminator */}
          <path d="M170,307 H200 V377 H170" stroke={LINE} strokeOpacity="0.6" strokeWidth="1.2" />
          <path d="M200,348 H230" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow)" />

          {/* Loser of Q1 -> Qualifier 2 */}
          <path d="M330,160 V226 H520" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow)" />
          <Label x={336} y={216}>LOSER Q1</Label>

          {/* Winner of Eliminator -> Qualifier 2 */}
          <path d="M430,348 H475 V270 H520" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow)" />
          <Label x={436} y={366}>WINNER ELIMINATOR</Label>

          {/* Winner of Q1 -> Final */}
          <path d="M430,112 H470 V180 H790" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow)" />
          <Label x={560} y={172}>WINNER Q1</Label>

          {/* Winner of Q2 -> Final */}
          <path d="M720,248 H755 V232 H790" stroke={LINE} strokeWidth="1.2" markerEnd="url(#rtf-arrow)" />
        </svg>

        {SEEDS.map((s, i) => (
          <div
            key={s.place}
            className="absolute"
            style={{ left: s.left, top: s.top, width: 170, height: 42 }}
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