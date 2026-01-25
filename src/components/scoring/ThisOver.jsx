import React from 'react';

export default function ThisOver({ deliveries = [] }) {
  const getBallDisplay = (delivery) => {
    if (delivery.is_wicket) {
      return { text: 'W', bg: 'bg-red-500', textColor: 'text-white' };
    }
    if (delivery.is_wide) {
      const runs = delivery.wide_runs + (delivery.runs_bat || 0);
      return { text: `Wd${runs > 1 ? '+' + (runs - 1) : ''}`, bg: 'bg-amber-500/20', textColor: 'text-amber-400' };
    }
    if (delivery.is_no_ball) {
      const runs = delivery.no_ball_runs + (delivery.runs_bat || 0);
      return { text: `Nb${runs > 1 ? '+' + (runs - 1) : ''}`, bg: 'bg-amber-500/20', textColor: 'text-amber-400' };
    }
    if (delivery.is_bye) {
      return { text: `B${delivery.bye_runs}`, bg: 'bg-slate-700', textColor: 'text-slate-300' };
    }
    if (delivery.is_leg_bye) {
      return { text: `Lb${delivery.leg_bye_runs}`, bg: 'bg-slate-700', textColor: 'text-slate-300' };
    }
    if (delivery.runs_bat === 0) {
      return { text: '•', bg: 'bg-slate-700', textColor: 'text-slate-400' };
    }
    if (delivery.runs_bat === 4) {
      return { text: '4', bg: 'bg-emerald-500', textColor: 'text-white' };
    }
    if (delivery.runs_bat === 6) {
      return { text: '6', bg: 'bg-purple-500', textColor: 'text-white' };
    }
    return { text: delivery.runs_bat.toString(), bg: 'bg-slate-600', textColor: 'text-white' };
  };

  return (
    <div className="px-4 py-3 bg-slate-900/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-2">This Over</span>
        <div className="flex gap-1.5 flex-wrap">
          {deliveries.length === 0 ? (
            <span className="text-xs text-slate-600">No deliveries yet</span>
          ) : (
            deliveries.map((d, i) => {
              const { text, bg, textColor } = getBallDisplay(d);
              return (
                <div 
                  key={i}
                  className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center ${textColor} text-xs font-bold`}
                >
                  {text}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}