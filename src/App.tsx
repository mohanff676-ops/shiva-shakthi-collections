import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import Layout from '@/components/layout/Layout';
import ScrollToTop from '@/components/layout/ScrollToTop';

// Customer Pages
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Wishlist from '@/pages/Wishlist';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
import ShippingReturns from '@/pages/policies/ShippingReturns';
import PrivacyPolicy from '@/pages/policies/PrivacyPolicy';
import Terms from '@/pages/policies/Terms';
import NotFound from '@/pages/NotFound';

// Auth & Account Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Account from '@/pages/Account';

// Admin Pages
import AdminLogin from '@/pages/admin/AdminLogin';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminProducts from '@/pages/admin/Products';
import AdminProductEdit from '@/pages/admin/ProductEdit';
import AdminOrders from '@/pages/admin/Orders';
import AdminDeletedItems from '@/pages/admin/DeletedItems';
import AdminOutOfStock from '@/pages/admin/OutOfStock';
import AdminUsers from '@/pages/admin/Users';
import AdminRevenue from '@/pages/admin/Revenue';

// Route Guards
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';

// Components & Stores
import CartDrawer from '@/components/cart/CartDrawer';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ── Public Storefront Routes ── */}
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="shop/:category" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="shipping-returns" element={<ShippingReturns />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<Terms />} />

          {/* Customer Authentication */}
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />

          {/* Protected Customer Dashboard */}
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />

          {/* Policy & legacy redirects */}
          <Route path="shipping-policy" element={<Navigate to="/shipping-returns" replace />} />
          <Route path="return-policy" element={<Navigate to="/shipping-returns" replace />} />
          <Route path="checkout" element={<Navigate to="/cart" replace />} />
        </Route>

        {/* ── Dedicated Admin Portal Routes ── */}
        <Route path="admin/login" element={<AdminLogin />} />

        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductEdit />} />
          <Route path="products/edit/:id" element={<AdminProductEdit />} />
          <Route path="out-of-stock" element={<AdminOutOfStock />} />
          <Route path="deleted-items" element={<AdminDeletedItems />} />
          <Route path="products/deleted" element={<Navigate to="/admin/deleted-items" replace />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="analytics" element={<Navigate to="/admin/revenue" replace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="admins" element={<Navigate to="/admin/users" replace />} />
        </Route>

        {/* ── 404 Catch-All ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Cart drawer — always mounted at root level */}
      <CartDrawer />
    </>
  );
}
