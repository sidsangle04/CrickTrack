import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadTeamSheets } from '@/lib/auction/teamSheet';

// Downloads one team sheet page per team — squad, photos and coins.
export default function TeamSheetButton({
  tournament,
  teams,
  players,
  settings,
  label = 'Download team sheets',
  className = ''
}) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await downloadTeamSheets({ tournament, teams, players, settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={save}
      disabled={busy}
      title="Download a team sheet for every team"
      className={`border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 ${className}`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-2" />
      )}
      {busy ? 'Preparing…' : saved ? 'Saved' : label}
    </Button>
  );
}