import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

const VIDEO_URL = 'https://media.base44.com/videos/public/69cd6e7dda99287bd2ab65f2/5b8b229ba_CrickTrackfinalintro.mov';

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

      <button
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white text-sm font-medium transition-colors animate-pulse"
      >
        Tap to Enter <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}