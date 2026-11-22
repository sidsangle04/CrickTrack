import confetti from 'canvas-confetti';

// A sale above this price is celebrated with a full fireworks display instead
// of the short burst.
export const BIG_SALE_THRESHOLD = 200;

const palette = (teamColor) =>
  [teamColor, '#10b981', '#f59e0b', '#ffffff', '#38bdf8', '#f472b6'].filter(Boolean);

// Short two-stage cracker burst — the usual celebration for a sale.
function shortBurst(colors) {
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

// Crackers going off all over the screen for a few seconds, with side cannons.
function bigCelebration(colors) {
  const until = Date.now() + 3200;

  const burst = () => {
    confetti({
      particleCount: 70 + Math.random() * 70,
      spread: 360,
      startVelocity: 28 + Math.random() * 26,
      ticks: 95,
      gravity: 0.9,
      scalar: 0.9 + Math.random() * 0.5,
      origin: { x: Math.random(), y: Math.random() * 0.6 },
      colors,
      zIndex: 9999
    });
    if (Date.now() < until) setTimeout(burst, 190);
  };
  burst();

  const cannons = setInterval(() => {
    confetti({ particleCount: 45, angle: 60, spread: 70, startVelocity: 60, origin: { x: 0, y: 0.85 }, colors, zIndex: 9999 });
    confetti({ particleCount: 45, angle: 120, spread: 70, startVelocity: 60, origin: { x: 1, y: 0.85 }, colors, zIndex: 9999 });
    if (Date.now() > until) clearInterval(cannons);
  }, 320);
}

// Fires the celebration for a sold player. The buying team's colour leads the
// palette, and anything sold above the threshold gets the big display.
export function celebrateSale(price, teamColor) {
  if (typeof window === 'undefined') return;
  const colors = palette(teamColor);
  if (Number(price) > BIG_SALE_THRESHOLD) {
    bigCelebration(colors);
    return;
  }
  shortBurst(colors);
}