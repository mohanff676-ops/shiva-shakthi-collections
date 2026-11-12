import { Navigate, useLocation, Outlet, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

interface AdminRouteProps {
  children?: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, isLoading, isInitialized, signOut } = useAuth();
  const location = useLocation();

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-brand-cream/50 flex flex-col items-center justify-center p-4">
        <Spinner size="lg" className="text-brand-gold mb-3" />
        <p className="text-xs text-gray-500 font-medium tracking-wide">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  // Not logged in -> redirect to admin login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in but not an admin -> Show Access Denied UI
  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Your account (<strong className="text-gray-800">{user.email}</strong>) is authenticated as a customer. Administrator privileges are required to access this dashboard.
          </p>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-800 text-left mb-6 space-y-1">
            <p className="font-semibold">Need Admin Access?</p>
            <p className="text-[11px] leading-relaxed text-amber-900/80">
              Run the provisioning query in <code className="bg-amber-100 px-1 py-0.5 rounded">supabase/seed_admin.sql</code> inside your Supabase SQL Editor to grant admin role to your account UUID.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full flex items-center justify-center gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                Return to Store
              </Button>
            </Link>

            <Button
              variant="secondary"
              onClick={() => signOut()}
              className="flex-1 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
