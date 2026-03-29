import { useState, useEffect } from 'react';
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

  const toggleSeat = (seatId: number) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status === 'booked') return;
    setSelected(prev => prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]);
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
            <div className="flex gap-6 mb-6 text-sm">
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
            </div>

            {/* Bus Shape */}
            <div className="glass rounded-2xl p-6 max-w-md mx-auto">
              {/* Driver */}
              <div className="flex justify-end mb-4">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-xs text-white/30">🚐</div>
              </div>

              {/* Seats Grid */}
              <div className="space-y-2">
                {Object.entries(rows).sort(([a], [b]) => Number(a) - Number(b)).map(([rowNum, rowSeats]) => (
                  <div key={rowNum} className="flex items-center gap-2 justify-center">
                    {Array.from({ length: maxCols }, (_, colIdx) => {
                      const seat = rowSeats.find(s => s.column_number === colIdx + 1);
                      if (!seat) return <div key={colIdx} className="w-12 h-12" />;

                      const isBooked = seat.status === 'booked';
                      const isSelected = selected.includes(seat.id);

                      // Add aisle gap
                      const addGap = !isSleeper && colIdx === 1;

                      return (
                        <div key={colIdx} className={`flex ${addGap ? 'mr-4' : ''}`}>
                          <button
                            onClick={() => toggleSeat(seat.id)}
                            disabled={isBooked}
                            className={`seat w-12 h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium
                              ${isBooked ? 'seat-booked' : isSelected ? 'seat-selected' : 'seat-available'}`}
                            title={`${seat.seat_number} (${seat.seat_type}) — $${seat.price}`}
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
