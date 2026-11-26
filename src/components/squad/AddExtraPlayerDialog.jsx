import React, { useState } from 'react';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ROLE_LABELS } from '@/components/auction/Shared';

// Adds a backup player to a finished auction squad. Extras sit outside the
// squad size and the purse, but they are in the squad for tournament matches.
export default function AddExtraPlayerDialog({ open, onOpenChange, teamName, onConfirm }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('batsman');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onConfirm({ name: name.trim(), role });
      setName('');
      setRole('batsman');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-400" />
            Extra player · {teamName || 'team'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-400">
            A backup player for the squad. No squad slot and no purse is used — they are still
            available to pick in this tournament's matches.
          </p>
          <div>
            <Label className="text-slate-200">Player name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Arjun Mehta"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <Label className="text-slate-200">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-white">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-300">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!name.trim() || saving}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add extra player
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}