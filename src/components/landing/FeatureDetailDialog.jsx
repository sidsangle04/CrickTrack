import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * The full description of a feature, opened from its tile on the landing page.
 * The dialog handles focus trapping, Escape and the close button for us.
 */
export default function FeatureDetailDialog({ feature, open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-slate-700 bg-slate-900">
        {feature && (
          <>
            <DialogHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <feature.Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <DialogTitle className="mt-4 text-lg font-semibold text-white">
                {feature.title}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-sm leading-relaxed text-slate-300">
              {feature.text}
            </DialogDescription>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}