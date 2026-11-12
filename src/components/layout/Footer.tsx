import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Youtube, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, FOOTER_LINKS, WHATSAPP_NUMBER, SOCIAL_LINKS } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="bg-[#070709] text-[#A8A29E] pt-16 pb-10 border-t border-[#26221A]">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#1C1C22]">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group">
              <span className="font-heading font-bold text-2xl text-[#F7F5F0] group-hover:text-[#DFBE76] transition-colors tracking-wide">
                {APP_NAME}
              </span>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#C5A059] font-medium mt-1">
                {APP_TAGLINE}
              </p>
            </Link>

            <p className="text-xs sm:text-sm text-[#8E8A85] max-w-sm leading-relaxed">
              Curated fine Indian jewellery celebrating eternal heritage, temple artistry, and radiant micro-gold craftsmanship made for every auspicious celebration.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-[#A8A29E]">
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>WhatsApp: +91 {WHATSAPP_NUMBER.slice(2)}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>support@shivashakthicollections.com</span>
              </p>
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Pan-India Insured Dispatch & Delivery</span>
              </p>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-heading text-[#F7F5F0] text-sm font-semibold mb-4 tracking-wider uppercase">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="hover:text-[#DFBE76] transition-colors duration-200 block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-heading text-[#F7F5F0] text-sm font-semibold mb-4 tracking-wider uppercase">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="hover:text-[#DFBE76] transition-colors duration-200 block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Follow Us */}
          <div className="space-y-6">
            <div>
              <h4 className="font-heading text-[#F7F5F0] text-sm font-semibold mb-4 tracking-wider uppercase">
                Policies & Trust
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                {FOOTER_LINKS.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="hover:text-[#DFBE76] transition-colors duration-200 block py-0.5"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Official Social Media Section */}
            <div className="pt-4 border-t border-[#1C1C22]">
              <h5 className="text-[11px] uppercase font-bold text-[#C5A059] tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                <span>Follow Our Journey</span>
              </h5>

              <div className="flex flex-col gap-2">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between min-h-[44px] px-3.5 py-2 rounded-xl bg-[#121216] border border-[#26221A] hover:border-[#C5A059] text-[#EFECE6] hover:text-[#DFBE76] transition-all duration-200 shadow-sm"
                  aria-label="Visit Shiva Shakthi Collections official Instagram profile"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-pink-600/20 text-pink-400 group-hover:bg-pink-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Instagram className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-medium">Instagram</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#C5A059] transition-colors" />
                </a>

                <a
                  href={SOCIAL_LINKS.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between min-h-[44px] px-3.5 py-2 rounded-xl bg-[#121216] border border-[#26221A] hover:border-[#C5A059] text-[#EFECE6] hover:text-[#DFBE76] transition-all duration-200 shadow-sm"
                  aria-label="Subscribe to Shiva Shakthi Collections official YouTube channel"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <Youtube className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-medium">YouTube</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#78716C] group-hover:text-[#C5A059] transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar with thin gold separator */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="flex items-center gap-1.5 text-[#A8A29E]">
            Handcrafted with devotion in India
          </p>
          <div className="flex items-center gap-2 text-[#78716C]">
            <span>WhatsApp Concierge</span>
            <span>•</span>
            <span>1-Gram Micro Gold</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
