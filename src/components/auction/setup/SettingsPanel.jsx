import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Panel } from '../Shared';
import { bidLadder, sortedTiers } from '@/lib/auction/bidding';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

const SQUAD_PRESETS = [6, 8, 10, 12, 15];

export default function SettingsPanel({ auction, refresh }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auction) return;
    setForm({
      required_squad_size: auction.required_squad_size ?? 8,
      purse: auction.purse ?? 2000,
      starting_bid: auction.starting_bid ?? 50,
      tiers: sortedTiers(auction.tiers)
    });
  }, [auction]);

  if (!form) return null;

  const locked = auction.status === 'auction' || auction.status === 'completed';
  const needsConfirm = auction.status !== 'setup';

  const persist = async () => {
    setSaving(true);
    setError('');
    try {
      await base44.entities.Auction.update(auction.id, {
        required_squad_size: Number(form.required_squad_size) || 8,
        purse: Number(form.purse) || 2000,
        starting_bid: Number(form.starting_bid) || 50,
        tiers: sortedTiers(form.tiers)
      });
      refresh && refresh();
      setConfirming(false);
    } catch (e) {
      setError(e?.message || 'Could not save the settings.');
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!Number(form.starting_bid) || Number(form.starting_bid) <= 0) {
      setError('Starting bid must be more than 0.');
      return;
    }
    if (!sortedTiers(form.tiers).every((t) => t.increment > 0)) {
      setError('Every increment must be more than 0.');
      return;
    }
    if (needsConfirm) setConfirming(true);
    else persist();
  };

  const ladder = bidLadder(
    { starting_bid: form.starting_bid, tiers: form.tiers },
    10
  );

  return (
    <Panel
      title="Auction settings"
      action={
        locked ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5" /> Locked while the auction runs
          </span>
        ) : null
      }
    >
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="space-y-4">
          <div>
            <Label className="text-slate-200">Required squad size per team</Label>
            <p className="text-[11px] text-slate-500 mb-2">
              Total players each team must have, icon players included.
            </p>
            <div className="flex flex-wrap gap-2">
              {SQUAD_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  disabled={locked}
                  onClick={() => setForm({ ...form, required_squad_size: n })}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-50 ${
                    Number(form.required_squad_size) === n
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
              <Input
                type="number"
                min="2"
                disabled={locked}
                value={form.required_squad_size}
                onChange={(e) =>
                  setForm({ ...form, required_squad_size: e.target.value })
                }
                className="w-24 bg-slate-950 border-slate-700 text-white"
                placeholder="Custom"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-200">Purse per team</Label>
              <Input
                type="number"
                min="1"
                disabled={locked}
                value={form.purse}
                onChange={(e) => setForm({ ...form, purse: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-200">Starting bid</Label>
              <Input
                type="number"
                min="1"
                disabled={locked}
                value={form.starting_bid}
                onChange={(e) => setForm({ ...form, starting_bid: e.target.value })}
                className="bg-slate-950 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-slate-200">Bidding increments</Label>
          <p className="text-[11px] text-slate-500 mb-2">
            From the amount in the first column, every bid rises by the amount in the second.
          </p>
          <div className="space-y-2">
            {form.tiers.map((tier, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    min="0"
                    disabled={locked}
                    value={tier.from}
                    onChange={(e) => {
                      const tiers = [...form.tiers];
                      tiers[i] = { ...tiers[i], from: e.target.value };
                      setForm({ ...form, tiers });
                    }}
                    className="bg-slate-950 border-slate-700 text-white"
                    placeholder="From"
                  />
                </div>
                <span className="text-xs text-slate-500">→</span>
                <div className="flex-1">
                  <Input
                    type="number"
                    min="1"
                    disabled={locked}
                    value={tier.increment}
                    onChange={(e) => {
                      const tiers = [...form.tiers];
                      tiers[i] = { ...tiers[i], increment: e.target.value };
                      setForm({ ...form, tiers });
                    }}
                    className="bg-slate-950 border-slate-700 text-white"
                    placeholder="Increase by"
                  />
                </div>
                <button
                  type="button"
                  disabled={locked || form.tiers.length <= 1}
                  onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, x) => x !== i) })}
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30"
                  title="Remove tier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              disabled={locked}
              onClick={() => {
                const last = form.tiers[form.tiers.length - 1] || { from: 0, increment: 10 };
                setForm({
                  ...form,
                  tiers: [...form.tiers, { from: Number(last.from) + 200, increment: Number(last.increment) }]
                });
              }}
              className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-2" /> Add tier
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {ladder.map((amount, i) => (
              <span
                key={`${amount}-${i}`}
                className="px-2 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] text-slate-300 tabular-nums"
              >
                {amount}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

      {!locked && (
        <div className="mt-4 flex justify-end">
          <Button onClick={save} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save settings
          </Button>
        </div>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Change the rules mid-auction?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300">
            The auction has already started. Changing squad size, purse or bidding increments affects
            every team and every remaining bid. Purse balances and squads already recorded stay as they
            are.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)} className="text-slate-300">
              Cancel
            </Button>
            <Button onClick={persist} disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Yes, change the rules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}