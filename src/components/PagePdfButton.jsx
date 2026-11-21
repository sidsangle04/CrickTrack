import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { downloadElementPdf, pdfFilename } from '@/lib/pagePdf';

// Downloads everything currently shown on the page as a PDF.
export default function PagePdfButton({ selector = 'main', filename, label = 'PDF', className = '' }) {
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const target = document.querySelector(selector) || document.body;
      await downloadElementPdf(target, pdfFilename(filename || document.title));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      title="Download this page as a PDF"
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-60 shrink-0 ${className}`}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <FileDown className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{busy ? 'Preparing' : saved ? 'Saved' : label}</span>
    </button>
  );
}