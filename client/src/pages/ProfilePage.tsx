import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ArrowRight, X, User, Calendar, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Booking } from '../types';
import toast from 'react-hot-toast';
import CancelBookingModal from '../components/CancelBookingModal';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return navigate('/auth');
    api.getMyBookings().then(setBookings).catch(() => {}).finally(() => setLoading(false));
  }, [user, navigate]);

  const visible = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return bookings.filter((b) => {
      const travel = new Date(b.travel_date + 'T00:00');
      if (filter === 'cancelled') return b.status === 'cancelled';
      if (filter === 'upcoming') return b.status === 'confirmed' && travel >= today;
      if (filter === 'past') return b.status === 'confirmed' && travel < today;
      return true;
    });
  }, [bookings, filter]);

  const doCancel = async (bookingId: string) => {
    try {
      const res = await api.cancelBooking(bookingId);
      toast.success(`Cancelled — ${res.refundPercent}% refund ($${res.refundAmount.toFixed(2)})`);
      setBookings((prev) =>
        prev.map((b) => (b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b)),
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="glass-strong rounded-2xl p-8 mb-8 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
            <p className="text-white/40">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Bookings */}
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Ticket className="w-5 h-5 text-purple-400" />
        My Bookings
        <span className="text-sm font-normal text-white/40">
          ({visible.length}/{bookings.length})
        </span>
      </h2>

      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Booking filter">
        {([
          { id: 'all', label: 'All' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'past', label: 'Past' },
          { id: 'cancelled', label: 'Cancelled' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
              filter === tab.id
                ? 'bg-purple-500/30 border-purple-400/50 text-white'
                : 'border-white/15 text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-white/40 mb-4">No bookings to show in this filter</p>
          <button onClick={() => navigate('/')} className="btn-glow px-6 py-2.5 rounded-xl font-bold text-white text-sm">Book a Trip</button>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((bk, idx) => (
            <div key={bk.id} className="glass glass-card rounded-2xl p-6 animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-sm text-purple-300 glass px-3 py-1 rounded-full">{bk.booking_id}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      bk.status === 'confirmed'
                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                        : 'bg-red-400/10 text-red-400 border border-red-400/20'
                    }`}>
                      {bk.status === 'confirmed' ? '✓ Confirmed' : '✗ Cancelled'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-lg font-bold text-white mb-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    {bk.origin}
                    <ArrowRight className="w-4 h-4 text-white/30" />
                    {bk.destination}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(bk.travel_date + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span>{bk.departure_time} – {bk.arrival_time}</span>
                    <span>{bk.operator_name}</span>
                    <span>{bk.bus_type}</span>
                  </div>

                  {bk.passengers?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {bk.passengers.map((p, i) => (
                        <span key={i} className="text-xs glass px-2.5 py-1 rounded-full text-white/50">
                          {p.passenger_name} · Seat {p.seat_number}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-2xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    ${bk.total_amount.toFixed(2)}
                  </p>
                  {bk.status === 'confirmed' && (
                    <button
                      onClick={() => setCancelTarget(bk.booking_id)}
                      className="btn-glass text-red-400 hover:text-red-300 text-sm px-4 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <CancelBookingModal
        bookingId={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={doCancel}
      />
    </div>
  );
}
