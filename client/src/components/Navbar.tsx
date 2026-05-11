import { Link, useNavigate } from 'react-router-dom';
import { Bus, User, LogOut, LayoutDashboard, HelpCircle, Tag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../i18n';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <nav className="glass-strong sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold text-white hover:text-purple-300 transition group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 transition">
            <Bus className="w-5 h-5 text-white" />
          </div>
          BusGo
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/help"
            className="hidden sm:inline-flex btn-glass items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white"
            title={t('nav.help')}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden md:inline">{t('nav.help')}</span>
          </Link>
          <Link
            to="/pricing"
            className="hidden sm:inline-flex btn-glass items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white"
            title={t('nav.pricing')}
          >
            <Tag className="w-4 h-4" />
            <span className="hidden md:inline">{t('nav.pricing')}</span>
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <>
              <Link
                to="/profile"
                className="btn-glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 hover:text-white"
              >
                <User className="w-4 h-4" />
                {user.name}
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className="btn-glass flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-purple-300 hover:text-purple-200"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.admin')}
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="btn-glass p-2 rounded-xl text-white/50 hover:text-white"
                aria-label={t('nav.signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="btn-glow px-5 py-2 rounded-xl font-semibold text-sm text-white">
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
