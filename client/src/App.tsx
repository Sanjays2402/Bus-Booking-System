import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Bus, User, LogOut, LayoutDashboard } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import SearchResults from './pages/SearchResults';
import SeatSelection from './pages/SeatSelection';
import BookingPage from './pages/BookingPage';
import BookingConfirmation from './pages/BookingConfirmation';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';

function BackgroundOrbs() {
  return (
    <>
      <div className="bg-orb" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent)', top: '-10%', left: '-5%' }} />
      <div className="bg-orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent)', bottom: '-10%', right: '-5%' }} />
      <div className="bg-orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.15), transparent)', top: '40%', left: '50%' }} />
    </>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="glass-strong sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-xl font-bold text-white hover:text-purple-300 transition group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 transition">
            <Bus className="w-5 h-5 text-white" />
          </div>
          BusGo
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="btn-glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white">
                <User className="w-4 h-4" />
                {user.name}
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-purple-300 hover:text-purple-200">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <button onClick={() => { logout(); navigate('/'); }} className="btn-glass p-2 rounded-xl text-white/50 hover:text-white">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-glow px-5 py-2 rounded-xl font-semibold text-sm text-white">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen relative">
      <BackgroundOrbs />
      <div className="relative z-10">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/seats/:routeId" element={<SeatSelection />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/confirmed" element={<BookingConfirmation />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(30, 15, 60, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
