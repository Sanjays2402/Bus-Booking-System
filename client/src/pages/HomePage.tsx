import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, ArrowRight, Shield, Clock, Headphones, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export default function HomePage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCities().then(setCities).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    const params = new URLSearchParams({ origin, destination });
    if (date) params.set('date', date);
    navigate(`/search?${params}`);
  };

  const today = new Date().toISOString().split('T')[0];

  const popularRoutes = [
    { from: 'Seattle', to: 'Portland', price: 25, emoji: '🌲' },
    { from: 'San Francisco', to: 'Los Angeles', price: 30, emoji: '🌉' },
    { from: 'Los Angeles', to: 'Las Vegas', price: 35, emoji: '🎰' },
    { from: 'Portland', to: 'San Francisco', price: 40, emoji: '🌊' },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-purple-300 mb-6">
              <Sparkles className="w-4 h-4" />
              Trusted by 50,000+ travelers
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent text-glow leading-tight">
              Travel Made<br />Simple
            </h1>
            <p className="text-white/50 text-lg md:text-xl mb-12 max-w-xl mx-auto">
              Book bus tickets to hundreds of destinations across the US. Fast, secure, and affordable.
            </p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="glass-strong rounded-3xl p-5 md:p-7 max-w-4xl mx-auto shadow-2xl shadow-purple-500/10 animate-fade-in-delay">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-purple-400" />
                <input
                  list="cities-from"
                  placeholder="From city"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
                />
                <datalist id="cities-from">{cities.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-cyan-400" />
                <input
                  list="cities-to"
                  placeholder="To city"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
                />
                <datalist id="cities-to">{cities.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-5 h-5 text-white/40" />
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
                />
              </div>
              <button type="submit" className="btn-glow py-3.5 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 text-base">
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Popular Routes */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Popular Routes</h2>
        <p className="text-white/40 text-center mb-10">Most booked destinations this month</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {popularRoutes.map((r, i) => (
            <button
              key={i}
              onClick={() => navigate(`/search?origin=${r.from}&destination=${r.to}`)}
              className="glass glass-card rounded-2xl p-6 text-left group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-3xl mb-3 block">{r.emoji}</span>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-white">{r.from}</span>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                <span className="font-semibold text-white">{r.to}</span>
              </div>
              <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">From ${r.price}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Secure Booking', desc: 'Your payment and data are always protected', gradient: 'from-purple-500 to-purple-600' },
            { icon: Clock, title: 'Instant Confirmation', desc: 'Get your e-ticket immediately after booking', gradient: 'from-cyan-500 to-blue-500' },
            { icon: Headphones, title: '24/7 Support', desc: 'Our team is here to help you anytime', gradient: 'from-pink-500 to-purple-500' },
          ].map(({ icon: Icon, title, desc, gradient }) => (
            <div key={title} className="glass glass-card rounded-2xl p-8 text-center">
              <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
              <p className="text-white/40">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="glass-strong mt-16 py-8 text-center text-sm text-white/30">
        <p>© 2024 BusGo. Built with ❤️ by Sanjay Santhanam</p>
      </footer>
    </div>
  );
}
