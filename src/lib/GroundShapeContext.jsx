import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const GroundShapeContext = createContext();
const STORAGE_KEY = 'turf_app_mode';

// Canonical app mode: 'turf' (rectangular ground) or 'circular'.
// null means the user has not yet chosen a mode at launch.
// groundShape is derived for the ground-map components (kept 'rectangular'/'circular').
export function GroundShapeProvider({ children }) {
  const [mode, setModeState] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'circular' || v === 'turf' ? v : null;
    } catch {
      return null;
    }
  });

  const setMode = useCallback((m) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      /* ignore */
    }
  }, []);

  const clearMode = useCallback(() => {
    setModeState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const groundShape = mode === 'circular' ? 'circular' : 'rectangular';
  const isReady = !!mode;

  const value = useMemo(
    () => ({ mode, groundShape, setMode, clearMode, isReady }),
    [mode, groundShape, setMode, clearMode, isReady]
  );

  return (
    <GroundShapeContext.Provider value={value}>
      {children}
    </GroundShapeContext.Provider>
  );
}

export function useGroundShape() {
  const ctx = useContext(GroundShapeContext);
  if (!ctx) {
    return { mode: null, groundShape: 'rectangular', setMode: () => {}, clearMode: () => {}, isReady: false };
  }
  return ctx;
}