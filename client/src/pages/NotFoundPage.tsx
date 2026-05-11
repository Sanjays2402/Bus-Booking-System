import { Link } from 'react-router-dom';
import { Bus, Home } from 'lucide-react';

/**
 * Animated 404 page. Pure CSS animation (no JS frame loop) so it is light
 * weight on the bundle and respects prefers-reduced-motion via Tailwind.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 animate-fade-in">
      <div className="relative w-72 h-32 mb-8" aria-hidden="true">
        <div className="absolute inset-x-0 bottom-2 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute bottom-3 nf-bus motion-safe:animate-[nfDrive_6s_ease-in-out_infinite]">
          <Bus className="w-16 h-16 text-purple-300 drop-shadow-[0_0_18px_rgba(168,85,247,0.55)]" />
        </div>
      </div>

      <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
        404
      </h1>
      <p className="text-white/80 text-lg mt-2 mb-1">
        That stop isn’t on our route.
      </p>
      <p className="text-white/40 text-sm mb-8 max-w-md">
        The page you’re looking for might have been moved, renamed, or never
        existed. Catch the next bus back to the home page.
      </p>

      <Link
        to="/"
        className="btn-glow px-6 py-3 rounded-xl font-semibold text-white inline-flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        Back to home
      </Link>

      <style>{`
        @keyframes nfDrive {
          0%   { transform: translateX(-90px) }
          45%  { transform: translateX(180px) }
          50%  { transform: translateX(180px) scaleX(-1) }
          95%  { transform: translateX(-90px) scaleX(-1) }
          100% { transform: translateX(-90px) }
        }
      `}</style>
    </div>
  );
}
