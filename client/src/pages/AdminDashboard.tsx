import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Route, DollarSign, ScrollText, Ticket, Trash2, Eye, Pencil, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import RevenueBarChart from '../components/RevenueBarChart';
import RouteFormModal from '../components/RouteFormModal';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'routes' | 'revenue' | 'audit' | 'bookings'>('routes');
  const [routes, setRoutes] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [audit, setAudit] = useState<{ items: any[]; total: number } | null>(null);
  const [allBookings, setAllBookings] = useState<{ items: any[]; total: number } | null>(null);
  const [bookingsFilter, setBookingsFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [routeBookings, setRouteBookings] = useState<Record<number, any[]>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState<any>(null);

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
          { key: 'bookings' as const, label: 'Bookings', icon: Ticket },
          { key: 'revenue' as const, label: 'Revenue', icon: DollarSign },
          { key: 'audit' as const, label: 'Audit log', icon: ScrollText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              if (key === 'audit' && !audit) {
                api.getAuditLog({ limit: 50 }).then(setAudit).catch(() => toast.error('Failed to load audit log'));
              }
              if (key === 'bookings' && !allBookings) {
                api.getAllBookings({ limit: 100 }).then(setAllBookings).catch(() => toast.error('Failed to load bookings'));
              }
            }}
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
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => {
                setModalInitial(null);
                setModalOpen(true);
              }}
              className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white"
            >
              <Plus className="w-4 h-4" /> New route
            </button>
          </div>
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
                  <button
                    onClick={() => {
                      setModalInitial({
                        id: r.id,
                        busId: r.bus_id,
                        origin: r.origin,
                        destination: r.destination,
                        departureTime: r.departure_time,
                        arrivalTime: r.arrival_time,
                        durationMinutes: r.duration_minutes,
                        priceBase: r.price_base,
                        daysOfWeek: r.days_of_week,
                        active: r.active,
                      });
                      setModalOpen(true);
                    }}
                    className="btn-glass px-3 py-2 rounded-xl text-cyan-300 hover:text-cyan-200"
                    aria-label="Edit route"
                  >
                    <Pencil className="w-4 h-4" />
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
      {tab === 'bookings' && (
        <div className="animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-300" /> All bookings
                {allBookings && (
                  <span className="text-xs font-normal text-white/40">
                    ({allBookings.items.length} of {allBookings.total})
                  </span>
                )}
              </h3>
              <div className="flex gap-1">
                {(['all', 'confirmed', 'cancelled'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setBookingsFilter(f);
                      api
                        .getAllBookings({
                          status: f === 'all' ? undefined : f,
                          limit: 100,
                        })
                        .then(setAllBookings)
                        .catch(() => toast.error('Failed to load bookings'));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                      bookingsFilter === f
                        ? 'btn-glow text-white'
                        : 'btn-glass text-white/50 hover:text-white'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {!allBookings ? (
              <p className="text-white/30 text-sm">Loading…</p>
            ) : allBookings.items.length === 0 ? (
              <p className="text-white/30 text-sm">No bookings to show.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-white/80">
                  <thead className="text-xs uppercase text-white/40 border-b border-white/10">
                    <tr>
                      <th className="py-2 pr-4">Ref</th>
                      <th className="py-2 pr-4">User</th>
                      <th className="py-2 pr-4">Route</th>
                      <th className="py-2 pr-4">Travel</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.items.map((b) => (
                      <tr key={b.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 font-mono text-xs text-cyan-300">{b.booking_id}</td>
                        <td className="py-2 pr-4">
                          <div className="text-white">{b.user_name}</div>
                          <div className="text-white/40 text-xs">{b.user_email}</div>
                        </td>
                        <td className="py-2 pr-4 text-white/80">{b.origin} → {b.destination}</td>
                        <td className="py-2 pr-4 text-white/50 whitespace-nowrap">{b.travel_date}</td>
                        <td className="py-2 pr-4 text-white/90">${b.total_amount.toFixed(2)}</td>
                        <td className="py-2 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-red-500/15 text-red-300'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {tab === 'audit' && (
        <div className="animate-fade-in">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-purple-300" /> Admin actions
              {audit && (
                <span className="text-xs font-normal text-white/40">
                  (showing {audit.items.length} of {audit.total})
                </span>
              )}
            </h3>
            {!audit ? (
              <p className="text-white/30 text-sm">Loading…</p>
            ) : audit.items.length === 0 ? (
              <p className="text-white/30 text-sm">No admin actions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-white/80">
                  <thead className="text-xs uppercase text-white/40 border-b border-white/10">
                    <tr>
                      <th className="py-2 pr-4">When</th>
                      <th className="py-2 pr-4">Actor</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Entity</th>
                      <th className="py-2 pr-4">Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.items.map((row) => (
                      <tr key={row.id} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-white/50 whitespace-nowrap">{row.created_at}</td>
                        <td className="py-2 pr-4">{row.actor_email || `#${row.actor_id}`}</td>
                        <td className="py-2 pr-4 text-cyan-300">{row.action}</td>
                        <td className="py-2 pr-4">{row.entity}</td>
                        <td className="py-2 pr-4 text-white/40">{row.entity_id ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      <RouteFormModal
        open={modalOpen}
        initial={modalInitial}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}
