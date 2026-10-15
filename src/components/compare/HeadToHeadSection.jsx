import React from 'react';
import { Swords, Database } from 'lucide-react';

const Stat = ({ label, value }) => (
  <div>
    <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
    <div className="text-lg font-bold text-white">{value}</div>
  </div>
);

const GroupLabel = ({ children }) => (
  <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">{children}</div>
);

export default function HeadToHeadSection({ h2h, playerA, playerB }) {
  const { aVsB, bVsA, sharedA, sharedB, sharedCount, withBallByBall, duelMatches, hasDuel } = h2h;

  return (
    <div className="mb-6">
      <div className="mb-4 text-center text-sm font-medium text-cyan-400">
        Head-to-Head · record against each other
      </div>

      {/* Coverage of the head-to-head record */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4 flex items-start gap-3">
        <Database className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="text-white font-semibold">{sharedCount}</span> match
          {sharedCount === 1 ? '' : 'es'} played together ·{' '}
          <span className="text-white font-semibold">{withBallByBall}</span> with ball-by-ball data ·{' '}
          <span className="text-white font-semibold">{duelMatches}</span> where one bowled to the other.
          {' '}Scorecards with only totals cannot add delivery-level figures.
        </p>
      </div>

      {hasDuel ? (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
            <h4 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2 text-sm">
              <Swords className="w-4 h-4" />
              {playerA.name} vs {playerB.name}
            </h4>
            {aVsB.deliveries > 0 && (
              <div className={bVsA.deliveries > 0 ? 'mb-4' : ''}>
                <GroupLabel>{playerA.name} with the bat</GroupLabel>
                <div className="grid grid-cols-4 gap-3">
                  <Stat label="Runs" value={aVsB.runs} />
                  <Stat label="Balls" value={aVsB.balls} />
                  <Stat label="S/R" value={aVsB.strikeRate.toFixed(1)} />
                  <Stat label="Out" value={aVsB.dismissals} />
                </div>
              </div>
            )}
            {bVsA.deliveries > 0 && (
              <div>
                <GroupLabel>{playerA.name} with the ball</GroupLabel>
                <div className="grid grid-cols-4 gap-3">
                  <Stat label="Wkts" value={bVsA.dismissals} />
                  <Stat label="Econ" value={bVsA.economy.toFixed(2)} />
                  <Stat label="Dots" value={bVsA.dots} />
                  <Stat label="Runs" value={bVsA.conceded} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-5">
            <h4 className="font-semibold text-rose-400 mb-4 flex items-center gap-2 text-sm">
              <Swords className="w-4 h-4" />
              {playerB.name} vs {playerA.name}
            </h4>
            {bVsA.deliveries > 0 && (
              <div className={aVsB.deliveries > 0 ? 'mb-4' : ''}>
                <GroupLabel>{playerB.name} with the bat</GroupLabel>
                <div className="grid grid-cols-4 gap-3">
                  <Stat label="Runs" value={bVsA.runs} />
                  <Stat label="Balls" value={bVsA.balls} />
                  <Stat label="S/R" value={bVsA.strikeRate.toFixed(1)} />
                  <Stat label="Out" value={bVsA.dismissals} />
                </div>
              </div>
            )}
            {aVsB.deliveries > 0 && (
              <div>
                <GroupLabel>{playerB.name} with the ball</GroupLabel>
                <div className="grid grid-cols-4 gap-3">
                  <Stat label="Wkts" value={aVsB.dismissals} />
                  <Stat label="Econ" value={aVsB.economy.toFixed(2)} />
                  <Stat label="Dots" value={aVsB.dots} />
                  <Stat label="Runs" value={aVsB.conceded} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 mb-4 text-sm text-slate-400">
          No delivery-level record between these two yet, so a direct batter-versus-bowler duel
          cannot be built. Their output in the matches they both played is below.
        </div>
      )}

      {/* Each player's output in the matches they both played */}
      <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
        <h4 className="font-semibold text-white mb-4 text-sm">In the matches they both played</h4>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="text-xs font-semibold text-emerald-400 mb-3">{playerA.name}</div>
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Runs" value={sharedA.runs} />
              <Stat label="S/R" value={sharedA.strikeRate.toFixed(1)} />
              <Stat label="Wkts" value={sharedA.wickets} />
              <Stat label="Econ" value={sharedA.economy.toFixed(2)} />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-400 mb-3">{playerB.name}</div>
            <div className="grid grid-cols-4 gap-3">
              <Stat label="Runs" value={sharedB.runs} />
              <Stat label="S/R" value={sharedB.strikeRate.toFixed(1)} />
              <Stat label="Wkts" value={sharedB.wickets} />
              <Stat label="Econ" value={sharedB.economy.toFixed(2)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}