import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useI18n } from '../i18n';

/**
 * Forgot-password page. POSTs to /api/auth/forgot which (in dev) returns the
 * reset token directly so the demo flow is self-contained. In production
 * the API would email the token instead.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading('Sending reset link…');
    try {
      const res = await api.forgotPassword(email);
      toast.success('Check your inbox (or scroll down in dev).', { id: tid });
      if (res.devToken) setDevToken(res.devToken);
    } catch (err: any) {
      toast.error(err.message || 'Request failed', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-strong rounded-3xl p-8 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-white text-center mb-2">
          {t('auth.forgot.title')}
        </h1>
        <p className="text-white/40 text-center mb-8 text-sm">
          Enter your account email and we'll send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-white/30" />
            <input
              type="email"
              placeholder={t('auth.field.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
          >
            {t('auth.forgot.cta')}
          </button>
        </form>

        {devToken && (
          <div className="mt-6 p-4 rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-100 text-sm">
            <p className="font-semibold flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> Dev-only reset token
            </p>
            <p className="mt-1 text-xs text-amber-100/80">
              Your server is running in non-production mode, so we surface the
              token here instead of emailing it.
            </p>
            <code className="mt-2 block break-all text-xs bg-black/30 rounded p-2 select-all">
              {devToken}
            </code>
            <Link
              to={`/reset?token=${devToken}`}
              className="mt-3 inline-block btn-glow px-4 py-2 rounded-lg text-xs font-semibold text-white"
            >
              Continue to reset →
            </Link>
          </div>
        )}

        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Link>
      </div>
    </div>
  );
}
