import React, { useRef, useState } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

// Lightweight pull-to-refresh: a drag downwards while the page is already at the
// top reveals an indicator, and releasing past the threshold triggers a refetch.
const THRESHOLD = 70;
const MAX_PULL = 110;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(null);

  const handleTouchStart = (e) => {
    if (refreshing) return;
    startYRef.current = window.scrollY <= 0 ? e.touches[0].clientY : null;
  };

  const handleTouchMove = (e) => {
    if (startYRef.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPull(Math.min(delta * 0.5, MAX_PULL));
    } else {
      setPull(0);
    }
  };

  const handleTouchEnd = async () => {
    if (refreshing) return;
    startYRef.current = null;
    if (pull < THRESHOLD) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(THRESHOLD);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  const ready = pull >= THRESHOLD;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div
        className="flex items-end justify-center overflow-hidden text-slate-400"
        style={{ height: pull, transition: pull === 0 ? 'height 200ms ease-out' : 'none' }}
      >
        <div className="pb-2 flex items-center gap-2 text-xs">
          {refreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span className="text-emerald-400 font-medium">Refreshing…</span>
            </>
          ) : (
            <>
              <ArrowDown
                className={`w-4 h-4 transition-transform ${ready ? 'text-emerald-400 rotate-180' : ''}`}
              />
              <span className={ready ? 'text-emerald-400 font-medium' : ''}>
                {ready ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}