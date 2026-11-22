import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadAuctionSheet } from '@/lib/auction/auctionSheet';

// Downloads the auction — live or final — as a PDF sheet.
export default function AuctionPdfButton({
  tournament,
  auction,
  teams,
  players,
  label = 'Download PDF',
  className = ''
}) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (busy) return;
    setBusy(true);
    try {
      downloadAuctionSheet({ tournament, auction, teams, players });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={save}
      disabled={busy}
      title="Download this auction as a PDF"
      className={`border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 ${className}`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      ) : (
        <FileDown className="w-4 h-4 mr-1.5" />
      )}
      {busy ? 'Preparing' : saved ? 'Saved' : label}
    </Button>
  );
}