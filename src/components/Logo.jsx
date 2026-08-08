import React from 'react';

const LOGO_URL = 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/5e437ca62_TURFCricketLogo.png';

export default function Logo({ className = 'w-10 h-10' }) {
  return (
    <img
      src={LOGO_URL}
      alt="TURF Cricket"
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}