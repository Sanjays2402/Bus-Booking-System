import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Route, DollarSign, Trash2, Eye, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import RevenueBarChart from '../components/RevenueBarChart';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'routes' | 'revenue'>('routes');
  const [routes, setRoutes] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [routeBookings, setRouteBookings] = useState<Record<number, any[]>>({});

  useEffect(() => {
    if (!user || user.role !== 'admin') { navigate('/'); return; }
    loadData();
  }, [user, navigate]);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getAdminRoutes(), api.getRevenue()])
      .then(([r, rev]) => { setRoutes(r); setRevenue(rev); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this route?')) return;
    try {
      await api.deleteRoute(id);
      setRoutes(prev => prev.filter(r => r.id !== id));
      toast.success('Route deleted');
    } catch (err: any) { toast.error(err.message); }
  };

  const viewBookings = async (routeId: number) => {
    if (expanded === routeId) { setExpanded(null); return; }
    if (!routeBookings[routeId]) {
      try {
        const bks = await api.getRouteBookings(routeId);
        setRouteBookings(prev => ({ ...prev, [routeId]: bks }));
      } catch { toast.error('Failed to load bookings'); return; }
    }
    setExpanded(routeId);
  };

  if (loading) return (
    <div className="text-center py-20">
      <div className="inline-block w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { key: 'routes' as const, label: 'Routes', icon: Route },
          { key: 'revenue' as const, label: 'Revenue', icon: DollarSign },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition ${
              tab === key ? 'btn-glow text-white' : 'btn-glass text-white/50 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'routes' && (
        <div className="space-y-3 animate-fade-in">
          {routes.map((r, idx) => (
            <div key={r.id} className="glass rounded-2xl overflow-hidden" style={{ animationDelay: `${idx * 0.03}s` }}>
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white">{r.origin} → {r.destination}</span>
                    <span className="text-xs glass px-2 py-0.5 rounded-full text-purple-300">{r.bus_type}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-white/40">
                    <span>{r.operator_name}</span>
                    <span>{r.departure_time} – {r.arrival_time}</span>
                    <span className="text-cyan-400 font-medium">${r.price_base}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => viewBookings(r.id)} className="btn-glass px-3 py-2 rounded-xl text-white/50 hover:text-white">
                    {expanded === r.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="btn-glass px-3 py-2 rounded-xl text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expanded === r.id && routeBookings[r.id] && (
                <div className="border-t border-white/5 p-5 bg-white/[0.02]">
                  {routeBookings[r.id].length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-2">No bookings yet</p>
                  ) : (
                    <div className="space-y-2">
                      {routeBookings[r.id].map((bk: any) => (
                        <div key={bk.id} className="flex justify-between text-sm">
                          <div>
                            <span className="text-white/60">{bk.user_name}</span>
                            <span className="text-white/25 ml-2">{bk.user_email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white/40">{bk.travel_date}</span>
                            <span className={bk.status === 'confirmed' ? 'text-emerald-400' : 'text-red-400'}>{bk.status}</span>
                            <span className="text-cyan-400 font-medium">${bk.total_amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'revenue' && revenue && (
        <div className="animate-fade-in">
          {/* Total Revenue Card */}
          <div className="glass-strong rounded-2xl p-8 mb-8 text-center">
            <p className="text-white/40 text-sm mb-2">Total Revenue</p>
            <p className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              ${revenue.totalRevenue.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Operator */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Revenue by Operator</h3>
              <RevenueBarChart
                data={revenue.byOperator.map((op: any) => ({
                  label: op.operator_name,
                  value: op.revenue,
                  meta: `${op.bookings} bookings`,
                }))}
              />
            </div>

            {/* By Route */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold text-white mb-4">Revenue by Route</h3>
              {revenue.byRoute.length === 0 ? (
                <p className="text-white/30 text-sm">No data</p>
              ) : (
                <div className="space-y-3">
                  {revenue.byRoute.map((rt: any, i: number) => (
                    <div key={i} className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{rt.origin} → {rt.destination}</p>
                        <p className="text-white/30 text-xs">{rt.bookings} bookings</p>
                      </div>
                      <span className="text-cyan-400 font-bold">${rt.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
