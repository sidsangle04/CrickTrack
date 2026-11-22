import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import SoldCardExport from './SoldCardExport';
import { downloadNodeAsPng } from '@/lib/shareGraphic';
import { soldCardFilename } from '@/lib/auction/cardPhoto';

// Downloads one sold player's card as a photo. The card is drawn off-screen for
// the capture, so a photo is available for every sold card, not just the newest.
// `variant="pill"` is the big Save photo button on the live sold-card pop-up.
export default function SoldCardPhotoButton({ sale, variant = 'chip', className = '' }) {
  const [busy, setBusy] = useState(false);
  const [render, setRender] = useState(false);
  const nodeRef = useRef(null);
  const pill = variant === 'pill';

  const save = async (event) => {
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    setRender(true);
    try {
      // Let the hidden card paint — and its photos load — before it is captured.
      await new Promise((resolve) => setTimeout(resolve, 90));
      const images = Array.from(nodeRef.current?.querySelectorAll('img') || []);
      await Promise.all(
        images.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              })
        )
      );
      await downloadNodeAsPng(nodeRef.current, soldCardFilename(sale?.player?.name), {
        backgroundColor: null,
        scale: 3,
      });
    } finally {
      setRender(false);
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={save}
        disabled={busy}
        title="Download this sold card as a photo"
        className={
          pill
            ? `inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/90 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-colors hover:border-emerald-400/60 hover:text-emerald-300 disabled:opacity-60 ${className}`
            : `inline-flex items-center justify-center gap-1 rounded-md border border-slate-600/70 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300 transition-colors hover:border-emerald-500/60 hover:text-emerald-300 disabled:opacity-60 shrink-0 ${className}`
        }
      >
        {busy ? (
          <Loader2 className={pill ? 'h-4 w-4 animate-spin' : 'w-3 h-3 animate-spin'} />
        ) : (
          <Download className={pill ? 'h-4 w-4' : 'w-3 h-3'} />
        )}
        {pill ? (busy ? 'Saving' : 'Save photo') : 'Photo'}
      </button>

      {render && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '460px',
            pointerEvents: 'none',
          }}
        >
          <SoldCardExport
            ref={nodeRef}
            player={sale?.player}
            team={sale?.team}
            price={sale?.price}
          />
        </div>
      )}
    </>
  );
}