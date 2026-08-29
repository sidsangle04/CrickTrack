import React, { createContext, useContext, useState, useCallback } from 'react';

const GroundShapeContext = createContext();
const STORAGE_KEY = 'turf_ground_shape';

export function GroundShapeProvider({ children }) {
  const [groundShape, setShape] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'circular' ? 'circular' : 'rectangular';
    } catch {
      return 'rectangular';
    }
  });

  const setGroundShape = useCallback((s) => {
    setShape(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <GroundShapeContext.Provider value={{ groundShape, setGroundShape }}>
      {children}
    </GroundShapeContext.Provider>
  );
}

export function useGroundShape() {
  const ctx = useContext(GroundShapeContext);
  if (!ctx) return { groundShape: 'rectangular', setGroundShape: () => {} };
  return ctx;
}