import { useEffect, useState } from 'react';
import { X, Star, Wifi, Power, Coffee, Snowflake, Loader2 } from 'lucide-react';
import { Route } from '../types';

interface BusDetailsDrawerProps {
  route: Route | null;
  onClose: () => void;
}

interface ReviewsResp {
  count: number;
  average: number | null;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    user_name: string;
  }>;
}

const amenityIcon: Record<string, JSX.Element> = {
  WiFi: <Wifi className="w-3.5 h-3.5" />,
  'USB Charging': <Power className="w-3.5 h-3.5" />,
  'Power Outlets': <Power className="w-3.5 h-3.5" />,
  'AC Seater': <Snowflake className="w-3.5 h-3.5" />,
  Snacks: <Coffee className="w-3.5 h-3.5" />,
};

export default function BusDetailsDrawer({ route, onClose }: BusDetailsDrawerProps) {
  const [reviews, setReviews] = useState<ReviewsResp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!route) return;
    setLoading(true);
    setReviews(null);
    fetch(`/api/routes/${route.id}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setReviews)
      .catch(() => setReviews(null))
      .finally(() => setLoading(false));
  }, [route]);

  if (!route) return null;
  const amenities: string[] = JSON.parse(route.amenities || '[]');

  return (
    <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="flex-1 bg-black/60 backdrop-blur-sm"
      />
      <aside className="w-full max-w-md h-full overflow-y-auto glass-strong border-l border-white/10 p-6 animate-fade-in">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
              {route.bus_type}
            </p>
            <h2 className="text-xl font-bold text-white mt-1">{route.operator_name}</h2>
            <p className="text-xs text-white/40">{route.bus_number}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-glass p-2 rounded-xl text-white/70"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xs text-white/50">Departs</p>
            <p className="text-base font-bold text-white">{route.departure_time}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xs text-white/50">Arrives</p>
            <p className="text-base font-bold text-white">{route.arrival_time}</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-xs text-white/50">From</p>
            <p className="text-base font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ${route.price_base}
            </p>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-white mb-2">Amenities</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {amenities.length === 0 && (
            <span className="text-xs text-white/40">No amenities listed</span>
          )}
          {amenities.map((a) => (
            <span
              key={a}
              className="glass px-3 py-1.5 rounded-full text-xs text-white/80 inline-flex items-center gap-1.5"
            >
              {amenityIcon[a] ?? null}
              {a}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Reviews</h3>
          <div className="flex items-center gap-1 text-yellow-400 text-sm">
            <Star className="w-4 h-4 fill-current" />
            <span>{reviews?.average ?? route.rating}</span>
            {reviews && (
              <span className="text-white/40 text-xs ml-1">
                ({reviews.count} review{reviews.count === 1 ? '' : 's'})
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading reviews…
          </div>
        ) : reviews && reviews.reviews.length > 0 ? (
          <ul className="space-y-3">
            {reviews.reviews.slice(0, 5).map((r) => (
              <li key={r.id} className="glass rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{r.user_name}</span>
                  <span className="text-xs text-yellow-400 inline-flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" /> {r.rating}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">{r.comment}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-white/40">No reviews yet — be the first after your trip.</p>
        )}
      </aside>
    </div>
  );
}
