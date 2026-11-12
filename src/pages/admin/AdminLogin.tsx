import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Shield, Mail, Lock, AlertCircle, ArrowLeft, Terminal } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { signIn, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = (location.state as any)?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError('Please enter administrative email and password.');
      return;
    }

    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);

    if (res.success) {
      // Re-read current auth state
      // Note: role is updated inside signIn
      const currentIsAdmin = useAuthStore.getState().isAdmin;

      if (currentIsAdmin) {
        toast.success('Admin authentication verified. Welcome to Shiva Shakthi Portal.');
        navigate(redirectPath, { replace: true });
      } else {
        setFormError(
          'Authentication succeeded, but this account lacks Administrator permissions. ' +
          'Please run supabase/seed_admin.sql in your Supabase SQL Editor to grant admin role.'
        );
      }
    } else {
      setFormError(res.error || 'Invalid administrator credentials.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Administrator Login — {APP_NAME}</title>
      </Helmet>

      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-stone-900 via-stone-900 to-black text-white">
        <div className="max-w-md w-full space-y-6 bg-stone-950 p-8 sm:p-10 rounded-2xl border border-brand-gold/30 shadow-2xl">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-maroon border border-brand-gold/40 text-brand-gold flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Shield className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.25em] text-brand-gold uppercase">
              Shiva Shakthi Collections
            </span>
            <h1 className="mt-1 font-heading text-2xl font-bold text-white">
              Administrator Portal
            </h1>
            <p className="mt-1 text-xs text-stone-400">
              Authorized personnel only. Role verification is enforced.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-600/40 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-300">Supabase Backend Unconfigured</p>
                <p className="text-[11px] leading-relaxed text-amber-200/80">
                  Configure <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-100">VITE_SUPABASE_URL</code> and <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-100">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-amber-900/60 px-1 py-0.5 rounded text-amber-100">.env</code> to activate live database administration.
                </p>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-700/60 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shivashakthi.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                />
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-stone-900 border border-stone-800 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/50 focus:border-brand-gold"
                />
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-stone-500" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              disabled={!isSupabaseConfigured || submitting}
              className="w-full bg-brand-gold hover:bg-brand-gold-600 text-stone-950 font-bold border-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSupabaseConfigured ? 'Verify & Enter Dashboard' : 'Admin Login Disabled (Backend Unconfigured)'}
            </Button>
          </form>

          {/* Setup Hint */}
          <div className="p-3 bg-stone-900/80 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1">
            <span className="font-semibold text-stone-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-brand-gold" />
              First Time Setup Note
            </span>
            <p className="leading-relaxed">
              New accounts registered default to <code className="text-brand-gold">customer</code>. Use <code className="text-stone-200">supabase/seed_admin.sql</code> to assign <code className="text-brand-gold">admin</code> role in Supabase.
            </p>
          </div>

          <div className="pt-2 border-t border-stone-800 text-center">
            <Link
              to="/"
              className="text-xs font-medium text-stone-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
