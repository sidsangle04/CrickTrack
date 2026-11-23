// Downloadable fixture sheet: who plays whom, and when, in the app's own design.
import { jsPDF } from 'jspdf';

const COLORS = {
  page: [15, 23, 42],
  card: [30, 41, 59],
  line: [51, 65, 85],
  white: [255, 255, 255],
  muted: [148, 163, 184],
  emerald: [16, 185, 129],
  emeraldLight: [52, 211, 153],
};

const FORMAT_LABELS = {
  knockout: 'Knockout',
  league_knockout: 'League + Knockout',
  league_playoffs: 'League + Playoffs',
  league_qualifiers: 'League + Qualifiers',
};

const longDate = (value) => {
  if (!value) return 'Date to be confirmed';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export function buildFixtureGroups(tournamentMatches = [], teamsMap = {}, matchesMap = {}) {
  const sorted = [...tournamentMatches].sort(
    (a, b) =>
      (a.stage === 'league' ? 0 : 1) - (b.stage === 'league' ? 0 : 1) ||
      (a.round ?? 0) - (b.round ?? 0) ||
      (a.match_index ?? 0) - (b.match_index ?? 0)
  );

  const groups = [];
  sorted.forEach((tm) => {
    const label =
      tm.stage_label ||
      (tm.stage === 'league' ? `League · Round ${tm.round ?? 1}` : `Knockout · Round ${tm.round ?? 1}`);

    let group = groups[groups.length - 1];
    if (!group || group.label !== label) {
      group = { label, rows: [] };
      groups.push(group);
    }

    const match = matchesMap[tm.match_id] || null;
    const status =
      match?.status === 'completed'
        ? match.result || 'Completed'
        : match?.status === 'live'
        ? 'Live now'
        : tm.status === 'completed'
        ? 'Completed'
        : '';

    group.rows.push({
      team1: teamsMap[tm.team1_id]?.name || 'To be decided',
      team2: teamsMap[tm.team2_id]?.name || 'To be decided',
      meta: [longDate(match?.date), match?.venue].filter(Boolean).join('  ·  '),
      status,
    });
  });

  return groups;
}

export function downloadFixtureSheet({ tournament, tournamentMatches, teamsMap, matchesMap }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  const inner = W - M * 2;

  const groups = buildFixtureGroups(tournamentMatches, teamsMap, matchesMap);
  const totalFixtures = groups.reduce((n, g) => n + g.rows.length, 0);

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
    doc.text('FIXTURES', W - M, 32, { align: 'right' });
    doc.setTextColor(...COLORS.muted);
    doc.text(
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      W - M,
      43,
      { align: 'right' }
    );
    return 74;
  };

  paintPage();
  let y = masthead();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.setTextColor(...COLORS.white);
  doc.text(clip(tournament?.name || 'Tournament', inner), M, y);
  y += 16;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  const sub = [
    FORMAT_LABELS[tournament?.format] || 'Tournament',
    `${tournament?.num_teams || (tournament?.team_ids || []).length || 0} teams`,
    `${totalFixtures} ${totalFixtures === 1 ? 'fixture' : 'fixtures'}`,
  ].join('   ·   ');
  doc.text(sub, M, y);
  y += 28;

  const rowH = 46;
  const gutter = 54;
  const colW = (inner - gutter - 24) / 2;

  if (!groups.length) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text('No fixtures have been created for this tournament yet.', M, y);
  }

  groups.forEach((group) => {
    if (y + 50 > H - 56) {
      doc.addPage();
      paintPage();
      y = masthead();
    }

    doc.setFillColor(...COLORS.emerald);
    doc.rect(M, y - 8, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.emeraldLight);
    doc.text(clip(group.label.toUpperCase(), inner - 10), M + 10, y);
    y += 13;

    group.rows.forEach((row) => {
      if (y + rowH > H - 56) {
        doc.addPage();
        paintPage();
        y = masthead();
      }

      doc.setFillColor(...COLORS.card);
      doc.roundedRect(M, y, inner, rowH, 8, 8, 'F');
      doc.setDrawColor(...COLORS.line);
      doc.setLineWidth(0.6);
      doc.roundedRect(M, y, inner, rowH, 8, 8, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...COLORS.white);
      doc.text(clip(row.team1, colW), M + 12, y + 19);
      doc.text(clip(row.team2, colW), W - M - 12, y + 19, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.emeraldLight);
      doc.text('vs', M + inner / 2, y + 19, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(clip(row.meta, inner - 160), M + 12, y + 33);

      if (row.status) {
        doc.setTextColor(...COLORS.emeraldLight);
        doc.text(clip(row.status, 140), W - M - 12, y + 33, { align: 'right' });
      }

      y += rowH + 6;
    });

    y += 6;
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.6);
    doc.line(M, H - 44, W - M, H - 44);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text('Generated by CrickTrack — share this sheet with your teams', M, H - 30);
    doc.setTextColor(...COLORS.emeraldLight);
    doc.text(`cricktrack.com   ·   ${p} / ${pages}`, W - M, H - 30, { align: 'right' });
  }

  const slug = String(tournament?.name || 'tournament')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  doc.save(`${slug || 'tournament'}-fixtures.pdf`);
}