import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight, Shield } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);

    if (res.success) {
      toast.success('Welcome back to Shiva Shakthi Collections!');
      navigate(redirectPath, { replace: true });
    } else {
      setFormError(res.error || 'Failed to sign in. Please verify your credentials.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In — {APP_NAME}</title>
      </Helmet>

      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0A0C]">
        <div className="max-w-md w-full space-y-8 bg-[#121215] p-8 sm:p-10 rounded-2xl border border-white/5 shadow-luxury">
          {/* Header */}
          <div className="text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-champagne uppercase">
              Shiva Shakthi Collections
            </span>
            <h1 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-[#F7F5F0]">
              Customer Sign In
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#A8A29E]">
              Access your order history and manage your jewellery preferences.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl bg-[#141418] border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">Supabase Backend Unconfigured</p>
                <p className="text-[11px] leading-relaxed text-[#A8A29E]">
                  Authentication requires configuring <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">VITE_SUPABASE_URL</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">VITE_SUPABASE_ANON_KEY</code> in your environment file. Browsing and WhatsApp ordering remain fully available.
                </p>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] min-h-[44px]"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#78716C]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#A8A29E]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-champagne hover:text-brand-champagne-light transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] min-h-[44px]"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#78716C]" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              disabled={!isSupabaseConfigured || submitting}
              className="w-full flex items-center justify-center gap-2 font-bold min-h-[48px]"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSupabaseConfigured ? 'Sign In' : 'Sign In Disabled (Backend Unconfigured)'}</span>
            </Button>
          </form>

          {/* Registration Prompt */}
          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-xs sm:text-sm text-[#A8A29E]">
              Don&apos;t have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-champagne hover:text-brand-champagne-light transition-colors inline-flex items-center gap-1 min-h-[44px]"
              >
                Create Account <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>

          {/* Admin link */}
          <div className="pt-2 text-center">
            <Link
              to="/admin/login"
              className="text-xs font-medium text-[#78716C] hover:text-brand-champagne inline-flex items-center gap-1.5 transition-colors min-h-[44px]"
            >
              <Shield className="w-3.5 h-3.5" />
              Store Administrator Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
