import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, KeyRound, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useI18n } from '../i18n';

/**
 * Reset password page. Reads ?token=... from the URL (sent in the reset
 * email) and consumes it via /api/auth/reset.
 */
export default function ResetPasswordPage() {
  const [search] = useSearchParams();
  const [token, setToken] = useState(search.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const tid = toast.loading('Updating password…');
    try {
      await api.resetPassword(token, newPassword);
      toast.success('Password updated. Please log in.', { id: tid });
      navigate('/auth');
    } catch (err: any) {
      toast.error(err.message || 'Reset failed', { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-strong rounded-3xl p-8 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-white text-center mb-2">
          {t('auth.reset.title')}
        </h1>
        <p className="text-white/40 text-center mb-8 text-sm">
          Paste the reset token you received and pick a new password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3.5 top-3.5 w-5 h-5 text-white/30" />
            <input
              type="text"
              placeholder="Reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none font-mono text-xs"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-white/30" />
            <input
              type="password"
              placeholder={t('auth.field.newPassword')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
              required
              minLength={6}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-white/30" />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="btn-glow w-full py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
          >
            {t('auth.reset.cta')}
          </button>
        </form>

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
