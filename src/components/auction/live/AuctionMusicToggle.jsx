import React, { useEffect, useRef, useState } from 'react';
import { Music, PartyPopper, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AUCTION_SOUL_URL, AUCTION_HYPE_URL } from '@/lib/auction/music';

const DEFAULT_VOLUME = 0.35;

// Auction background music. The soulful track plays while bidding is open; once a
// player is sold the celebration track loops until the next player is brought in,
// then the soulful track picks up where it left off.
export default function AuctionMusicToggle({ celebrating = false }) {
  const soulRef = useRef(null);
  const hypeRef = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  // Follow the auction state: swap tracks, and stay silent while music is off.
  useEffect(() => {
    const soul = soulRef.current;
    const hype = hypeRef.current;
    if (!soul || !hype) return;

    const active = celebrating ? hype : soul;
    const idle = celebrating ? soul : hype;

    idle.pause();
    if (!celebrating) hype.currentTime = 0;

    if (!enabled || !active.paused) return;
    active.volume = volume;
    if (celebrating) active.currentTime = 0;
    active.play().catch(() => setEnabled(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrating, enabled]);

  const toggle = () => {
    const next = !enabled;
    const active = celebrating ? hypeRef.current : soulRef.current;
    const idle = celebrating ? soulRef.current : hypeRef.current;
    setEnabled(next);
    if (!active) return;
    if (next) {
      idle?.pause();
      active.volume = volume;
      active.play().catch(() => setEnabled(false));
    } else {
      active.pause();
      idle?.pause();
    }
  };

  const changeVolume = (value) => {
    const next = Number(value);
    setVolume(next);
    if (soulRef.current) soulRef.current.volume = next;
    if (hypeRef.current) hypeRef.current.volume = next;
  };

  const label = !enabled ? 'Music off' : celebrating ? 'Celebration' : 'Music on';
  const Icon = !enabled ? VolumeX : celebrating ? PartyPopper : Music;

  return (
    <>
      <audio ref={soulRef} src={AUCTION_SOUL_URL} loop preload="none" />
      <audio ref={hypeRef} src={AUCTION_HYPE_URL} loop preload="none" />
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        title={enabled ? 'Pause background music' : 'Play background music'}
        className={
          enabled
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
            : 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
        }
      >
        <Icon className="w-4 h-4 mr-1.5" />
        {label}
      </Button>
      {enabled && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => changeVolume(e.target.value)}
          aria-label="Music volume"
          className="hidden sm:block w-20 accent-emerald-500"
        />
      )}
    </>
  );
}