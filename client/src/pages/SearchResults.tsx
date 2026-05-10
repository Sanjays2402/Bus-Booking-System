import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, Star, Wifi, Filter, ArrowRight, Zap, Info } from 'lucide-react';
import { api } from '../lib/api';
import { Route } from '../types';
import BusDetailsDrawer from '../components/BusDetailsDrawer';

export default function SearchResults() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('departure');
  const [busTypeFilter, setBusTypeFilter] = useState('');
  const [detailsRoute, setDetailsRoute] = useState<Route | null>(null);

  const origin = params.get('origin') || '';
  const destination = params.get('destination') || '';
  const date = params.get('date') || '';

  useEffect(() => {
    setLoading(true);
    const searchParams: Record<string, string> = { origin, destination, sortBy };
    if (date) searchParams.date = date;
    if (busTypeFilter) searchParams.busType = busTypeFilter;
    api.searchRoutes(searchParams).then(setRoutes).catch(() => setRoutes([])).finally(() => setLoading(false));
  }, [origin, destination, date, sortBy, busTypeFilter]);

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          {origin}
          <ArrowRight className="w-6 h-6 text-purple-400" />
          {destination}
        </h1>
        {date && (
          <p className="text-white/40 mt-2">
            {new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <p className="text-white/30 text-sm mt-1">{routes.length} bus{routes.length !== 1 ? 'es' : ''} found</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 animate-fade-in">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="w-4 h-4 text-purple-400" />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="glass-input rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="departure">Departure Time</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="duration">Duration</option>
          <option value="rating">Rating</option>
        </select>
        <select value={busTypeFilter} onChange={e => setBusTypeFilter(e.target.value)} className="glass-input rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="">All Bus Types</option>
          <option value="AC Seater">AC Seater</option>
          <option value="Non-AC Seater">Non-AC Seater</option>
          <option value="AC Sleeper">AC Sleeper</option>
          <option value="Non-AC Sleeper">Non-AC Sleeper</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/40 mt-4">Searching buses...</p>
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl">
          <p className="text-white/50 text-lg">No buses found for this route</p>
          <button onClick={() => navigate('/')} className="mt-4 text-purple-400 hover:text-purple-300 transition">← Try a different search</button>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route, idx) => {
            const amenities: string[] = JSON.parse(route.amenities || '[]');
            return (
              <div
                key={route.id}
                className="glass glass-card rounded-2xl p-6 animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-bold text-lg text-white">{route.operator_name}</span>
                      <span className="text-xs glass px-2.5 py-1 rounded-full text-purple-300 font-medium">{route.bus_type}</span>
                      <span className="text-xs text-white/25">{route.bus_number}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="font-bold text-2xl text-white">{route.departure_time}</p>
                        <p className="text-xs text-white/30 mt-0.5">{origin}</p>
                      </div>
                      <div className="flex-1 flex flex-col items-center px-4">
                        <span className="text-xs text-white/30 flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(route.duration_minutes)}
                        </span>
                        <div className="w-full h-px bg-gradient-to-r from-purple-500/50 via-white/20 to-cyan-500/50 relative">
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full shadow-lg shadow-purple-400/50" />
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-2xl text-white">{route.arrival_time}</p>
                        <p className="text-xs text-white/30 mt-0.5">{destination}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-1 text-yellow-400 text-sm">
                        <Star className="w-4 h-4 fill-current" />
                        <span>{route.rating}</span>
                      </div>
                      {amenities.includes('WiFi') && (
                        <div className="flex items-center gap-1 text-white/30 text-xs">
                          <Wifi className="w-3.5 h-3.5" />
                          WiFi
                        </div>
                      )}
                      {route.available_seats !== undefined && (
                        <span className={`text-xs font-semibold flex items-center gap-1 ${route.available_seats <= 5 ? 'text-red-400' : 'text-emerald-400'}`}>
                          <Zap className="w-3 h-3" />
                          {route.available_seats} seats left
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div>
                      <p className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">${route.price_base}</p>
                      <p className="text-xs text-white/25 text-right">per seat</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailsRoute(route)}
                        className="btn-glass px-3 py-2.5 rounded-xl font-semibold text-white/80 text-sm inline-flex items-center gap-1.5"
                        aria-label={`View details for ${route.operator_name}`}
                      >
                        <Info className="w-4 h-4" />
                        Details
                      </button>
                      <button
                        onClick={() => navigate(`/seats/${route.id}?date=${date || new Date().toISOString().split('T')[0]}`)}
                        className="btn-glow px-7 py-2.5 rounded-xl font-bold text-white text-sm"
                      >
                        Select Seats
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <BusDetailsDrawer route={detailsRoute} onClose={() => setDetailsRoute(null)} />
    </div>
  );
}
