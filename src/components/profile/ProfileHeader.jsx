import React from 'react';

const ROLE_LABEL = { batsman: 'Batsman', bowler: 'Bowler', all_rounder: 'All-Rounder', wicket_keeper: 'Wicket Keeper' };
const BOWLING_LABEL = {
  right_arm_fast: 'Right Arm Fast', right_arm_medium: 'Right Arm Medium',
  right_arm_off_spin: 'Right Arm Off Spin', right_arm_leg_spin: 'Right Arm Leg Spin',
  left_arm_fast: 'Left Arm Fast', left_arm_medium: 'Left Arm Medium',
  left_arm_orthodox: 'Left Arm Orthodox', left_arm_chinaman: 'Left Arm Chinaman',
};

export default function ProfileHeader({ player, team, matchCount }) {
  const initials = (player?.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const bowling = player?.bowling_style && player.bowling_style !== 'none' ? BOWLING_LABEL[player.bowling_style] : null;

  return (
    <div className="mb-6 bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 border border-emerald-500/40 flex items-center justify-center text-xl font-bold text-emerald-400 flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{player?.name}</h1>
            {player?.is_captain && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/40 text-[10px] font-semibold">CAPTAIN</span>
            )}
            {player?.is_wicket_keeper && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/40 text-[10px] font-semibold">KEEPER</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-slate-400">
            {team && <span className="font-medium" style={{ color: team.primary_color || undefined }}>{team.name}</span>}
            {player?.role && <span>• {ROLE_LABEL[player.role] || player.role}</span>}
            {player?.jersey_number != null && <span>• #{player.jersey_number}</span>}
          </div>
          <div className="flex gap-2 mt-1 text-xs text-slate-500 flex-wrap">
            <span>{player?.batting_style === 'left_hand' ? 'Left-hand bat' : 'Right-hand bat'}</span>
            {bowling && <span>• {bowling}</span>}
            <span>• {matchCount} match{matchCount === 1 ? '' : 'es'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}