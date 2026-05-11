import { useState, useEffect, useRef, useMemo, KeyboardEvent } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { Seat, Route as RouteType } from '../types';
import toast from 'react-hot-toast';

export default function SeatSelection() {
  const { routeId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const date = params.get('date') || new Date().toISOString().split('T')[0];
  const [route, setRoute] = useState<RouteType | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockedByOther, setLockedByOther] = useState<Set<number>>(new Set());

  // Poll for locks held by other users every 8s so the seat map stays current.
  useEffect(() => {
    if (!routeId) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const res: any = await api.getSeatLocks(Number(routeId), date);
        if (cancelled) return;
        const mine = new Set(selected);
        const others = new Set<number>(
          (res?.locks || res || [])
            .map((l: any) => l.seatId)
            .filter((id: number) => !mine.has(id)),
        );
        setLockedByOther(others);
      } catch {
        /* ignore polling errors */
      }
    };
    refresh();
    const handle = setInterval(refresh, 8000);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [routeId, date, selected]);

  // Release our locks on unmount
  useEffect(() => {
    return () => {
      if (routeId && selected.length > 0) {
        api
          .releaseSeatLocks(Number(routeId), date, selected)
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!routeId) return;
    Promise.all([
      api.getRoute(Number(routeId)),
      api.getSeats(Number(routeId), date),
    ]).then(([r, s]) => {
      setRoute(r);
      setSeats(s);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [routeId, date]);

  const toggleSeat = async (seatId: number) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'booked') return;
    if (lockedByOther.has(seatId)) {
      toast.error('Another rider is holding this seat — try again in a minute.');
      return;
    }
    const isSelected = selected.includes(seatId);
    if (isSelected) {
      setSelected(prev => prev.filter(id => id !== seatId));
      if (routeId) api.releaseSeatLocks(Number(routeId), date, [seatId]).catch(() => {});
      return;
    }
    try {
      if (routeId) await api.claimSeatLocks(Number(routeId), date, [seatId]);
      setSelected(prev => [...prev, seatId]);
    } catch (err: any) {
      toast.error(err?.message || 'Seat already held');
    }
  };

  const selectedSeats = seats.filter(s => selected.includes(s.id));
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  // Group seats by row
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row_number]) acc[seat.row_number] = [];
    acc[seat.row_number].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  const maxCols = Math.max(...seats.map(s => s.column_number), 0);
  const isSleeper = route?.bus_type?.includes('Sleeper');

  // Sorted seats for keyboard navigation (row, col)
  const sortedSeats = useMemo(
    () => [...seats].sort((a, b) => a.row_number - b.row_number || a.column_number - b.column_number),
    [seats],
  );
  const seatRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [focusId, setFocusId] = useState<number | null>(null);

  const focusSeat = (seatId: number) => {
    setFocusId(seatId);
    const el = seatRefs.current[seatId];
    el?.focus();
  };

  const handleSeatKey = (e: KeyboardEvent<HTMLButtonElement>, seat: Seat) => {
    const idx = sortedSeats.findIndex((s) => s.id === seat.id);
    if (idx < 0) return;
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = Math.min(sortedSeats.length - 1, idx + 1);
    else if (e.key === 'ArrowLeft') nextIdx = Math.max(0, idx - 1);
    else if (e.key === 'ArrowDown') {
      const next = sortedSeats.find(
        (s, i) => i > idx && s.row_number > seat.row_number && s.column_number === seat.column_number,
      );
      if (next) nextIdx = sortedSeats.indexOf(next);
    } else if (e.key === 'ArrowUp') {
      const next = [...sortedSeats]
        .reverse()
        .find(
          (s) =>
            s.row_number < seat.row_number && s.column_number === seat.column_number,
        );
      if (next) nextIdx = sortedSeats.indexOf(next);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSeat(seat.id);
      return;
    }
    if (nextIdx != null) {
      e.preventDefault();
      focusSeat(sortedSeats[nextIdx].id);
    }
  };

  const handleProceed = () => {
    if (!user) {
      toast.error('Please login first');
      return navigate('/auth');
    }
    if (selected.length === 0) return toast.error('Select at least one seat');
    navigate('/booking', {
      state: { routeId: Number(routeId), date, route, selectedSeats, totalPrice }
    });
  };

  if (loading) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!route) return <div className="text-center py-20 text-white/40">Route not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Route Info */}
      <div className="glass rounded-2xl p-6 mb-8 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              {route.origin} <ArrowRight className="w-5 h-5 text-purple-400" /> {route.destination}
            </h1>
            <p className="text-white/40 mt-1">{route.operator_name} · {route.bus_type} · {route.departure_time} – {route.arrival_time}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/30">Travel Date</p>
            <p className="font-semibold text-white">{new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-2 animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6">Select Your Seats</h2>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm" aria-label="Seat legend">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg seat-available" />
                <span className="text-white/50">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg seat-selected" />
                <span className="text-white/50">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg seat-booked" />
                <span className="text-white/50">Booked</span>
              </div>
              <div className="text-white/40 text-xs italic ml-auto self-center">
                Tip: use ← ↑ → ↓ to navigate, Enter to toggle
              </div>
            </div>

            {/* Bus Shape */}
            <div className="glass rounded-2xl p-6 max-w-md mx-auto">
              {/* Driver */}
              <div className="flex justify-end mb-4">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-xs text-white/30">🚐</div>
              </div>

              {/* Seats Grid */}
              <div className="space-y-2" role="grid" aria-label="Seat selection grid">
                {Object.entries(rows).sort(([a], [b]) => Number(a) - Number(b)).map(([rowNum, rowSeats]) => (
                  <div key={rowNum} className="flex items-center gap-2 justify-center" role="row">
                    {Array.from({ length: maxCols }, (_, colIdx) => {
                      const seat = rowSeats.find(s => s.column_number === colIdx + 1);
                      if (!seat) return <div key={colIdx} className="w-12 h-12" />;
                      const idx = sortedSeats.findIndex((s) => s.id === seat.id);

                      const isBooked = seat.status === 'booked';
                      const isSelected = selected.includes(seat.id);
                      const isHeldByOther = lockedByOther.has(seat.id);
                      const isDisabled = isBooked || isHeldByOther;

                      // Add aisle gap
                      const addGap = !isSleeper && colIdx === 1;

                      return (
                        <div key={colIdx} className={`flex ${addGap ? 'mr-4' : ''}`} role="gridcell">
                          <button
                            ref={(el) => {
                              seatRefs.current[seat.id] = el;
                            }}
                            onClick={() => toggleSeat(seat.id)}
                            onKeyDown={(e) => handleSeatKey(e, seat)}
                            onFocus={() => setFocusId(seat.id)}
                            disabled={isDisabled}
                            tabIndex={isDisabled ? -1 : focusId === seat.id || (focusId == null && idx === 0) ? 0 : -1}
                            aria-label={`Seat ${seat.seat_number}, ${seat.seat_type}, $${seat.price}, ${
                              isBooked ? 'booked' : isHeldByOther ? 'held by another rider' : isSelected ? 'selected' : 'available'
                            }`}
                            aria-pressed={isSelected}
                            className={`seat w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/70
                              ${isBooked ? 'seat-booked' : isHeldByOther ? 'seat-held' : isSelected ? 'seat-selected' : 'seat-available'}`}
                            title={`${seat.seat_number} (${seat.seat_type}) — $${seat.price}${isHeldByOther ? ' — held by another rider' : ''}`}
                          >
                            <span className="text-[10px]">{seat.seat_number}</span>
                            <span className="text-[8px] opacity-60">${seat.price}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Seat type info */}
            <div className="flex items-start gap-2 mt-6 text-xs text-white/30">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Window seats and front rows have a premium. Prices shown on each seat.</p>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="animate-fade-in-delay">
          <div className="glass-strong rounded-2xl p-6 sticky top-20">
            <h3 className="text-lg font-bold text-white mb-4">Booking Summary</h3>
            {selectedSeats.length === 0 ? (
              <p className="text-white/30 text-sm py-8 text-center">Select seats to continue</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {selectedSeats.map(seat => (
                    <div key={seat.id} className="flex justify-between text-sm">
                      <div>
                        <span className="text-white font-medium">Seat {seat.seat_number}</span>
                        <span className="text-white/30 ml-2">{seat.seat_type}</span>
                      </div>
                      <span className="text-white">${seat.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 mb-6">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
                <button onClick={handleProceed} className="btn-glow w-full py-3 rounded-xl font-bold text-white">
                  Continue to Book
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
