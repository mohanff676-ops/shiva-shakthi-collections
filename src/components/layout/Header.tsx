import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronDown,
  Instagram,
  Youtube,
  Sparkles,
  MessageCircle,
  Phone,
  Home as HomeIcon,
  Gem,
  Compass,
} from 'lucide-react';
import { APP_NAME, SOCIAL_LINKS, WHATSAPP_NUMBER } from '@/lib/constants';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuth } from '@/hooks/useAuth';
import { MobileMenu } from './MobileMenu';
import { whatsappUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const totalCartItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { user, profile, isAdmin, isAuthenticated, signOut } = useAuth();

  // Scroll detection with passive listener for compact sticky state
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
    }
  };

  const handleSignOut = async () => {
    setShowAccountDropdown(false);
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  // Smooth scroll or navigation handler for anchor links
  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
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

  const handleCartNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    toggleCart();
  };

  const whatsappConciergeUrl = whatsappUrl(
    WHATSAPP_NUMBER,
    'Namaste Shiva Shakthi Collections! I am browsing your jewellery collection and would like personal concierge styling assistance.'
  );

  // Full desktop navigation links list
  const desktopNavLinks = [
    { label: 'Home', href: '/', icon: HomeIcon },
    { label: 'Shop', href: '/shop', icon: Gem },
    { label: 'Categories', href: '/#categories', icon: Sparkles },
    { label: 'Catalogue', href: '/#catalogue', icon: Compass },
    { label: 'Wishlist', href: '/wishlist', icon: Heart, badge: wishlistCount },
    { label: 'Cart', href: '/cart', icon: ShoppingBag, badge: totalCartItems, onClick: handleCartNavClick },
    {
      label: isAuthenticated ? (profile?.full_name?.split(' ')[0] || 'My Account') : 'Sign In',
      href: isAuthenticated ? '/account' : '/login',
      icon: UserIcon,
    },
    { label: 'Contact', href: '/contact', icon: Phone },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0A0A0C]/98 backdrop-blur-xl border-b border-[#C5A059]/30 shadow-[0_4px_25px_rgba(0,0,0,0.85)]'
          : 'bg-[#0A0A0C]/95 backdrop-blur-md border-b border-[#2A2722]'
      }`}
    >
      {/* Top Announcement Bar (Collapses cleanly on scroll) */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden bg-[#0E0E12] border-b border-[#221F1A] text-[#DFBE76] text-[8px] min-[340px]:text-[8.5px] min-[360px]:text-[9.5px] sm:text-xs text-center font-semibold tracking-widest uppercase ${
          isScrolled ? 'max-h-0 py-0 opacity-0 border-none' : 'max-h-7 py-0.5 min-[360px]:py-1 opacity-100'
        }`}
      >
        <div className="flex items-center justify-center gap-1.5 px-2 sm:px-3 truncate max-w-full">
          <Sparkles className="w-2.5 h-2.5 text-[#C5A059] shrink-0" />
          <span className="truncate">HANDCRAFTED LUXURY • AUTHENTIC 1-GRAM GOLD JEWELLERY</span>
          <Sparkles className="w-2.5 h-2.5 text-[#C5A059] shrink-0" />
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-2 min-[360px]:px-3 sm:px-6 lg:px-8 w-full">
        <div
          className={`flex items-center justify-between gap-1 min-[360px]:gap-1.5 sm:gap-2 w-full min-w-0 transition-all duration-300 ${
            isScrolled ? 'h-11 min-[360px]:h-12 sm:h-14' : 'h-12 min-[360px]:h-13 sm:h-16'
          }`}
        >
          {/* Mobile Left: Menu & Search */}
          <div className="flex items-center gap-0.5 md:hidden shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 min-h-[34px] min-w-[34px] flex items-center justify-center text-[#EFECE6] hover:text-[#C5A059] rounded-lg transition-colors active:scale-95"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
              className="w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 min-h-[34px] min-w-[34px] flex items-center justify-center text-[#EFECE6] hover:text-[#C5A059] rounded-lg transition-colors active:scale-95"
              aria-label="Open search bar"
            >
              <Search className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Logo / Brand Name (Protected against mobile truncation) */}
          <Link
            to="/"
            onClick={(e) => handleNavLinkClick(e, '/')}
            className="flex flex-col items-center md:items-start text-center group py-0.5 px-0.5 min-w-0 flex-shrink"
          >
            <span
              className={`font-heading font-bold text-[#F7F5F0] tracking-wider group-hover:text-[#DFBE76] transition-all leading-tight truncate ${
                isScrolled
                  ? 'text-[11px] min-[340px]:text-xs min-[360px]:text-sm sm:text-base md:text-lg lg:text-xl'
                  : 'text-xs min-[340px]:text-[13px] min-[360px]:text-sm sm:text-lg md:text-xl lg:text-2xl'
              } max-w-[125px] min-[340px]:max-w-[145px] min-[375px]:max-w-[185px] min-[410px]:max-w-[220px] sm:max-w-none`}
            >
              {APP_NAME}
            </span>
            <span
              className={`uppercase font-medium block truncate text-[#C5A059] transition-all ${
                isScrolled
                  ? 'text-[5.5px] min-[340px]:text-[6px] min-[360px]:text-[7px] sm:text-[8px] tracking-[0.12em] sm:tracking-[0.2em]'
                  : 'text-[6px] min-[340px]:text-[6.5px] min-[360px]:text-[7.5px] sm:text-[9px] tracking-[0.14em] sm:tracking-[0.25em]'
              } max-w-[125px] min-[340px]:max-w-[145px] min-[375px]:max-w-[185px] sm:max-w-none`}
            >
              Fine Indian Jewellery
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-md mx-3 lg:mx-6 relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search temple necklaces, jhumkas, kadas..."
              className="w-full pl-9 pr-4 py-1.5 lg:py-2 text-xs bg-[#141418] border border-[#2A2722] rounded-full text-[#F7F5F0] placeholder-[#78716C] focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/40 transition-all shadow-inner"
            />
            <Search className="absolute left-3 w-3.5 h-3.5 text-[#78716C]" />
          </form>

          {/* Action Icons Cluster */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            {/* Desktop WhatsApp Quick Concierge Button */}
            <a
              href={whatsappConciergeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121A15] border border-emerald-600/35 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 text-xs font-semibold transition-all shadow-sm"
              title="Chat with Jewellery Concierge on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Concierge</span>
            </a>

            {/* Desktop Social Links */}
            <div className="hidden 2xl:flex items-center gap-1 pr-1.5 border-r border-[#26221A]">
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center text-[#A8A29E] hover:text-[#C5A059] rounded-full hover:bg-white/5 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href={SOCIAL_LINKS.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 flex items-center justify-center text-[#A8A29E] hover:text-[#C5A059] rounded-full hover:bg-white/5 transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Account Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="h-8 sm:h-9 px-1.5 sm:px-2.5 text-[#F7F5F0] hover:text-[#C5A059] rounded-full hover:bg-white/5 transition-colors flex items-center gap-1 text-xs font-semibold"
                  aria-label="Account Menu"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1C1A16] border border-[#C5A059]/50 text-[#DFBE76] flex items-center justify-center font-heading font-bold text-xs">
                    {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[90px] truncate text-[#EFECE6]">
                    {profile?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#78716C] hidden lg:block" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="h-8 sm:h-9 px-1.5 sm:px-2.5 text-[#A8A29E] hover:text-[#C5A059] transition-colors flex items-center gap-1 text-xs font-medium"
                  aria-label="Sign In"
                >
                  <UserIcon className="w-4 h-4 text-[#C5A059]" />
                  <span className="hidden sm:inline text-[#EFECE6]">Sign In</span>
                </Link>
              )}

              {/* Account Dropdown Menu */}
              {showAccountDropdown && isAuthenticated && (
                <div className="absolute right-0 mt-2 w-56 bg-[#141418] rounded-xl shadow-luxury border border-[#2A2722] py-2 z-50 animate-scale-in text-xs">
                  <div className="px-4 py-2.5 border-b border-[#2A2722]">
                    <p className="font-semibold text-[#F7F5F0] truncate">
                      {profile?.full_name || 'Customer'}
                    </p>
                    <p className="text-[11px] text-[#A8A29E] truncate">{user?.email}</p>
                    {isAdmin && (
                      <span className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C5A059]/20 text-[#DFBE76] border border-[#C5A059]/40">
                        <Shield className="w-3 h-3 text-[#C5A059]" /> Administrator
                      </span>
                    )}
                  </div>

                  <Link
                    to="/account"
                    onClick={() => setShowAccountDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-[#EFECE6] hover:bg-[#C5A059]/10 hover:text-[#DFBE76] transition-colors font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-[#C5A059]" />
                    <span>My Account & Orders</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowAccountDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-[#DFBE76] hover:bg-[#C5A059]/15 font-semibold transition-colors"
                    >
                      <Shield className="w-4 h-4 text-[#C5A059]" />
                      <span>Admin Portal</span>
                    </Link>
                  )}

                  <div className="border-t border-[#2A2722] my-1" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-rose-950/30 text-left font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist Link with Live Badge */}
            <Link
              to="/wishlist"
              className="w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 sm:w-10 sm:h-10 min-h-[34px] min-w-[32px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center relative text-[#EFECE6] hover:text-[#C5A059] transition-colors active:scale-95"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 sm:top-1 sm:right-1 flex items-center justify-center min-w-[14px] sm:min-w-[17px] h-[14px] sm:h-[17px] text-[7.5px] sm:text-[9px] font-bold text-[#0A0A0C] bg-[#C5A059] rounded-full px-0.5 sm:px-1">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Shopping Cart Button with Live Badge */}
            <button
              type="button"
              onClick={toggleCart}
              className="w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 sm:w-10 sm:h-10 min-h-[34px] min-w-[32px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center relative text-[#EFECE6] hover:text-[#C5A059] transition-colors active:scale-95"
              aria-label="Shopping Cart Bag"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              {totalCartItems > 0 && (
                <span className="absolute top-0 right-0 sm:top-1 sm:right-1 flex items-center justify-center min-w-[14px] sm:min-w-[17px] h-[14px] sm:h-[17px] text-[7.5px] sm:text-[9px] font-bold text-[#0A0A0C] bg-[#DFBE76] rounded-full px-0.5 sm:px-1 animate-scale-in">
                  {totalCartItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Row (Always visible; becomes sleek on scroll) */}
        <nav
          className={`hidden md:flex items-center justify-center gap-3 lg:gap-6 border-t border-[#1C1C22]/80 transition-all duration-300 ${
            isScrolled ? 'py-1.5' : 'py-2.5'
          }`}
          aria-label="Main Navigation"
        >
          {desktopNavLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? location.pathname === '/' && !location.hash
                : link.href.includes('#')
                ? location.hash === `#${link.href.split('#')[1]}`
                : location.pathname === link.href;

            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                to={link.href}
                onClick={(e) => {
                  if (link.onClick) {
                    link.onClick(e);
                  } else {
                    handleNavLinkClick(e, link.href);
                  }
                }}
                className={`relative flex items-center gap-1.5 text-xs lg:text-sm font-medium tracking-wider uppercase py-1 px-1.5 transition-all group ${
                  isActive
                    ? 'text-[#DFBE76] font-semibold'
                    : 'text-[#A8A29E] hover:text-[#DFBE76]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />}
                <span>{link.label}</span>
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#C5A059] text-[#0A0A0C]">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C5A059] rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 md:hidden flex items-start pt-16 animate-fade-in">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full bg-[#141418] border border-[#2A2722] rounded-2xl p-3 shadow-2xl flex items-center gap-2"
          >
            <Search className="w-5 h-5 text-[#C5A059] shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search temple jewellery, bangles, rings..."
              className="w-full text-sm bg-transparent text-[#F7F5F0] placeholder-[#78716C] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowSearchModal(false)}
              className="text-xs text-[#A8A29E] hover:text-white px-3 py-2 min-h-[44px]"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Navigation */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </header>
  );
}
