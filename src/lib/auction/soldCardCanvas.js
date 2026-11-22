import { CATEGORY_LABELS, ROLE_LABELS, contrastText, initials } from '@/components/auction/Shared';

// Draws a sold player's card straight onto a canvas for the photo download.
// Every element is placed from measured text, so nothing can overlap, the corner
// radii and colours match the on-screen card, and the file is 3x resolution.

const W = 460;
const PAD = 38;
const INNER = W - PAD * 2;
const SCALE = 3;
const RADIUS = 24;
const ICON_SIZE = 22;
const ICON_TRACKING = 2.5;

const SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const LOGO_URL =
  'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

const CATEGORY_TONE = {
  icon: { border: 'rgba(168,85,247,0.4)', text: '#d8b4fe', fill: 'rgba(168,85,247,0.2)' },
  platinum: { border: 'rgba(59,130,246,0.4)', text: '#93c5fd', fill: 'rgba(59,130,246,0.2)' },
  gold: { border: 'rgba(245,158,11,0.4)', text: '#fcd34d', fill: 'rgba(245,158,11,0.2)' },
  silver: { border: 'rgba(100,116,139,0.4)', text: '#cbd5e1', fill: 'rgba(100,116,139,0.2)' },
  bronze: { border: 'rgba(236,72,153,0.4)', text: '#f9a8d4', fill: 'rgba(236,72,153,0.2)' },
};

const font = (weight, size) => `${weight} ${size}px ${SANS}`;

const clampAlpha = (v) => Math.min(1, Math.max(0, v));

function rgba(hex, alpha) {
  const raw = String(hex || '#10b981').replace('#', '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${clampAlpha(alpha)})`;
}

function roundPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function spacedWidth(ctx, text, spacing) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + spacing;
  return text ? w - spacing : 0;
}

function drawSpaced(ctx, text, x, y, spacing, align = 'left') {
  const w = spacedWidth(ctx, text, spacing);
  let cursor = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.save();
  ctx.textAlign = 'left';
  for (const ch of text) {
    ctx.fillText(ch, cursor, y);
    cursor += ctx.measureText(ch).width + spacing;
  }
  ctx.restore();
  return w;
}

// Cap height of the current font, so a line can be centred on its ink rather
// than on its baseline.
function ascentOf(ctx, text, size) {
  const ascent = ctx.measureText(text).actualBoundingBoxAscent;
  return Number.isFinite(ascent) && ascent > 0 ? ascent : size * 0.72;
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : ['?'];
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawImageCover(ctx, img, x, y, w, h, radius) {
  ctx.save();
  roundPath(ctx, x, y, w, h, radius);
  ctx.clip();
  const ratio = Math.max(w / img.width, h / img.height);
  const dw = img.width * ratio;
  const dh = img.height * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawGavel(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = color;
  roundPath(ctx, -size * 0.42, -size * 0.17, size * 0.84, size * 0.34, size * 0.09);
  ctx.fill();
  roundPath(ctx, -size * 0.09, size * 0.17, size * 0.18, size * 0.5, size * 0.07);
  ctx.fill();
  ctx.restore();
}

function drawTeamBadge(ctx, { img, name, x, y, size, color }) {
  const radius = size * 0.25;
  ctx.fillStyle = color;
  roundPath(ctx, x, y, size, size, radius);
  ctx.fill();
  if (img) {
    drawImageCover(ctx, img, x, y, size, size, radius);
    return;
  }
  ctx.fillStyle = contrastText(color);
  ctx.font = font(700, size * 0.28);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials(name), x + size / 2, y + size / 2 + 1);
}

export async function buildSoldCardCanvas({ player, team, price }) {
  if (!player) return null;

  const color = team?.color || '#10b981';
  const teamName = team?.name || 'Team';
  const name = player?.name || 'Player';
  const catKey = player?.category || 'gold';
  const tone = CATEGORY_TONE[catKey] || CATEGORY_TONE.gold;
  const catLabel = String(CATEGORY_LABELS[catKey] || catKey).toUpperCase();
  const roleLabel = player?.primary_role
    ? String(ROLE_LABELS[player.primary_role] || '').toUpperCase()
    : '';
  // Icon players are allocated rather than bought, so their panel names them
  // instead of showing a price of zero.
  const isIcon = !Number(price);
  const priceValue = isIcon ? 'ICON PLAYER' : String(Number(price));

  if (document.fonts?.ready) await document.fonts.ready;

  const [logoImg, photoImg, teamLogoImg] = await Promise.all([
    loadImage(LOGO_URL),
    loadImage(player?.photo_url),
    loadImage(team?.logo_url),
  ]);

  // ---- measure -------------------------------------------------------------
  const scratch = document.createElement('canvas').getContext('2d');

  scratch.font = font(900, 30);
  const nameLines = wrapLines(scratch, name, INNER - 8);

  scratch.font = font(700, 10);
  const catTextW = spacedWidth(scratch, catLabel, 0.6);
  const catPillW = catTextW + 16;
  const catPillH = 20;

  scratch.font = font(600, 11);
  const roleW = roleLabel ? spacedWidth(scratch, roleLabel, 1.1) : 0;
  const badgeRowW = catPillW + (roleW ? 8 + roleW : 0);

  scratch.font = font(600, 10);
  const soldToLabelW = spacedWidth(scratch, 'SOLD TO', 2.5);

  let teamFontSize = 19;
  scratch.font = font(700, teamFontSize);
  while (scratch.measureText(teamName).width > 200 && teamFontSize > 13) {
    teamFontSize -= 1;
    scratch.font = font(700, teamFontSize);
  }
  const teamTextW = scratch.measureText(teamName).width;
  const soldToTextW = Math.max(soldToLabelW, teamTextW);
  const soldToGroupW = 64 + 12 + soldToTextW;

  scratch.font = font(900, isIcon ? ICON_SIZE : 36);
  const priceNumW = isIcon
    ? spacedWidth(scratch, priceValue, ICON_TRACKING)
    : scratch.measureText(priceValue).width;
  scratch.font = font(700, 14);
  const coinsW = isIcon ? 0 : scratch.measureText('coins').width + 6;
  const priceGroupW = priceNumW + coinsW;

  scratch.font = font(900, 11);
  const brandW = spacedWidth(scratch, 'CRICKTRACK', 2.2);
  scratch.font = font(600, 8);
  const tagW = spacedWidth(scratch, 'TAG · ANALYSE · ELEVATE', 1.6);
  const footerTextW = Math.max(brandW, tagW);
  const footerGroupW = 24 + 8 + footerTextW;

  // ---- vertical rhythm -----------------------------------------------------
  const avatarOuter = 264;
  let y = PAD;
  // The SOLD pill sits centred between the card's top edge and the photo.
  const pillTop = y + 10;
  y += 32;
  y += 20;
  const avatarTop = y;
  y += avatarOuter;
  y += 18;
  const nameTop = y;
  y += nameLines.length * 37;
  y += 10;
  const badgeRowTop = y;
  y += catPillH;
  y += 20;
  const dividerY = y;
  y += 1;
  y += 16;
  const soldToTop = y;
  y += 64;
  y += 18;
  const priceTop = y;
  const priceH = 84;
  y += priceH;
  y += 16;
  const footerTop = y;
  const cardBottom = footerTop + 26 + 22;
  const H = cardBottom + 30;

  // ---- paint ---------------------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * SCALE);
  canvas.height = Math.round(H * SCALE);
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  const cardTop = PAD - 2;
  const cardH = cardBottom - cardTop;

  // backdrop halo
  const halo = ctx.createRadialGradient(W / 2, H * 0.34, 10, W / 2, H * 0.34, H * 0.72);
  halo.addColorStop(0, rgba(color, 0.4));
  halo.addColorStop(0.48, '#0b1220');
  halo.addColorStop(0.85, '#020617');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // extruded slab edges behind the face
  for (let i = 4; i >= 0; i -= 1) {
    const off = (i + 1) * 3;
    ctx.save();
    if (i === 4) {
      ctx.shadowColor = rgba(color, 0.65);
      ctx.shadowBlur = 34;
      ctx.shadowOffsetY = 26;
    }
    const edge = ctx.createLinearGradient(PAD, cardTop, PAD + INNER, cardTop + cardH);
    edge.addColorStop(0, color);
    edge.addColorStop(0.65, '#0b1220');
    ctx.globalAlpha = clampAlpha(0.9 - i * 0.12);
    ctx.fillStyle = edge;
    roundPath(ctx, PAD + off, cardTop + off, INNER, cardH, RADIUS);
    ctx.fill();
    ctx.restore();
  }

  // card face
  const face = ctx.createLinearGradient(PAD, cardTop, PAD + INNER * 0.7, cardTop + cardH);
  face.addColorStop(0, rgba(color, 0.25));
  face.addColorStop(0.38, '#101a2c');
  face.addColorStop(1, '#030712');
  ctx.fillStyle = face;
  roundPath(ctx, PAD, cardTop, INNER, cardH, RADIUS);
  ctx.fill();

  ctx.save();
  roundPath(ctx, PAD, cardTop, INNER, cardH, RADIUS);
  ctx.clip();

  // colour wash from the winning team
  const wash = ctx.createRadialGradient(W / 2, cardTop, 8, W / 2, cardTop, 240);
  wash.addColorStop(0, rgba(color, 0.5));
  wash.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = wash;
  ctx.fillRect(PAD, cardTop, INNER, 240);

  // top gloss
  const gloss = ctx.createLinearGradient(0, cardTop, 0, cardTop + cardH * 0.42);
  gloss.addColorStop(0, 'rgba(255,255,255,0.16)');
  gloss.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(PAD, cardTop, INNER, cardH * 0.42);

  // sweeping shine
  const shine = ctx.createLinearGradient(PAD, cardTop, PAD + INNER, cardTop + cardH);
  shine.addColorStop(0.3, 'rgba(255,255,255,0)');
  shine.addColorStop(0.48, 'rgba(255,255,255,0.1)');
  shine.addColorStop(0.66, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(PAD, cardTop, INNER, cardH);

  ctx.restore();

  // border
  ctx.save();
  ctx.strokeStyle = rgba(color, 0.5);
  ctx.lineWidth = 1.5;
  roundPath(ctx, PAD + 0.75, cardTop + 0.75, INNER - 1.5, cardH - 1.5, RADIUS);
  ctx.stroke();
  ctx.restore();

  const centreX = W / 2;

  // ---- SOLD pill -----------------------------------------------------------
  ctx.font = font(900, 13);
  const soldTextW = spacedWidth(ctx, 'SOLD', 3.5);
  const pillW = 14 + 14 + 6 + soldTextW + 16;
  const pillX = centreX - pillW / 2;
  ctx.save();
  ctx.fillStyle = '#b45309';
  roundPath(ctx, pillX, pillTop + 5, pillW, 30, 15);
  ctx.fill();
  ctx.restore();

  const pillFill = ctx.createLinearGradient(0, pillTop, 0, pillTop + 30);
  pillFill.addColorStop(0, '#fde68a');
  pillFill.addColorStop(1, '#f59e0b');
  ctx.save();
  ctx.shadowColor = 'rgba(245,158,11,0.45)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = pillFill;
  roundPath(ctx, pillX, pillTop, pillW, 30, 15);
  ctx.fill();
  ctx.restore();

  drawGavel(ctx, pillX + 14, pillTop + 8, 14, '#0f172a');
  ctx.fillStyle = '#0f172a';
  ctx.font = font(900, 13);
  drawSpaced(ctx, 'SOLD', pillX + 14 + 14 + 6, pillTop + 20, 3.5, 'left');

  // ---- avatar --------------------------------------------------------------
  const avatarX = centreX - avatarOuter / 2;
  ctx.save();
  ctx.shadowColor = rgba(color, 0.55);
  ctx.shadowBlur = 26;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = color;
  roundPath(ctx, avatarX, avatarTop, avatarOuter, avatarOuter, 18);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 5;
  roundPath(ctx, avatarX - 2.5, avatarTop - 2.5, avatarOuter + 5, avatarOuter + 5, 20);
  ctx.stroke();
  ctx.restore();

  const avatarInner = avatarOuter - 8;
  const innerX = avatarX + 4;
  const innerY = avatarTop + 4;
  if (photoImg) {
    drawImageCover(ctx, photoImg, innerX, innerY, avatarInner, avatarInner, 14);
  } else {
    ctx.fillStyle = '#1e293b';
    roundPath(ctx, innerX, innerY, avatarInner, avatarInner, 14);
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    roundPath(ctx, innerX + 0.5, innerY + 0.5, avatarInner - 1, avatarInner - 1, 14);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#6ee7b7';
    ctx.font = font(900, 60);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials(name), centreX, innerY + avatarInner / 2 + 2);
    ctx.textBaseline = 'alphabetic';
  }

  // ---- name ----------------------------------------------------------------
  ctx.fillStyle = '#ffffff';
  ctx.font = font(900, 30);
  ctx.textAlign = 'center';
  nameLines.forEach((line, i) => {
    ctx.fillText(line, centreX, nameTop + 28 + i * 37);
  });

  // ---- category + role -----------------------------------------------------
  const catX = centreX - badgeRowW / 2;
  ctx.fillStyle = tone.fill;
  roundPath(ctx, catX, badgeRowTop, catPillW, catPillH, catPillH / 2);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = tone.border;
  ctx.lineWidth = 1;
  roundPath(ctx, catX + 0.5, badgeRowTop + 0.5, catPillW - 1, catPillH - 1, catPillH / 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = tone.text;
  ctx.font = font(700, 10);
  drawSpaced(ctx, catLabel, catX + catPillW / 2, badgeRowTop + 14, 0.6, 'center');

  if (roleLabel) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = font(600, 11);
    drawSpaced(ctx, roleLabel, catX + catPillW + 8, badgeRowTop + 14, 1.1, 'left');
  }

  // ---- divider -------------------------------------------------------------
  const divider = ctx.createLinearGradient(PAD + 8, 0, W - PAD - 8, 0);
  divider.addColorStop(0, 'rgba(255,255,255,0)');
  divider.addColorStop(0.5, 'rgba(255,255,255,0.28)');
  divider.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = divider;
  ctx.fillRect(PAD + 8, dividerY, INNER - 16, 1);

  // ---- sold to -------------------------------------------------------------
  const soldX = centreX - soldToGroupW / 2;
  drawTeamBadge(ctx, {
    img: teamLogoImg,
    name: teamName,
    x: soldX,
    y: soldToTop,
    size: 64,
    color,
  });

  const soldTextX = soldX + 64 + 12;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = font(600, 10);
  drawSpaced(ctx, 'SOLD TO', soldTextX, soldToTop + 25, 2.5, 'left');

  ctx.fillStyle = '#ffffff';
  ctx.font = font(700, teamFontSize);
  ctx.fillText(teamName, soldTextX, soldToTop + 49);

  // ---- price ---------------------------------------------------------------
  const priceFill = ctx.createLinearGradient(0, priceTop, 0, priceTop + priceH);
  priceFill.addColorStop(0, rgba(color, 0.15));
  priceFill.addColorStop(1, 'rgba(2,6,23,0.9)');
  ctx.fillStyle = priceFill;
  roundPath(ctx, PAD, priceTop, INNER, priceH, 16);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = rgba(color, 0.33);
  ctx.lineWidth = 1;
  roundPath(ctx, PAD + 0.5, priceTop + 0.5, INNER - 1, priceH - 1, 16);
  ctx.stroke();
  ctx.restore();

  if (isIcon) {
    // Icon players are drawn rather than bought, so the panel names them
    // instead of showing a zero price. One line, centred on its own ink.
    ctx.fillStyle = '#ffffff';
    ctx.font = font(900, ICON_SIZE);
    const iconAsc = ascentOf(ctx, priceValue, ICON_SIZE);
    drawSpaced(ctx, priceValue, centreX, priceTop + (priceH + iconAsc) / 2, ICON_TRACKING, 'center');
  } else {
    // The figure sits in the lower part of the panel and the label is centred
    // in the space above it, so the two never crowd each other.
    ctx.font = font(600, 10);
    const labelAsc = ascentOf(ctx, 'PRICE', 10);
    ctx.font = font(900, 36);
    const valueAsc = ascentOf(ctx, priceValue, 36);
    const valueBaseline = priceTop + priceH - 16;
    const valueTop = valueBaseline - valueAsc;
    const labelBaseline = priceTop + (valueTop - priceTop) / 2 + labelAsc / 2;

    ctx.fillStyle = '#94a3b8';
    ctx.font = font(600, 10);
    drawSpaced(ctx, 'PRICE', centreX, labelBaseline, 2.5, 'center');

    const priceX = centreX - priceGroupW / 2;
    ctx.fillStyle = '#ffffff';
    ctx.font = font(900, 36);
    ctx.textAlign = 'left';
    ctx.fillText(priceValue, priceX, valueBaseline);
    ctx.fillStyle = '#94a3b8';
    ctx.font = font(700, 14);
    ctx.fillText('coins', priceX + priceNumW + 6, valueBaseline);
  }

  // ---- CrickTrack lockup ---------------------------------------------------
  const footerX = centreX - footerGroupW / 2;
  ctx.fillStyle = '#ffffff';
  roundPath(ctx, footerX, footerTop, 24, 24, 6);
  ctx.fill();
  if (logoImg) {
    drawImageCover(ctx, logoImg, footerX + 2, footerTop + 2, 20, 20, 4);
  }

  const brandX = footerX + 24 + 8;
  ctx.fillStyle = '#cbd5e1';
  ctx.font = font(900, 11);
  drawSpaced(ctx, 'CRICKTRACK', brandX, footerTop + 11, 2.2, 'left');
  ctx.fillStyle = '#64748b';
  ctx.font = font(600, 8);
  drawSpaced(ctx, 'TAG · ANALYSE · ELEVATE', brandX, footerTop + 23, 1.6, 'left');

  return canvas;
}

export async function downloadSoldCardPhoto(sale, filename = 'sold-card') {
  const canvas = await buildSoldCardCanvas(sale || {});
  if (!canvas) return false;
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${filename}.png`;
  link.click();
  return true;
}