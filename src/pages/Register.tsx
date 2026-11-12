import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { UserPlus, Mail, Lock, User, Phone, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    const res = await signUp(email, password, fullName, phone);
    setSubmitting(false);

    if (res.success) {
      toast.success('Your customer account was successfully created!');
      navigate('/account', { replace: true });
    } else {
      setFormError(res.error || 'Failed to create account. Please try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Create an Account — {APP_NAME}</title>
      </Helmet>

      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0A0C]">
        <div className="max-w-md w-full space-y-8 bg-[#121215] p-8 sm:p-10 rounded-2xl border border-white/5 shadow-luxury">
          {/* Header */}
          <div className="text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] text-brand-champagne uppercase">
              Shiva Shakthi Collections
            </span>
            <h1 className="mt-2 font-heading text-2xl sm:text-3xl font-bold text-[#F7F5F0]">
              Create Account
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#A8A29E]">
              Join Shiva Shakthi Collections to view your WhatsApp order records.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl bg-[#141418] border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">Supabase Backend Unconfigured</p>
                <p className="text-[11px] leading-relaxed text-[#A8A29E]">
                  Authentication requires configuring <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">VITE_SUPABASE_URL</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-amber-200">VITE_SUPABASE_ANON_KEY</code> in your environment file.
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] min-h-[44px]"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#78716C]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                Email Address <span className="text-rose-400">*</span>
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
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] min-h-[44px]"
                />
                <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#78716C]" />
              </div>
              <p className="text-[10px] text-[#78716C] mt-1">Used to link WhatsApp order inquiries to your account.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] min-h-[44px]"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#78716C]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                Confirm Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] min-h-[44px]"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#78716C]" />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                disabled={!isSupabaseConfigured || submitting}
                className="w-full flex items-center justify-center gap-2 font-bold min-h-[48px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSupabaseConfigured ? 'Create Account' : 'Registration Disabled (Backend Unconfigured)'}</span>
              </Button>
            </div>
          </form>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 text-[11px] text-[#A8A29E] justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-champagne" />
            <span>Your credentials are encrypted & protected by Supabase Auth</span>
          </div>

          {/* Login prompt */}
          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-xs sm:text-sm text-[#A8A29E]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-brand-champagne hover:text-brand-champagne-light transition-colors inline-flex items-center gap-1 min-h-[44px]"
              >
                Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
