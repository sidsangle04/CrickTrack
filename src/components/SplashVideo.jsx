import React, { useState, useEffect, useRef } from 'react';
import { Trophy, ChevronRight } from 'lucide-react';

const VIDEO_URL = 'https://media.base44.com/videos/public/69cd6e7dda99287bd2ab65f2/23ed60f74_generate_the_video_in_for.mov';

export default function SplashVideo() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);
  const [videoOk, setVideoOk] = useState(true);
  const dismissedRef = useRef(false);

  const dismiss = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setFading(true);
    setTimeout(() => setVisible(false), 600);
  };

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black cursor-pointer transition-opacity duration-600 ${fading ? 'opacity-0' : 'opacity-100'} ${ready ? 'opacity-100' : 'opacity-0'}`}
    >
      {videoOk && (
        <video
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setReady(true)}
          onLoadedData={() => setReady(true)}
          onError={() => { setVideoOk(false); setReady(true); }}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-3 pointer-events-none">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">CricketScore</h1>
        <p className="text-xs text-emerald-300/90 tracking-widest uppercase">Pro Scoring Engine</p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-sm font-medium transition-colors animate-pulse"
      >
        Tap to Enter <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}