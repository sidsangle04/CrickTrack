import React from 'react';

export function initials(name = '') {
  return (
    String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  );
}

// Readable text on any team colour.
export function contrastText(hex = '#10b981') {
  const raw = String(hex || '#10b981').replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#0f172a' : '#ffffff';
}

const BADGE_SIZES = {
  sm: 'w-8 h-8 text-[11px] rounded-lg',
  md: 'w-11 h-11 text-sm rounded-xl',
  lg: 'w-16 h-16 text-lg rounded-2xl',
  xl: 'w-24 h-24 text-2xl rounded-2xl'
};

export function TeamBadge({ team, size = 'md', className = '' }) {
  const color = team?.color || '#10b981';
  return (
    <div
      className={`${BADGE_SIZES[size] || BADGE_SIZES.md} shrink-0 overflow-hidden flex items-center justify-center font-bold ${className}`}
      style={{ backgroundColor: color, color: contrastText(color) }}
      title={team?.name}
    >
      {team?.logo_url ? (
        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
      ) : (
        initials(team?.name)
      )}
    </div>
  );
}

const AVATAR_SIZES = {
  sm: 'w-10 h-10 text-xs rounded-lg',
  md: 'w-14 h-14 text-base rounded-xl',
  lg: 'w-24 h-24 text-2xl rounded-2xl',
  xl: 'w-40 h-40 text-4xl rounded-2xl',
  hero: 'w-52 h-52 sm:w-64 sm:h-64 text-6xl rounded-3xl'
};

export function PlayerAvatar({ player, size = 'md', className = '' }) {
  const cls = AVATAR_SIZES[size] || AVATAR_SIZES.md;
  if (player?.photo_url) {
    return (
      <img
        src={player.photo_url}
        alt={player.name}
        className={`${cls} shrink-0 object-cover bg-slate-800 ${className}`}
      />
    );
  }
  return (
    <div
      className={`${cls} shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-300 ${className}`}
    >
      {initials(player?.name)}
    </div>
  );
}

export const ROLE_LABELS = {
  batsman: 'Batsman',
  bowler: 'Bowler',
  all_rounder: 'All-rounder',
  wicket_keeper: 'Wicket keeper'
};

export const BOWLING_LABELS = {
  right_arm_fast: 'Right arm fast',
  right_arm_medium: 'Right arm medium',
  right_arm_off_spin: 'Right arm off spin',
  right_arm_leg_spin: 'Right arm leg spin',
  left_arm_fast: 'Left arm fast',
  left_arm_medium: 'Left arm medium',
  left_arm_orthodox: 'Left arm orthodox',
  left_arm_chinaman: 'Left arm chinaman',
  none: 'Does not bowl'
};

export const CATEGORY_LABELS = {
  icon: 'Icon',
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze'
};

const CATEGORY_STYLES = {
  icon: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  platinum: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  gold: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  silver: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  bronze: 'bg-pink-500/20 text-pink-300 border-pink-500/40'
};

export function CategoryBadge({ category }) {
  const key = category || 'gold';
  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wide ${
        CATEGORY_STYLES[key] || CATEGORY_STYLES.gold
      }`}
    >
      {CATEGORY_LABELS[key] || key}
    </span>
  );
}

export function Panel({ title, action, children, className = '' }) {
  return (
    <section
      className={`rounded-2xl bg-slate-800/50 border border-slate-700/60 p-4 sm:p-5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 mb-4">
          {title && (
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Money({ value }) {
  return <span className="tabular-nums">{Number(value) || 0}</span>;
}