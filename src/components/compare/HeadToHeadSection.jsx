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

const countLabel = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// The batter's side of the duel. Runs and balls need ball-by-ball data; the
// wickets still show from the scorecard when there is none.
function BattingGroup({ label, opponent, data }) {
  return (
    <div>
      <GroupLabel>{label}</GroupLabel>
      {data.deliveries > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Runs" value={data.runs} />
          <Stat label="Balls" value={data.balls} />
          <Stat label="S/R" value={data.strikeRate.toFixed(1)} />
          <Stat label="Out" value={data.dismissals} />
        </div>
      ) : (
        <p className="text-xs text-slate-400 leading-relaxed">
          Dismissed {data.dismissals === 1 ? 'once' : `${data.dismissals} times`} by {opponent}
          {' '}({data.dismissalTypes.join(', ')}). Runs off that bowling need ball-by-ball data.
        </p>
      )}
    </div>
  );
}

function BowlingGroup({ label, data }) {
  return (
    <div>
      <GroupLabel>{label}</GroupLabel>
      {data.deliveries > 0 ? (
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Wkts" value={data.dismissals} />
          <Stat label="Econ" value={data.economy.toFixed(2)} />
          <Stat label="Dots" value={data.dots} />
          <Stat label="Runs" value={data.conceded} />
        </div>
      ) : (
        <p className="text-xs text-slate-400 leading-relaxed">
          Took {countLabel(data.dismissals, 'wicket')} ({data.dismissalTypes.join(', ')}).
          {' '}Economy needs ball-by-ball data.
        </p>
      )}
    </div>
  );
}

function DuelCard({ borderClass, titleClass, title, batting, bowling, batterName, bowlerName }) {
  const hasBatting = batting.deliveries > 0 || batting.dismissals > 0;
  const hasBowling = bowling.deliveries > 0 || bowling.dismissals > 0;

  return (
    <div className={`${borderClass} rounded-xl p-5`}>
      <h4 className={`font-semibold mb-4 flex items-center gap-2 text-sm ${titleClass}`}>
        <Swords className="w-4 h-4" />
        {title}
      </h4>
      {hasBatting && (
        <div className={hasBowling ? 'mb-4' : ''}>
          <BattingGroup label={`${batterName} with the bat`} opponent={bowlerName} data={batting} />
        </div>
      )}
      {hasBowling && <BowlingGroup label={`${batterName} with the ball`} data={bowling} />}
    </div>
  );
}

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
          {' '}Wickets come from the scorecard; runs off a bowler need ball-by-ball data.
        </p>
      </div>

      {hasDuel ? (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <DuelCard
            borderClass="bg-emerald-500/10 border border-emerald-500/30"
            titleClass="text-emerald-400"
            title={`${playerA.name} vs ${playerB.name}`}
            batterName={playerA.name}
            bowlerName={playerB.name}
            batting={aVsB}
            bowling={bVsA}
          />
          <DuelCard
            borderClass="bg-rose-500/10 border border-rose-500/30"
            titleClass="text-rose-400"
            title={`${playerB.name} vs ${playerA.name}`}
            batterName={playerB.name}
            bowlerName={playerA.name}
            batting={bVsA}
            bowling={aVsB}
          />
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 mb-4 text-sm text-slate-400">
          Neither has bowled to the other yet, so there is no direct duel to show. Their output in
          the matches they both played is below.
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