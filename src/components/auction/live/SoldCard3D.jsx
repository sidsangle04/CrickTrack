import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2 } from 'lucide-react';
import SoldCardFace from './SoldCardFace';
import { downloadNodeAsPng } from '@/lib/shareGraphic';
import { soldCardFilename } from '@/lib/auction/cardPhoto';

// Full-screen "player sold" card: a layered, extruded 3D slab lit in the
// winning team's colour. It stays up until the operator taps anywhere.
export default function SoldCard3D({ sale, onDone }) {
  const { player, team, price } = sale || {};
  const faceRef = useRef(null);
  const [saving, setSaving] = useState(false);

  if (!player) return null;

  const color = team?.color || '#10b981';

  const savePhoto = async (event) => {
    event.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      await downloadNodeAsPng(faceRef.current, soldCardFilename(player.name));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden p-4 bg-slate-950/90 backdrop-blur-md"
      style={{ perspective: '1600px' }}
    >
      {/* team-coloured halo behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute h-[560px] w-[560px] rounded-full blur-3xl opacity-50"
        style={{ background: `radial-gradient(circle, ${color}, transparent 68%)` }}
      />

      <motion.div
        initial={{ rotateY: -170, rotateX: 22, scale: 0.7, opacity: 0 }}
        animate={{ rotateY: 0, rotateX: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full max-w-sm"
      >
        <motion.div
          animate={{ rotateY: [0, 15, 0, -15, 0], rotateX: [0, -6, 0, 6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.05 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative"
        >
          {/* extruded edge — stacked layers behind the face give the slab real depth */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              aria-hidden
              className="absolute inset-0 rounded-3xl"
              style={{
                transform: `translateZ(${-10 - i * 10}px)`,
                background: `linear-gradient(165deg, ${color}, #0b1220 65%)`,
                opacity: 0.9 - i * 0.12,
                boxShadow: i === 4 ? `0 40px 80px -30px ${color}` : 'none',
              }}
            />
          ))}

          <div className="relative">
            <SoldCardFace ref={faceRef} player={player} team={team} price={price} />

            {/* sweeping shine */}
            <motion.div
              aria-hidden
              initial={{ x: '-120%' }}
              animate={{ x: '160%' }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 overflow-hidden rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-2 px-4">
        <button
          type="button"
          onClick={savePhoto}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/90 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-colors hover:border-emerald-400/60 hover:text-emerald-300 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {saving ? 'Saving' : 'Save photo'}
        </button>
        <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}