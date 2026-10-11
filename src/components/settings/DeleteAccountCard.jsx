import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CONFIRM_WORD = 'DELETE';

export default function DeleteAccountCard({ onDeleted }) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) {
      setError(`Type ${CONFIRM_WORD} to confirm.`);
      return;
    }
    setError('');
    setIsDeleting(true);
    try {
      await base44.functions.invoke('deleteMyAccount', { confirm: CONFIRM_WORD });
      onDeleted();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Could not delete your account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-semibold text-white uppercase tracking-wide">Delete account</h2>
          <p className="text-sm text-slate-400 mt-1">
            This removes your CrickTrack account and signs you out. You will need a new invite to
            get back in, and this cannot be undone.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={`Type ${CONFIRM_WORD} to confirm`}
          disabled={isDeleting}
          className="bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500"
        />
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          className="bg-red-600 text-white hover:bg-red-700 shrink-0">
          {isDeleting ? 'Deleting…' : 'Delete my account'}
        </Button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}