import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { buildShareUrl } from '@/lib/scorecardText';

export default function ShareScorecardButton({ matchId, className }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = buildShareUrl(matchId);
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CrickTrack scorecard', url });
        return;
      } catch {
        // user dismissed the share sheet — fall through to copying the link
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={className || 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'}
    >
      {copied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Share2 className="w-4 h-4 mr-2" />}
      {copied ? 'Link copied' : 'Share'}
    </Button>
  );
}