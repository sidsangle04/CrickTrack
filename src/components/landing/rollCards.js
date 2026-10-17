import LiveScorePanel from '@/components/landing/panels/LiveScorePanel';
import LeaderboardPanel from '@/components/landing/panels/LeaderboardPanel';

const MATCH_DAY =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/fdf707174_generated_image.png';
const ON_THE_PITCH =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/56ad59c8f_generated_image.png';
const CLUB_CRICKET =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/187d9d4f8_generated_image.png';

// Screenshots of the real CrickTrack app screens.
const WAGON_WHEEL =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/b2d3159f4_Screenshot2026-10-17at160107.png';
const PITCH_MAP =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/4376bb8ec_Screenshot2026-10-17at160053.png';
const RUN_GRAPH =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/5c29e993a_Screenshot2026-10-17at160231.png';

/**
 * The cards that ride the landing-page photo roll: real CrickTrack views,
 * mixed with cricket photography.
 */
export const ROLL_CARDS = [
  {
    key: 'match-day',
    label: 'Match day',
    photo: MATCH_DAY,
    caption: 'Score from the boundary rope on any phone.',
  },
  {
    key: 'live-scoring',
    label: 'Live scoring',
    caption: 'Target, batting pair and this over, always on screen.',
    Panel: LiveScorePanel,
  },
  {
    key: 'wagon-wheel',
    label: 'Wagon wheel',
    photo: WAGON_WHEEL,
    contain: true,
    caption: 'Every scoring shot mapped by zone.',
  },
  {
    key: 'pitch-map',
    label: 'Pitch map',
    photo: PITCH_MAP,
    contain: true,
    caption: 'Where each delivery landed and what it did.',
  },
  {
    key: 'on-the-pitch',
    label: 'On the pitch',
    photo: ON_THE_PITCH,
    caption: 'Tag line, length and variation as the pitch wears.',
  },
  {
    key: 'run-graph',
    label: 'Run comparison',
    photo: RUN_GRAPH,
    contain: true,
    caption: 'Both innings compared over by over.',
  },
  {
    key: 'leaderboard',
    label: 'Season leaders',
    caption: 'Batting and bowling leaders across every match.',
    Panel: LeaderboardPanel,
  },
  {
    key: 'club-cricket',
    label: 'Club cricket',
    photo: CLUB_CRICKET,
    caption: 'Share the result with the squad the moment it ends.',
  },
];