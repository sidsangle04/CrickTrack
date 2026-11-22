import React, { useRef, useState } from 'react';
import { Music, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AUCTION_MUSIC_URL } from '@/lib/auction/music';

// Compact play/pause control for the auction background music. The track stays
// silent until the auctioneer starts it.
export default function AuctionMusicToggle() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.volume = volume;
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  const changeVolume = (value) => {
    const next = Number(value);
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  };

  return (
    <>
      <audio ref={audioRef} src={AUCTION_MUSIC_URL} loop preload="none" />
      <Button
        variant="outline"
        size="sm"
        onClick={toggle}
        title={playing ? 'Pause background music' : 'Play background music'}
        className={
          playing
            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
            : 'border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800'
        }
      >
        {playing ? <Music className="w-4 h-4 mr-1.5" /> : <VolumeX className="w-4 h-4 mr-1.5" />}
        {playing ? 'Music on' : 'Music off'}
      </Button>
      {playing && (
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