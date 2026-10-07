import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const EMPTY = { name: '', location: '' };

export default function VenueFormModal({ open, onOpenChange, venue, onSubmit, saving }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(venue ? { name: venue.name || '', location: venue.location || '' } : EMPTY);
  }, [open, venue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{venue ? 'Edit Venue' : 'Add Venue'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-slate-200">Venue name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              placeholder="e.g. Central Park Ground"
            />
          </div>
          <div>
            <Label className="text-slate-200">Location</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
              placeholder="City or area (optional)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            disabled={!form.name.trim() || saving}
            onClick={() => onSubmit({ name: form.name.trim(), location: form.location.trim() })}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {venue ? 'Save Venue' : 'Add Venue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}