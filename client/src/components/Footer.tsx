import { Bus, Github, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="glass-strong mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            BusGo
          </div>
          <p className="mt-3 text-sm text-white/60">
            {t('footer.tagline')}
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Travel</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li>Search routes</li>
            <li>Popular cities</li>
            <li>Live deals</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li>My bookings</li>
            <li>
              <Link to="/pricing" className="hover:text-white">
                {t('footer.pricing')}
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-white">
                {t('footer.help')}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Project</h4>
          <a
            href="https://github.com/Sanjays2402/Bus-Booking-System"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50 flex items-center justify-center gap-1.5">
        <span>Built with</span>
        <Heart className="w-3.5 h-3.5 text-pink-400" />
        <span>· © {new Date().getFullYear()} BusGo</span>
      </div>
    </footer>
  );
}
