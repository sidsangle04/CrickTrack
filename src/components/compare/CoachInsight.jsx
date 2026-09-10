import React from 'react';
import { Lightbulb } from 'lucide-react';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function CoachInsight({ h2h, batterName, bowlerName }) {
  const { verdict, wickets } = h2h;
  const sr = h2h.strikeRate.toFixed(1);
  const econ = h2h.economy.toFixed(2);
  const boundaries = h2h.fours + h2h.sixes;

  let headline, body, tip;

  if (verdict === 'batter') {
    headline = `${batterName} has outsmarted ${bowlerName} so far`;
    body = `${batterName} has taken the duel by the scruff — ${h2h.runsBat} runs off ${h2h.ballsFaced} balls at a strike rate of ${sr}${boundaries > 0 ? `, including ${plural(boundaries, 'boundary')}` : ''}${wickets === 0 ? `, without ever being dismissed` : `, and although ${bowlerName} has had him ${wickets} time${wickets === 1 ? '' : 's'}, the run flow has stayed with the bat`}.`;
    tip = `Coach's call for ${bowlerName}: take pace off and deny ${batterName} anything on the bat — he's hurting you whenever you drop it in his zone.`;
  } else if (verdict === 'bowler') {
    headline = `${bowlerName} has outsmarted ${batterName} so far`;
    body = `${bowlerName} owns this match-up — ${wickets > 0 ? `${plural(wickets, 'dismissal')} (${h2h.wicketTypes.join(', ')}) and ` : ''}just ${h2h.conceded} runs conceded at an economy of ${econ}, squeezing ${batterName} with ${Math.round(h2h.dotPct)}% dot balls and only ${plural(boundaries, 'boundary')} leaking out.`;
    tip = `Coach's call for ${batterName}: rotate strike off ${bowlerName} early and force a field change — respect the good balls, then cash in on the one loose delivery per over.`;
  } else {
    headline = `This duel is right in the balance`;
    body = `${batterName} has ${h2h.runsBat} runs off ${h2h.ballsFaced} balls (SR ${sr}) with ${plural(boundaries, 'boundary')}, while ${bowlerName} has kept things tight with ${h2h.dots} dots (${Math.round(h2h.dotPct)}%)${wickets > 0 ? ` and ${plural(wickets, 'dismissal')}` : ' but no breakthrough yet'} — neither man has stamped authority on the other.`;
    tip = `Coach's call: whoever wins the first two balls of each over will own this match-up. Watch for ${batterName} stepping out early.`;
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-xl p-5 border border-amber-500/30">
      <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        Coach's Insight
      </h3>
      <div className="text-amber-400 font-semibold text-sm mb-2">{headline}</div>
      <p className="text-slate-300 text-sm leading-relaxed mb-3">{body}</p>
      <p className="text-slate-400 text-sm leading-relaxed italic">{tip}</p>
    </div>
  );
}