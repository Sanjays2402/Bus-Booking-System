import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const tid = toast.loading(isLogin ? 'Signing in…' : 'Creating your account…');
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, name, password);
      }
      toast.success(isLogin ? 'Welcome back!' : 'Account created!', { id: tid });
      navigate('/');
    } catch (err: any) {
      toast.error(err.message, { id: tid });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="glass-strong rounded-3xl p-8 animate-fade-in">
        <h1 className="text-2xl font-extrabold text-white text-center mb-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-white/40 text-center mb-8 text-sm">
          {isLogin ? 'Sign in to manage your bookings' : 'Join BusGo for easy booking'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <UserPlus className="absolute left-3.5 top-3.5 w-5 h-5 text-white/30" />
              <input
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
                required={!isLogin}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-white/30" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-white/30" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 glass-input rounded-xl outline-none"
              required
              minLength={6}
            />
          </div>
          {isLogin && (
            <div className="flex justify-end -mt-2">
              <Link
                to="/forgot"
                className="text-xs text-purple-300 hover:text-purple-200"
              >
                Forgot password?
              </Link>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-glow w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <><LogIn className="w-5 h-5" /> Sign In</>
            ) : (
              <><UserPlus className="w-5 h-5" /> Create Account</>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-white/40">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => setIsLogin(!isLogin)} className="text-purple-400 hover:text-purple-300 ml-1 font-medium">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

        {isLogin && (
          <div className="mt-6 glass rounded-xl p-4 text-xs text-white/30">
            <p className="font-medium text-white/50 mb-1">Demo Accounts</p>
            <p>User: demo@example.com / user123</p>
            <p>Admin: admin@busbooking.com / admin123</p>
          </div>
        )}
      </div>
    </div>
  );
}
