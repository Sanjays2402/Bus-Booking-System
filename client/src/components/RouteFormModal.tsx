import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export interface RouteFormValues {
  id?: number;
  busId: number;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  priceBase: number;
  daysOfWeek: string;
  active?: number;
}

interface RouteFormModalProps {
  open: boolean;
  initial?: Partial<RouteFormValues> | null;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT: RouteFormValues = {
  busId: 0,
  origin: '',
  destination: '',
  departureTime: '08:00',
  arrivalTime: '12:00',
  durationMinutes: 240,
  priceBase: 30,
  daysOfWeek: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  active: 1,
};

export default function RouteFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: RouteFormModalProps) {
  const editing = Boolean(initial?.id);
  const [values, setValues] = useState<RouteFormValues>(DEFAULT);
  const [buses, setBuses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues({ ...DEFAULT, ...(initial || {}) } as RouteFormValues);
    api
      .getAdminBuses()
      .then((b) => {
        setBuses(b);
        setValues((v) => (v.busId ? v : { ...v, busId: b[0]?.id || 0 }));
      })
      .catch(() => toast.error('Failed to load buses'));
  }, [open, initial]);

  if (!open) return null;

  const update = <K extends keyof RouteFormValues>(key: K, val: RouteFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.origin || !values.destination || !values.busId) {
      toast.error('Origin, destination, and bus are required');
      return;
    }
    setSubmitting(true);
    try {
      if (editing && initial?.id) {
        await api.updateRoute(initial.id, values);
        toast.success('Route updated');
      } else {
        await api.addRoute(values);
        toast.success('Route created');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? 'Edit route' : 'Add route'}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <form
        onSubmit={submit}
        className="relative glass-strong rounded-3xl p-6 w-full max-w-xl text-white shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {editing ? 'Edit route' : 'Add new route'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="col-span-2 flex flex-col gap-1">
            Bus
            <select
              className="input"
              value={values.busId}
              onChange={(e) => update('busId', Number(e.target.value))}
              required
            >
              {buses.map((b) => (
                <option key={b.id} value={b.id} className="text-black">
                  {b.operator_name} · {b.bus_number} ({b.bus_type})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Origin
            <input
              className="input"
              value={values.origin}
              onChange={(e) => update('origin', e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            Destination
            <input
              className="input"
              value={values.destination}
              onChange={(e) => update('destination', e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            Departure
            <input
              className="input"
              type="time"
              value={values.departureTime}
              onChange={(e) => update('departureTime', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            Arrival
            <input
              className="input"
              type="time"
              value={values.arrivalTime}
              onChange={(e) => update('arrivalTime', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            Duration (min)
            <input
              className="input"
              type="number"
              min={15}
              value={values.durationMinutes}
              onChange={(e) => update('durationMinutes', Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1">
            Base price ($)
            <input
              className="input"
              type="number"
              min={1}
              step="0.01"
              value={values.priceBase}
              onChange={(e) => update('priceBase', Number(e.target.value))}
            />
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            Days of week
            <input
              className="input"
              value={values.daysOfWeek}
              onChange={(e) => update('daysOfWeek', e.target.value)}
            />
            <span className="text-white/40 text-xs">
              Comma-separated (Mon,Tue,...)
            </span>
          </label>
          {editing && (
            <label className="col-span-2 flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={Boolean(values.active)}
                onChange={(e) => update('active', e.target.checked ? 1 : 0)}
              />
              Active (visible to riders)
            </label>
          )}
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="btn-glass px-4 py-2 rounded-xl text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-glow px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create route'}
          </button>
        </div>
      </form>
    </div>
  );
}
