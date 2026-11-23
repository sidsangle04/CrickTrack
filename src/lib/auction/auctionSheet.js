// Downloadable auction sheet: every squad, every price — works live and once the
// auction is closed, so the organiser always has a document to share.
import { jsPDF } from 'jspdf';
import { teamFinance } from './squad';

const COLORS = {
  page: [15, 23, 42],
  card: [30, 41, 59],
  line: [51, 65, 85],
  white: [255, 255, 255],
  muted: [148, 163, 184],
  emerald: [16, 185, 129],
  emeraldLight: [52, 211, 153],
  amber: [245, 158, 11],
};

const STATUS_LABELS = {
  setup: 'Setup',
  draft: 'Icon draft',
  auction: 'Live auction',
  paused: 'Paused',
  completed: 'Auction complete',
};

const slugify = (value) =>
  String(value || 'auction')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'auction';

export function downloadAuctionSheet({ tournament, auction, teams = [], players = [] }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const inner = W - M * 2;
  const settings = auction || {};

  const clip = (text, width) => {
    let value = String(text ?? '');
    if (doc.getTextWidth(value) <= width) return value;
    while (value.length > 1 && doc.getTextWidth(`${value}…`) > width) value = value.slice(0, -1);
    return `${value}…`;
  };

  const paintPage = () => {
    doc.setFillColor(...COLORS.page);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(...COLORS.emerald);
    doc.rect(0, 0, W, 3, 'F');
  };

  const masthead = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.white);
    doc.text('CrickTrack', M, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text('TAG  |  ANALYSE  |  ELEVATE', M, 43);

    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.emeraldLight);
    doc.text('AUCTION SHEET', W - M, 32, { align: 'right' });
    doc.setTextColor(...COLORS.muted);
    doc.text(
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      W - M,
      43,
      { align: 'right' }
    );
    return 74;
  };

  const newPage = () => {
    doc.addPage();
    paintPage();
    return masthead();
  };

  const sectionTitle = (label) => {
    doc.setFillColor(...COLORS.emerald);
    doc.rect(M, y - 8, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.emeraldLight);
    doc.text(label.toUpperCase(), M + 10, y);
    y += 16;
  };

  const sold = players.filter((p) => p.status === 'sold');
  const unsold = players.filter((p) => p.status === 'unsold');
  const target = Number(settings.required_squad_size) || 8;
  const purse = Number(settings.purse) || 2000;
  const spend = sold
    .filter((p) => p.category !== 'icon')
    .reduce((sum, p) => sum + (Number(p.sold_price) || 0), 0);

  paintPage();
  let y = masthead();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(...COLORS.white);
  doc.text(clip(tournament?.name || 'Auction', inner), M, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    [
      STATUS_LABELS[settings.status] || 'Auction',
      `${teams.length} teams`,
      `${sold.length} sold`,
      `${unsold.length} unsold`,
      `${spend} of ${purse * Math.max(teams.length, 1)} coins spent`,
    ].join('   ·   '),
    M,
    y
  );
  y += 26;

  const gutter = 14;
  const colW = (inner - gutter) / 2;
  const cardHeight = (count) => 44 + Math.max(1, count) * 13;

  const drawTeam = (team, x, top, width) => {
    const finance = teamFinance({ teamId: team.id, players, settings });
    const squad = finance.squad;
    const height = cardHeight(squad.length);

    doc.setFillColor(...COLORS.card);
    doc.roundedRect(x, top, width, height, 8, 8, 'F');
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, top, width, height, 8, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.white);
    doc.text(clip(team.name, width - 90), x + 10, top + 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.emeraldLight);
    doc.text(`${squad.length}/${finance.target}`, x + width - 10, top + 15, { align: 'right' });

    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Spent ${finance.spent}   ·   Left ${finance.purseLeft}`, x + 10, top + 26);

    let ry = top + 40;
    if (!squad.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text('No players yet', x + 10, ry);
      return height;
    }

    squad.forEach((p) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.white);
      const label = p.category === 'icon' ? `${p.name} (icon)` : p.name;
      doc.text(clip(label, width - 70), x + 10, ry);
      doc.setTextColor(...COLORS.emeraldLight);
      doc.text(p.category === 'icon' ? 'ICON' : String(Number(p.sold_price) || 0), x + width - 10, ry, {
        align: 'right',
      });
      ry += 13;
    });

    return height;
  };

  if (!teams.length) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text('No teams have been added to this auction yet.', M, y);
  }

  for (let i = 0; i < teams.length; i += 2) {
    const rowTeams = teams.slice(i, i + 2);
    const rowHeight = Math.max(
      ...rowTeams.map((t) =>
        cardHeight(teamFinance({ teamId: t.id, players, settings }).squad.length)
      )
    );
    if (y + rowHeight > H - 60) y = newPage();
    rowTeams.forEach((team, col) => drawTeam(team, M + col * (colW + gutter), y, colW));
    y += rowHeight + 10;
  }

  const topBuys = sold
    .filter((p) => p.category !== 'icon')
    .sort((a, b) => (Number(b.sold_price) || 0) - (Number(a.sold_price) || 0))
    .slice(0, 8);

  if (topBuys.length) {
    if (y + 40 + topBuys.length * 13 > H - 60) y = newPage();
    y += 6;
    sectionTitle('Biggest buys');
    topBuys.forEach((p) => {
      const teamName = teams.find((t) => t.id === p.sold_to_team_id)?.name || '';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLORS.white);
      doc.text(clip(p.name, inner - 180), M, y);
      doc.setTextColor(...COLORS.muted);
      doc.text(clip(teamName, 120), M + inner - 90, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.emeraldLight);
      doc.text(String(Number(p.sold_price) || 0), M + inner, y, { align: 'right' });
      y += 13;
    });
    y += 10;
  }

  if (unsold.length) {
    if (y + 50 > H - 60) y = newPage();
    sectionTitle(`Unsold (${unsold.length})`);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    const lines = doc.splitTextToSize(unsold.map((p) => p.name).join(', '), inner);
    lines.forEach((line) => {
      if (y > H - 60) y = newPage();
      doc.text(line, M, y);
      y += 11;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.6);
    doc.line(M, H - 44, W - M, H - 44);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `${target}-player squads  ·  ${purse} coins per team  ·  generated by CrickTrack`,
      M,
      H - 30
    );
    doc.setTextColor(...COLORS.emeraldLight);
    doc.text(`cricktrack.com   ·   ${p} / ${pages}`, W - M, H - 30, { align: 'right' });
  }

  doc.save(`${slugify(tournament?.name)}-auction.pdf`);
}