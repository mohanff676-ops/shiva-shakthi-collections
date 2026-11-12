import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingBag,
  ExternalLink,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Users,
  TrendingUp,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export function AdminLayout() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Admin signed out');
    navigate('/');
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Products', href: '/admin/products', icon: Package, exact: true },
    { label: 'Out of Stock', href: '/admin/out-of-stock', icon: AlertTriangle },
    { label: 'Deleted Items', href: '/admin/deleted-items', icon: Trash2 },
    { label: 'New Product', href: '/admin/products/new', icon: PlusCircle },
    { label: 'Orders & Inquiries', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Revenue & Sales', href: '/admin/revenue', icon: TrendingUp },
    { label: 'Admins & Users', href: '/admin/users', icon: Users },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-stone-900 border-b border-brand-gold/30 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <Link to="/admin" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-brand-maroon border border-brand-gold/40 text-brand-gold flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-heading font-bold text-base tracking-wider text-brand-gold block leading-tight">
                    {APP_NAME}
                  </span>
                  <span className="text-[10px] tracking-widest uppercase text-stone-400 block font-mono">
                    Admin Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-300 hover:text-brand-gold px-3 py-1.5 rounded-lg border border-stone-700 hover:border-brand-gold/40 transition-colors"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">
                  {profile?.full_name || 'Administrator'}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">{user?.email}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-stone-700 text-stone-300 hover:text-red-400 hover:border-red-400/50 flex items-center gap-1.5 bg-stone-800/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Row */}
        <div className="bg-stone-950 border-t border-stone-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
              {navItems.map((item) => {
                const active = isActive(item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      active
                        ? 'bg-brand-gold text-stone-950 font-bold shadow-sm'
                        : 'text-stone-300 hover:text-white hover:bg-stone-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
