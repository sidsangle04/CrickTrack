import React from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

export default function Logo({ className = 'w-10 h-10' }) {
  return (
    <img
      src={LOGO_URL}
      alt="CrickTrack"
      className={`object-contain bg-slate-950 rounded-lg p-1 ${className}`}
      draggable={false}
    />
  );
}