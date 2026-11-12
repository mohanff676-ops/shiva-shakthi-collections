import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Heart,
  ShoppingBag,
  MessageCircle,
  User,
  Shield,
  LogOut,
  LogIn,
  UserPlus,
  Instagram,
  Youtube,
  ExternalLink,
  Sparkles,
  Phone,
  Home as HomeIcon,
  Gem,
  Compass,
} from 'lucide-react';
import { APP_NAME, WHATSAPP_NUMBER, SOCIAL_LINKS } from '@/lib/constants';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { whatsappUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const location = useLocation();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const { user, profile, isAdmin, isAuthenticated, signOut } = useAuth();

  // Prevent background page scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    onClose();
    await signOut();
    toast.success('Signed out successfully');
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    onClose();
    if (href === '/') {
      if (location.pathname === '/' && !location.hash) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (href.includes('#')) {
      const [path, hash] = href.split('#');
      const targetPath = path || '/';
      if (location.pathname === targetPath) {
        e.preventDefault();
        const elem = document.getElementById(hash);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', `#${hash}`);
        }
      }
    }
  };

  const handleCartClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onClose();
    toggleCart();
  };

  const conciergeUrl = whatsappUrl(
    WHATSAPP_NUMBER,
    'Namaste Shiva Shakthi Collections! I am browsing your mobile catalogue and would like personal assistance with jewellery pieces.'
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden"
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-y-0 left-0 w-[86%] max-w-sm bg-[#0E0E12] border-r border-[#26221A] text-[#F7F5F0] z-50 shadow-2xl flex flex-col md:hidden overflow-y-auto overflow-x-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#221F1A] bg-[#121217] shrink-0">
              <div className="min-w-0 pr-2">
                <span className="font-heading font-bold text-base sm:text-lg text-[#F7F5F0] block leading-tight truncate">
                  {APP_NAME}
                </span>
                <span className="text-[8.5px] uppercase tracking-[0.22em] text-[#C5A059] font-medium block truncate">
                  Fine Indian Jewellery
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-[#A8A29E] hover:text-white hover:bg-white/5 transition-colors shrink-0"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="p-4 sm:p-5 flex-1 space-y-1">
              {/* Home */}
              <Link
                to="/"
                onClick={(e) => handleLinkClick(e, '/')}
                className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
              >
                <HomeIcon className="w-4 h-4 text-[#C5A059]" />
                <span>Home</span>
              </Link>

              {/* Shop / All Pieces */}
              <Link
                to="/shop"
                onClick={onClose}
                className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
              >
                <Gem className="w-4 h-4 text-[#C5A059]" />
                <span>Shop Catalogue</span>
              </Link>

              {/* Categories (3D Orbit Showcase) */}
              <Link
                to="/#categories"
                onClick={(e) => handleLinkClick(e, '/#categories')}
                className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#DFBE76]" />
                  <span>Categories (3D Orbit)</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#C5A059]/15 px-2 py-0.5 rounded-full border border-[#C5A059]/30">
                  15 Collections
                </span>
              </Link>

              {/* Catalogue Section Anchor */}
              <Link
                to="/#catalogue"
                onClick={(e) => handleLinkClick(e, '/#catalogue')}
                className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
              >
                <Compass className="w-4 h-4 text-[#C5A059]" />
                <span>Explore Pieces</span>
              </Link>

              {/* Bridal Category Quick Link */}
              <Link
                to="/shop?category=bridal-jewellery"
                onClick={onClose}
                className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Bridal & Heritage Sets</span>
              </Link>

              {/* Wishlist item */}
              <div className="pt-2 border-t border-[#1F1D19] mt-2">
                <Link
                  to="/wishlist"
                  onClick={onClose}
                  className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-[#C5A059]" />
                    <span>Wishlist</span>
                  </span>
                  {wishlistCount > 0 && (
                    <span className="bg-[#C5A059] text-[#0A0A0C] text-xs px-2 py-0.5 rounded-full font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Shopping Cart item */}
              <div>
                <Link
                  to="/cart"
                  onClick={handleCartClick}
                  className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                    <span>Shopping Cart</span>
                  </span>
                  {totalCartItems > 0 && (
                    <span className="bg-[#DFBE76] text-[#0A0A0C] text-xs px-2 py-0.5 rounded-full font-bold">
                      {totalCartItems}
                    </span>
                  )}
                </Link>
              </div>

              {/* Contact Page */}
              <div>
                <Link
                  to="/contact"
                  onClick={onClose}
                  className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#C5A059]" />
                  <span>Contact Boutique</span>
                </Link>
              </div>

              {/* Account Section */}
              <div className="pt-3 border-t border-[#1F1D19] mt-2 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] px-3.5 block mb-1">
                  Account & Orders
                </span>

                {isAuthenticated ? (
                  <>
                    <div className="px-3.5 py-1 text-xs text-[#A8A29E] truncate">
                      Signed in as <strong className="text-[#F7F5F0]">{profile?.full_name || user?.email}</strong>
                    </div>

                    <Link
                      to="/account"
                      onClick={onClose}
                      className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#C5A059]" />
                      <span>My Account & Orders</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#DFBE76] bg-[#C5A059]/15 border border-[#C5A059]/30 hover:bg-[#C5A059]/25 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-[#C5A059]" />
                        <span>Administrator Portal</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 text-left transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={onClose}
                      className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#EFECE6] hover:bg-[#181820] hover:text-[#DFBE76] transition-colors"
                    >
                      <LogIn className="w-4 h-4 text-[#C5A059]" />
                      <span>Sign In</span>
                    </Link>

                    <Link
                      to="/register"
                      onClick={onClose}
                      className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#DFBE76] hover:underline transition-colors"
                    >
                      <UserPlus className="w-4 h-4 text-[#C5A059]" />
                      <span>Create Account</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Social Media Links Section */}
              <div className="pt-3 border-t border-[#1F1D19] mt-2 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#78716C] px-3.5 block">
                  Follow Us
                </span>

                <div className="grid grid-cols-2 gap-2 px-1">
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-xl bg-[#14141A] border border-[#26221A] hover:border-[#C5A059] text-[#EFECE6] text-xs font-medium transition-colors"
                    aria-label="Visit Shiva Shakthi Collections on Instagram"
                  >
                    <span className="flex items-center gap-2">
                      <Instagram className="w-4 h-4 text-pink-400" />
                      <span>Instagram</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#78716C]" />
                  </a>

                  <a
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between min-h-[44px] px-3 py-2 rounded-xl bg-[#14141A] border border-[#26221A] hover:border-[#C5A059] text-[#EFECE6] text-xs font-medium transition-colors"
                    aria-label="Visit Shiva Shakthi Collections on YouTube"
                  >
                    <span className="flex items-center gap-2">
                      <Youtube className="w-4 h-4 text-red-400" />
                      <span>YouTube</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#78716C]" />
                  </a>
                </div>
              </div>
            </nav>

            {/* Concierge footer */}
            <div className="p-4 border-t border-[#221F1A] bg-[#121217] shrink-0">
              <a
                href={conciergeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                <span>WhatsApp Concierge Orders</span>
              </a>
              <p className="text-[10px] text-[#78716C] text-center mt-2 tracking-wide">
                Pan-India Insured Shipping • 1-Gram Micro Gold
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
