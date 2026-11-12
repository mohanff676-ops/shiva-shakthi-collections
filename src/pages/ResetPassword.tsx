import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    const res = await updatePassword(password);
    setSubmitting(false);

    if (res.success) {
      setSuccess(true);
      toast.success('Your password has been updated!');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } else {
      setFormError(res.error || 'Failed to update password. Your reset link may have expired.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Set New Password — {APP_NAME}</title>
      </Helmet>

      <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0A0C]">
        <div className="max-w-md w-full space-y-6 bg-[#121215] p-8 sm:p-10 rounded-2xl border border-white/5 shadow-luxury">
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold text-[#F7F5F0]">
              Create New Password
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#A8A29E]">
              Please enter and confirm your new secure password.
            </p>
          </div>

          {success ? (
            <div className="p-5 rounded-2xl bg-[#141418] border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-[#F7F5F0] text-base">Password Changed</h3>
              <p className="text-xs text-[#A8A29E]">
                Your password has been updated successfully. Redirecting you to sign in...
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="primary" size="sm" className="w-full font-bold min-h-[44px]">
                    Sign In Now
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
                <label className="block text-xs font-semibold text-[#A8A29E] mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
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
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
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
                className="w-full font-bold min-h-[48px]"
              >
                {isSupabaseConfigured ? 'Update Password' : 'Password Reset Disabled (Backend Unconfigured)'}
              </Button>
            </form>
          )}

          <div className="pt-4 border-t border-white/5 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-[#A8A29E] hover:text-brand-champagne transition-colors inline-flex items-center gap-1.5 min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
