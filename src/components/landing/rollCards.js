import LiveScorePanel from '@/components/landing/panels/LiveScorePanel';
import WagonWheelPanel from '@/components/landing/panels/WagonWheelPanel';
import PitchMapPanel from '@/components/landing/panels/PitchMapPanel';
import WormGraphPanel from '@/components/landing/panels/WormGraphPanel';
import LeaderboardPanel from '@/components/landing/panels/LeaderboardPanel';

const MATCH_DAY =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/fdf707174_generated_image.png';
const ON_THE_PITCH =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/56ad59c8f_generated_image.png';
const CLUB_CRICKET =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/187d9d4f8_generated_image.png';

/**
 * The cards that ride the landing-page photo roll: real CrickTrack views
 * rendered live, mixed with cricket photography.
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
    caption: 'Every scoring shot mapped by zone.',
    Panel: WagonWheelPanel,
  },
  {
    key: 'pitch-map',
    label: 'Pitch map',
    caption: 'Where each delivery landed and what it did.',
    Panel: PitchMapPanel,
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
    caption: 'Both innings compared over by over.',
    Panel: WormGraphPanel,
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