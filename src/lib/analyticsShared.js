// Shared analytics constants & labels used by Analytics and Player Profiles.
export { getTurfZone, TURF_ZONES } from './groundShape';

// A batting record only counts as an innings when the batter actually batted;
// "yet to bat" and "did not bat" rows carry no batting figures.
export const hasBatted = (b) => b?.status !== 'yet_to_bat' && b?.status !== 'did_not_bat';

export const LENGTH_ZONES_ORDER = ['full_toss', 'yorker', 'full', 'good_length', 'good', 'back_of_length', 'short', 'bouncer'];

// Normalize legacy human-readable length values to enum format
export const LENGTH_NORMALIZE = {
  'Full Toss': 'full_toss', 'Yorker': 'yorker', 'Full': 'full',
  'Good Length': 'good_length', 'Good': 'good', 'Back of Length': 'back_of_length',
  'Short': 'short', 'Bouncer': 'bouncer'
};

export const LENGTH_LABEL = {
  full_toss: 'Full Toss', yorker: 'Yorker', full: 'Full', good_length: 'Good Length',
  good: 'Good', back_of_length: 'Back of Length', short: 'Short', bouncer: 'Bouncer'
};

export const DISMISSAL_LABEL = {
  bowled: 'Bowled', caught: 'Caught', lbw: 'LBW', run_out: 'Run Out',
  stumped: 'Stumped', hit_wicket: 'Hit Wicket', retired_hurt: 'Retired Hurt',
  retired_out: 'Retired Out', obstructing_field: 'Obstructing', handled_ball: 'Handled Ball'
};

export const DISMISSAL_COLOR = {
  bowled: 'text-red-400', caught: 'text-orange-400', lbw: 'text-amber-400',
  run_out: 'text-purple-400', stumped: 'text-pink-400',
};

export const RUN_FILTERS = [
  { key: 'all', label: 'All' },
  { key: '0', label: '0' }, { key: '1', label: '1' },
  { key: '2', label: '2' }, { key: '3', label: '3' },
  { key: '4', label: '4' }, { key: '6', label: '6' },
  { key: 'W', label: 'W' },
];