import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Plus, Pencil, Trash2, Loader2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGroundShape } from '@/lib/GroundShapeContext';
import useVenueAverages from '@/hooks/useVenueAverages';
import VenueFormModal from '@/components/venues/VenueFormModal';

export default function Venues() {
  const queryClient = useQueryClient();
  const { mode } = useGroundShape();
  const modeLabel = mode === 'circular' ? 'Standard' : 'TURF';

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const { data: venues = [], isLoading } = useQuery({
    queryKey: ['venues', mode],
    queryFn: () =>
      base44.entities.Venue.filter(
        { ground_mode: mode || 'turf' },
        { sort: '-created_date', limit: 200 }
      )
  });
  const venueList = venues.items || [];

  const { data: averages = {} } = useVenueAverages();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Venue.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['venues']);
      setShowModal(false);
      setEditing(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Venue.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['venues']);
      setShowModal(false);
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Venue.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['venues']);
      setConfirmId(null);
    }
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate({ ...data, ground_mode: mode || 'turf' });
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  const averageFor = (v) => averages[v.id] || averages[v.name] || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Venues</h1>
            <p className="text-xs text-slate-400">
              {modeLabel} grounds · par score uses the average first-innings score here
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Venue
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : venueList.length === 0 ? (
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 py-16 text-center">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">No venues yet for {modeLabel} mode.</p>
          <Button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add your first venue
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {venueList.map((v) => {
            const avg = averageFor(v);
            return (
              <div
                key={v.id}
                className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-4 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate">{v.name}</p>
                    <p className="text-xs text-slate-400 truncate">{v.location || 'No location'}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/60 border border-slate-700/40 px-3 py-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-500 shrink-0" />
                  {avg ? (
                    <span className="text-xs text-slate-300">
                      Avg 1st innings{' '}
                      <span className="text-white font-bold">{avg.average}</span>
                      <span className="text-slate-500">
                        {' '}
                        · {avg.count} match{avg.count === 1 ? '' : 'es'}
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      No completed matches at this venue yet
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => {
                      setEditing(v);
                      setShowModal(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  {confirmId === v.id ? (
                    <>
                      <button
                        onClick={() => deleteMutation.mutate(v.id)}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600"
                      >
                        Delete?
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmId(v.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-red-400 hover:bg-slate-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VenueFormModal
        open={showModal}
        onOpenChange={(o) => {
          setShowModal(o);
          if (!o) setEditing(null);
        }}
        venue={editing}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </div>
  );
}