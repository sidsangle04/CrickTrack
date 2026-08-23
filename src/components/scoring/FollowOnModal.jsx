import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Repeat, ArrowRight } from 'lucide-react';

export default function FollowOnModal({ open, teamAName, teamBName, lead, onEnforce, onDecline }) {
  return (
    <Dialog open={open}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md" onOpenChange={() => {}}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Repeat className="w-5 h-5 text-emerald-400" />
            Enforce the Follow-On?
          </DialogTitle>
        </DialogHeader>
        <div className="py-3 space-y-3">
          <p className="text-slate-300">
            <span className="font-semibold text-white">{teamAName}</span> leads{' '}
            <span className="font-semibold text-emerald-400">{teamBName}</span> by{' '}
            <span className="font-semibold text-amber-400">{lead} runs</span> after the first innings.
          </p>
          <p className="text-sm text-slate-400">
            Enforce the follow-on and make {teamBName} bat again immediately, or {teamAName} bats its second innings.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <div className="font-medium text-emerald-400 mb-1 flex items-center gap-1">
                Yes <ArrowRight className="w-3 h-3" />
              </div>
              <div className="text-slate-400 text-xs leading-relaxed">
                {teamBName} → 2nd innings, then {teamAName} chases
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
              <div className="font-medium text-slate-300 mb-1 flex items-center gap-1">
                No <ArrowRight className="w-3 h-3" />
              </div>
              <div className="text-slate-400 text-xs leading-relaxed">
                {teamAName} → 2nd innings, then {teamBName} chases
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={onDecline} className="flex-1 border-slate-700">
            No (Decline)
          </Button>
          <Button onClick={onEnforce} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
            Yes (Enforce)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}