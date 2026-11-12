import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { KeyRound, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    const res = await resetPassword(email);
    setSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setFormError(res.error || 'Failed to send reset link. Please verify your email.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Reset Password — {APP_NAME}</title>
      </Helmet>

      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0A0C]">
        <div className="max-w-md w-full space-y-6 bg-[#121215] p-8 sm:p-10 rounded-2xl border border-white/5 shadow-luxury">
          <div className="text-center">
            <div className="w-12 h-12 bg-[#C5A059]/10 text-brand-champagne rounded-2xl flex items-center justify-center mx-auto mb-3 border border-[#C5A059]/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#F7F5F0]">
              Reset Your Password
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#A8A29E]">
              Enter your account email and we will send you a secure link to reset your password.
            </p>
          </div>

          {!isSupabaseConfigured && (
            <div className="p-3.5 rounded-xl bg-[#141418] border border-amber-500/30 text-xs text-amber-300">
              Supabase authentication credentials are required to dispatch password reset emails.
            </div>
          )}

          {submitted ? (
            <div className="p-5 rounded-2xl bg-[#141418] border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-[#F7F5F0] text-base">Check Your Inbox</h3>
              <p className="text-xs text-[#A8A29E] leading-relaxed">
                If an account exists for <strong className="font-bold text-[#F7F5F0]">{email}</strong>, we have dispatched a password reset link. Please click the link in your email to choose a new password.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#A8A29E] mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#141418] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 text-[#F7F5F0] placeholder-[#78716C] min-h-[44px]"
                  />
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-[#78716C]" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={submitting}
                disabled={!isSupabaseConfigured || submitting}
                className="w-full font-bold min-h-[48px]"
              >
                {isSupabaseConfigured ? 'Send Reset Link' : 'Reset Disabled (Backend Unconfigured)'}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#A8A29E] hover:text-brand-champagne transition-colors inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
