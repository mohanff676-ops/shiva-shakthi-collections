import { Helmet } from 'react-helmet-async';
import { Sparkles, Shield, Heart, Award } from 'lucide-react';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Us — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: 'About Us' }]} />

        {/* Hero */}
        <div className="py-12 sm:py-16 text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs uppercase font-bold tracking-[0.25em] text-brand-champagne">
            Our Heritage & Passion
          </span>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-[#F7F5F0] leading-tight">
            Crafting Splendour for Every Indian Milestone
          </h1>
          <p className="text-[#A8A29E] text-sm sm:text-base leading-relaxed">
            At {APP_NAME}, we bring centuries of Indian regal heritage into the modern world, offering meticulously crafted jewellery that embodies devotion, artistry, and timeless grace.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center py-12 border-t border-white/5">
          <div className="space-y-4 text-sm text-[#A8A29E] leading-relaxed">
            <h2 className="font-heading text-2xl font-bold text-[#F7F5F0]">
              The Sacred Inspiration Behind Our Name
            </h2>
            <p>
              Named after the eternal union of Shiva and Shakthi—representing consciousness and energy—our collections draw upon the divine traditions of South Indian temple jewellery, North Indian Kundan, and regal Mughal craftsmanship.
            </p>
            <p>
              Whether you are preparing for your wedding day, celebrating an auspicious festival, or looking for everyday grace, we create jewellery that honors your unique individuality.
            </p>
          </div>

          <div className="bg-[#121215] p-8 rounded-2xl border border-white/5 shadow-luxury space-y-4">
            <h3 className="font-heading text-xl font-bold text-brand-champagne">
              Our Core Commitments
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-[#A8A29E]">
              <li className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-champagne shrink-0 mt-0.5" />
                <span><strong className="text-[#F7F5F0]">Artisanal Excellence:</strong> Handcrafted and quality-checked by master jewelers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-brand-champagne shrink-0 mt-0.5" />
                <span><strong className="text-[#F7F5F0]">Ethical Sourcing:</strong> Lead-safe and skin-friendly hypoallergenic materials.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Award className="w-4 h-4 text-brand-champagne shrink-0 mt-0.5" />
                <span><strong className="text-[#F7F5F0]">Enduring Luster:</strong> Multi-layer micro-gold plating formulated to retain brilliance.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="py-12 text-center bg-[#121215] rounded-2xl p-8 border border-white/5 mt-6 shadow-luxury">
          <h3 className="font-heading text-2xl font-bold text-[#F7F5F0] mb-2">
            Ready to find your signature piece?
          </h3>
          <p className="text-xs text-[#A8A29E] max-w-md mx-auto mb-6">
            Browse our full catalog or contact us for personalized bridal guidance.
          </p>
          <Button to="/shop" size="lg" variant="primary" className="font-bold">Explore Our Collections</Button>
        </div>
      </div>
    </>
  );
}
