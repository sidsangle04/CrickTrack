import React, { useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Link2, FileText, Image as ImageIcon, Check, Loader2, Trophy, Crosshair } from 'lucide-react';
import { downloadNodeAsPng, copyToClipboard } from '@/lib/shareGraphic';
import { openTournamentReport } from '@/lib/tournamentReport';

const LOGO = 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

const Action = ({ icon: Icon, label, onClick, done, busy }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
  >
    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : done ? <Check className="w-4 h-4 text-emerald-400" /> : <Icon className="w-4 h-4" />}
    {label}
  </button>
);

export default function ShareStatsMenu({ open, onClose, stats, tournament }) {
  const [kind, setKind] = useState('runs');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);

  const leader = useMemo(() => {
    if (kind === 'runs') {
      const p = [...stats.batting].sort((a, b) => b.runs - a.runs)[0];
      if (!p) return null;
      return {
        name: p.name,
        team: p.team_name,
        headline: p.runs,
        unit: 'runs',
        lines: [
          ['Innings', p.innings],
          ['Highest', p.hs_text],
          ['Average', p.average ?? '—'],
          ['Strike rate', p.strike_rate ?? '—'],
        ],
      };
    }
    const p = [...stats.bowling].sort((a, b) => b.wickets - a.wickets || b.best_sort - a.best_sort)[0];
    if (!p) return null;
    return {
      name: p.name,
      team: p.team_name,
      headline: p.wickets,
      unit: 'wickets',
      lines: [
        ['Overs', p.overs],
        ['Best', p.best_text],
        ['Economy', p.economy ?? '—'],
        ['Average', p.average ?? '—'],
      ],
    };
  }, [kind, stats]);

  const copyLink = async () => {
    const url = `${window.location.origin}/SharedTournament?tournamentId=${tournament.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${tournament.name} statistics`, url });
        return;
      } catch {
        // dismissed — fall through to copying
      }
    }
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const saveGraphic = async () => {
    setBusy(true);
    try {
      await downloadNodeAsPng(cardRef.current, `${tournament.name}-${kind === 'runs' ? 'top-scorer' : 'top-wickets'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto bg-slate-900 border-slate-700 text-slate-200">
        <DialogTitle className="text-sm font-semibold text-white">Share tournament statistics</DialogTitle>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <Action icon={Link2} label={copied ? 'Link copied' : 'Copy public link'} onClick={copyLink} done={copied} />
          <Action icon={FileText} label="PDF report" onClick={() => openTournamentReport(stats, tournament)} />
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {[
            { key: 'runs', label: 'Top run scorer', icon: Trophy },
            { key: 'wickets', label: 'Top wicket taker', icon: Crosshair },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setKind(key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium border ${
                kind === key
                  ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {leader ? (
          <>
            <div
              ref={cardRef}
              className="mt-3 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO} alt="" className="h-7 w-auto rounded bg-white p-0.5" crossOrigin="anonymous" />
                <span className="text-xs font-bold text-white tracking-tight">CrickTrack</span>
                <span className="ml-auto text-[9px] uppercase tracking-widest text-emerald-400 font-semibold truncate max-w-[45%]">
                  {tournament.name}
                </span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                {kind === 'runs' ? 'Leading run scorer' : 'Leading wicket taker'}
              </div>
              <div className="text-xl font-bold text-white mt-0.5">{leader.name}</div>
              <div className="text-xs text-slate-400">{leader.team}</div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-4xl font-black text-emerald-400 tabular-nums leading-none">
                  {leader.headline}
                </span>
                <span className="text-xs text-slate-400 mb-1">{leader.unit}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-4">
                {leader.lines.map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-800/70 px-2 py-1.5">
                    <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
                    <div className="text-sm font-bold text-white tabular-nums">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={saveGraphic}
              disabled={busy}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
              Save graphic
            </button>
          </>
        ) : (
          <p className="mt-4 text-xs text-slate-500 text-center py-6">
            Leaderboards appear once a match in this tournament is complete.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}