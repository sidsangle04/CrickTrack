import confetti from 'canvas-confetti';

// A short two-stage cracker burst when a player is sold. The buying team's
// colour leads the palette so the celebration reads as that team's moment.
export function celebrateSale(teamColor) {
  if (typeof window === 'undefined') return;
  const colors = [teamColor, '#10b981', '#f59e0b', '#ffffff'].filter(Boolean);

  confetti({
    particleCount: 140,
    spread: 75,
    startVelocity: 48,
    origin: { x: 0.5, y: 0.65 },
    colors,
    zIndex: 9999
  });

  setTimeout(() => {
    confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, zIndex: 9999 });
    confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, zIndex: 9999 });
  }, 220);
}