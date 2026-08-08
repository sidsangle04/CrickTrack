import React, { useState, useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';

const VIDEO_URL = 'https://media.base44.com/videos/public/69cd6e7dda99287bd2ab65f2/23ed60f74_generate_the_video_in_for.mov';
const STORAGE_KEY = 'cricketscore_intro_played';
const MAX_DURATION = 6000;

export default function SplashVideo() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef(null);
  const dismissedRef = useRef(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setVisible(false);
    } catch (e) { /* ignore */ }
  }, []);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setFading(true);
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* ignore */ }
    setTimeout(() => setVisible(false), 600);
  };

  // Fallback: auto-dismiss after MAX_DURATION even if the video never fires onEnded
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, MAX_DURATION);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-600 ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      {videoOk && (
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          muted
          playsInline
          onEnded={dismiss}
          onError={() => setVideoOk(false)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/80 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none animate-pulse">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">CricketScore</h1>
        <p className="text-xs text-emerald-300/90 tracking-widest uppercase">Pro Scoring Engine</p>
      </div>

      <button
        onClick={dismiss}
        className="absolute bottom-8 right-8 z-20 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-sm font-medium transition-colors"
      >
        Skip Intro
      </button>
    </div>
  );
}