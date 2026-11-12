import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Spinner size="lg" className="text-brand-gold mb-3" />
        <p className="text-xs text-gray-500 font-medium tracking-wide">
          Verifying secure session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
