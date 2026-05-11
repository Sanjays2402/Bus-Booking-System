import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { I18nProvider } from './i18n';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SearchResults from './pages/SearchResults';
import SeatSelection from './pages/SeatSelection';
import BookingPage from './pages/BookingPage';
import BookingConfirmation from './pages/BookingConfirmation';
import ProfilePage from './pages/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import HelpPage from './pages/HelpPage';

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
          </Routes>
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
