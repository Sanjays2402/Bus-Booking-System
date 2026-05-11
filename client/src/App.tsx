import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { I18nProvider } from './i18n';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';

// Route-level code splitting. Each route becomes its own JS chunk so the
// landing page only pays for HomePage + shell on first paint.
const SearchResults = lazy(() => import('./pages/SearchResults'));
const SeatSelection = lazy(() => import('./pages/SeatSelection'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const BookingConfirmation = lazy(() => import('./pages/BookingConfirmation'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-32" role="status" aria-label="Loading">
      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <>
      <div className="bg-orb" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.3), transparent)', top: '-10%', left: '-5%' }} />
      <div className="bg-orb" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(6,182,212,0.2), transparent)', bottom: '-10%', right: '-5%' }} />
      <div className="bg-orb" style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(168,85,247,0.15), transparent)', top: '40%', left: '50%' }} />
    </>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen relative flex flex-col">
      <BackgroundOrbs />
      <div className="relative z-10 flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/seats/:routeId" element={<SeatSelection />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking/confirmed" element={<BookingConfirmation />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot" element={<ForgotPasswordPage />} />
            <Route path="/reset" element={<ResetPasswordPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </main>
        <Footer />
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
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
