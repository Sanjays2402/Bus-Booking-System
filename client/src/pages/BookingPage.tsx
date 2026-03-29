import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import { Passenger } from '../types';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as any;

  if (!state?.route || !state?.selectedSeats) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40">No booking in progress</p>
        <button onClick={() => navigate('/')} className="text-purple-400 hover:text-purple-300 mt-4">← Go Home</button>
      </div>
    );
  }

  const { route, selectedSeats, totalPrice, routeId, date } = state;

  const [passengers, setPassengers] = useState<Passenger[]>(
    selectedSeats.map((s: any) => ({ seatId: s.id, seatNumber: s.seat_number, name: '', age: 0, gender: '' }))
  );
  const [submitting, setSubmitting] = useState(false);

  const updatePassenger = (idx: number, field: keyof Passenger, value: string | number) => {
    setPassengers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const p of passengers) {
      if (!p.name || !p.age || !p.gender) {
        return toast.error('Fill all passenger details');
      }
    }
    setSubmitting(true);
    try {
      const result = await api.createBooking({
        routeId, travelDate: date,
        passengers: passengers.map(p => ({ seatId: p.seatId, name: p.name, age: p.age, gender: p.gender }))
      });
      navigate('/booking/confirmed', { state: { ...result, route, date, passengers, totalPrice } });
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Route Header */}
      <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          {route.origin} <ArrowRight className="w-5 h-5 text-purple-400" /> {route.destination}
        </h1>
        <p className="text-white/40 mt-1">
          {route.operator_name} · {route.departure_time} – {route.arrival_time} ·{' '}
          {new Date(date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4 mb-8">
          {passengers.map((p, idx) => (
            <div key={idx} className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Passenger {idx + 1}</h3>
                  <p className="text-xs text-white/30">Seat {p.seatNumber}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="Full Name"
                  value={p.name}
                  onChange={e => updatePassenger(idx, 'name', e.target.value)}
                  className="glass-input rounded-xl px-4 py-3 outline-none"
                  required
                />
                <input
                  type="number"
                  placeholder="Age"
                  min={1}
                  max={120}
                  value={p.age || ''}
                  onChange={e => updatePassenger(idx, 'age', Number(e.target.value))}
                  className="glass-input rounded-xl px-4 py-3 outline-none"
                  required
                />
                <select
                  value={p.gender}
                  onChange={e => updatePassenger(idx, 'gender', e.target.value)}
                  className="glass-input rounded-xl px-4 py-3 outline-none"
                  required
                >
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Total & Submit */}
        <div className="glass-strong rounded-2xl p-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-white/40 text-sm">Total Amount</p>
              <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                ${totalPrice.toFixed(2)}
              </p>
              <p className="text-white/25 text-xs mt-1">{passengers.length} seat{passengers.length > 1 ? 's' : ''}</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-glow px-10 py-3.5 rounded-xl font-bold text-white text-lg disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
