import { Helmet } from 'react-helmet-async';
import { Truck, RotateCcw, ShieldCheck, AlertCircle, MessageCircle } from 'lucide-react';
import { APP_NAME, WHATSAPP_NUMBER } from '@/lib/constants';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { whatsappUrl } from '@/lib/utils';

export default function ShippingReturns() {
  const supportUrl = whatsappUrl(
    WHATSAPP_NUMBER,
    'Namaste Shiva Shakthi Collections! I have a question regarding shipping and delivery.'
  );

  return (
    <>
      <Helmet>
        <title>Shipping & Returns Policy — {APP_NAME}</title>
        <meta
          name="description"
          content="Shipping timelines, delivery rates, and exchange guidelines for Shiva Shakthi Collections."
        />
      </Helmet>

      <div className="container-custom py-8 max-w-4xl">
        <Breadcrumb items={[{ label: 'Shipping & Returns' }]} />

        <div className="py-6 space-y-10 text-sm text-[#A8A29E] leading-relaxed">
          {/* Header */}
          <div className="border-b border-white/5 pb-5">
            <span className="text-xs uppercase font-bold tracking-widest text-brand-champagne">
              Customer Assurance
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#F7F5F0] mt-1">
              Shipping & Returns Policy
            </h1>
            <p className="text-xs text-[#78716C] mt-2">
              Last updated: October 2026 • Shiva Shakthi Collections
            </p>
          </div>

          {/* Section 1: Shipping Policy */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-brand-champagne">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-[#F7F5F0]">
                  1. Shipping & Pan-India Delivery
                </h2>
                <p className="text-xs text-[#78716C]">Fast, insured delivery to your doorstep</p>
              </div>
            </div>

            <div className="bg-[#121215] rounded-2xl border border-white/5 p-6 shadow-luxury space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-white/5">
                <div className="p-4 rounded-xl bg-[#141418] border border-[#C5A059]/20">
                  <p className="text-xs font-bold text-brand-champagne uppercase tracking-wider">Free Shipping</p>
                  <p className="text-sm font-bold text-[#F7F5F0] mt-1">Orders above ₹999</p>
                  <p className="text-xs text-[#A8A29E] mt-0.5">Complimentary insured express shipping across India.</p>
                </div>

                <div className="p-4 rounded-xl bg-[#141418] border border-white/10">
                  <p className="text-xs font-bold text-[#A8A29E] uppercase tracking-wider">Standard Shipping</p>
                  <p className="text-sm font-bold text-[#F7F5F0] mt-1">₹49 Flat Rate</p>
                  <p className="text-xs text-[#A8A29E] mt-0.5">Applicable on orders below ₹999.</p>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-[#A8A29E]">
                <p>
                  <strong className="text-[#F7F5F0]">Dispatch Schedule:</strong> All pieces undergo strict quality inspection, bubble-wrapping, and tamper-evident packaging. Orders are dispatched within <strong>1 to 2 business days</strong> (excluding Sundays and national holidays).
                </p>
                <p>
                  <strong className="text-[#F7F5F0]">Estimated Delivery Timelines:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li><strong className="text-[#F7F5F0]">Metro Cities:</strong> 2 to 4 business days.</li>
                  <li><strong className="text-[#F7F5F0]">Rest of India:</strong> 4 to 7 business days.</li>
                </ul>
                <p>
                  <strong className="text-[#F7F5F0]">Live Tracking:</strong> Real-time tracking IDs and courier links are shared with you directly on WhatsApp once your parcel is handed over to our logistics partner.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Returns & Exchanges */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-brand-champagne">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold text-[#F7F5F0]">
                  2. 3-Day Transit Damage Replacement
                </h2>
                <p className="text-xs text-[#78716C]">Clear guidelines for replacements and exchanges</p>
              </div>
            </div>

            <div className="bg-[#121215] rounded-2xl border border-white/5 p-6 shadow-luxury space-y-4">
              <p className="text-xs sm:text-sm text-[#A8A29E] leading-relaxed">
                Due to the intricate, handmade craftsmanship of one-gram micro-gold jewelry, we provide <strong className="text-[#F7F5F0]">replacements or exchanges within 3 days of delivery strictly in the case of transit damage or wrong item dispatch</strong>.
              </p>

              {/* Crucial unboxing requirement */}
              <div className="p-4 rounded-xl bg-[#141418] border border-[#C5A059]/30 text-xs sm:text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold text-brand-champagne">
                  <AlertCircle className="w-4 h-4 shrink-0 text-brand-champagne" />
                  <span>Mandatory Unbroken 360-Degree Unboxing Video</span>
                </div>
                <p className="leading-relaxed text-[#A8A29E]">
                  To qualify for a transit-damage replacement, customers must record an <strong className="text-[#F7F5F0]">unbroken, unedited 360-degree unboxing video</strong> starting from the sealed outer package label, demonstrating the seal being opened, and clearly showing the defective/damaged item in good lighting.
                </p>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-[#A8A29E]">
                <p className="font-bold text-[#F7F5F0]">Non-Eligible Situations:</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Claims submitted after 3 days of package delivery confirmation.</li>
                  <li>Parcels opened without an unbroken unboxing video.</li>
                  <li>Items that have been worn, altered, washed, or had security tags removed.</li>
                  <li>Minor color variations attributable to mobile/monitor display calibration differences.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Concierge Assistance */}
          <section className="p-6 rounded-2xl bg-[#121215] border border-white/5 text-[#F7F5F0] flex flex-col sm:flex-row items-center justify-between gap-6 shadow-luxury">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-heading text-lg font-bold text-brand-champagne">
                Need Help with Your Order or Parcel?
              </h3>
              <p className="text-xs text-[#A8A29E] max-w-md">
                Our concierge is available on WhatsApp to assist with live tracking, address corrections, and damage claims.
              </p>
            </div>
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0 min-h-[44px]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Concierge</span>
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
