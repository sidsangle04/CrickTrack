import React, { useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import SoldCardFace from './SoldCardFace';
import { downloadNodeAsPng } from '@/lib/shareGraphic';
import { soldCardFilename } from '@/lib/auction/cardPhoto';

// Downloads one sold player's card as a photo. The card is drawn off-screen for
// the capture, so a photo is available for every sold card, not just the newest.
export default function SoldCardPhotoButton({ sale, className = '' }) {
  const [busy, setBusy] = useState(false);
  const [render, setRender] = useState(false);
  const nodeRef = useRef(null);

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
      await downloadNodeAsPng(nodeRef.current, soldCardFilename(sale?.player?.name));
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
        className={`inline-flex items-center justify-center gap-1 rounded-md border border-slate-600/70 bg-slate-900 px-2 py-1 text-[10px] font-semibold text-slate-300 transition-colors hover:border-emerald-500/60 hover:text-emerald-300 disabled:opacity-60 shrink-0 ${className}`}
      >
        {busy ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Download className="w-3 h-3" />
        )}
        Photo
      </button>

      {render && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: '360px',
            pointerEvents: 'none',
          }}
        >
          <SoldCardFace
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