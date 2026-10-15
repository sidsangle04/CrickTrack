import React from 'react';
import { Medal, FileText } from 'lucide-react';

const times = (n) => (n === 1 ? 'once' : `${n} times`);

function Verdict({ headline, body, share, playerA, playerB }) {
  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-xl p-5 border border-amber-500/30">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Medal className="w-4 h-4 text-amber-400" />
        Head-to-Head Verdict
      </h3>
      <div className="text-amber-400 font-semibold text-sm mb-2">{headline}</div>
      <p className="text-slate-300 text-sm leading-relaxed flex items-start gap-2">
        <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
        <span>{body}</span>
      </p>
      {share != null && (
        <>
          <div className="relative h-3 rounded-full overflow-hidden bg-rose-500/70 mt-4">
            <div
              className="absolute inset-y-0 left-0 bg-emerald-500/80 transition-all duration-500"
              style={{ width: `${share}%` }}
            />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70" />
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium">
            <span className="text-emerald-400">{playerA.name} · {share}%</span>
            <span className="text-rose-400">{playerB.name} · {100 - share}%</span>
          </div>
        </>
      )}
    </div>
  );
}

export default function HeadToHeadVerdict({ h2h, playerA, playerB }) {
  const {
    hasDuel, duelShareA, duelEven, sharedCount, withBallByBall,
    aVsB, bVsA, sharedA, sharedB,
  } = h2h;

  if (sharedCount === 0) {
    return (
      <Verdict
        headline="They have not met yet"
        body={`${playerA.name} and ${playerB.name} have not appeared in the same match in this mode, so there is no record against each other to judge. Score or import a game between their teams and this section fills in.`}
        playerA={playerA}
        playerB={playerB}
      />
    );
  }

  const sharedLine =
    `In the ${sharedCount} match${sharedCount === 1 ? '' : 'es'} they have both played, ` +
    `${playerA.name} has ${sharedA.runs} run${sharedA.runs === 1 ? '' : 's'}` +
    `${sharedA.wickets > 0 ? ` and ${sharedA.wickets} wicket${sharedA.wickets === 1 ? '' : 's'}` : ''}, ` +
    `while ${playerB.name} has ${sharedB.runs} run${sharedB.runs === 1 ? '' : 's'}` +
    `${sharedB.wickets > 0 ? ` and ${sharedB.wickets} wicket${sharedB.wickets === 1 ? '' : 's'}` : ''}.`;

  if (!hasDuel) {
    return (
      <Verdict
        headline="No direct record between them yet"
        body={
          `They have shared ${sharedCount} match${sharedCount === 1 ? '' : 'es'}, but ` +
          `${withBallByBall === 0 ? 'none of them carry' : 'only some of them carry'} ball-by-ball data, ` +
          `so a batter-versus-bowler record cannot be built. ${sharedLine} ` +
          `Import a full delivery-by-delivery scorecard to unlock the duel.`
        }
        playerA={playerA}
        playerB={playerB}
      />
    );
  }

  const pct = Math.round(duelShareA);
  const gap = Math.abs(pct - (100 - pct));

  const direct = [];
  if (aVsB.deliveries > 0) {
    direct.push(
      `${playerA.name} has made ${aVsB.runs} run${aVsB.runs === 1 ? '' : 's'} off ${aVsB.balls} ball${aVsB.balls === 1 ? '' : 's'} ` +
      `from ${playerB.name} at a strike rate of ${aVsB.strikeRate.toFixed(1)}` +
      (aVsB.dismissals > 0
        ? `, falling ${times(aVsB.dismissals)} (${aVsB.dismissalTypes.join(', ')}).`
        : `, and is yet to be dismissed by him.`)
    );
  }
  if (bVsA.deliveries > 0) {
    direct.push(
      `${playerB.name} has made ${bVsA.runs} run${bVsA.runs === 1 ? '' : 's'} off ${bVsA.balls} ball${bVsA.balls === 1 ? '' : 's'} ` +
      `from ${playerA.name} at a strike rate of ${bVsA.strikeRate.toFixed(1)}` +
      (bVsA.dismissals > 0
        ? `, falling ${times(bVsA.dismissals)} (${bVsA.dismissalTypes.join(', ')}).`
        : `, and is yet to be dismissed by him.`)
    );
  }

  if (duelEven) {
    return (
      <Verdict
        headline="No upper hand — they are level"
        share={pct}
        playerA={playerA}
        playerB={playerB}
        body={
          `Head to head this reads ${pct}%–${100 - pct}%, a gap of just ${gap} points. ` +
          `That sits inside the five-point band, so neither man holds a real upper hand. ` +
          `${direct.join(' ')} ${sharedLine} The duel is genuinely open.`
        }
      />
    );
  }

  const leader = duelShareA > 50 ? playerA : playerB;
  const trailer = duelShareA > 50 ? playerB : playerA;

  return (
    <Verdict
      headline={`${leader.name} holds the upper hand in this match-up`}
      share={pct}
      playerA={playerA}
      playerB={playerB}
      body={
        `Head to head it is ${pct}%–${100 - pct}%, a ${gap}-point edge to ${leader.name} — ` +
        `past the five-point band, so this one has a clear leader. ${direct.join(' ')} ` +
        `${sharedLine} ${trailer.name} needs a big performance in the next meeting to pull it back.`
      }
    />
  );
}