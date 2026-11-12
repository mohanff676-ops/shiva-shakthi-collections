import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, Sparkles } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: 'What materials are used in Shiva Shakthi Collections jewellery?',
    a: 'We use high-grade copper, brass, and silver alloy bases coated with micro-plated 22K/24K gold or antique finish, studded with AAA-grade Kundan, cubic zirconia, and semi-precious simulated stones.',
  },
  {
    q: 'How should I care for and store my jewellery?',
    a: 'Store your jewellery in airtight plastic pouches or cotton-lined velvet boxes. Always keep away from perfumes, direct moisture, body lotions, and hairsprays. Wipe with a dry, soft cloth after wearing.',
  },
  {
    q: 'How long does shipping take across India?',
    a: 'Standard domestic delivery takes 3 to 7 business days depending on your pincode. We provide live tracking numbers via SMS and email once your package is dispatched.',
  },
  {
    q: 'How do I place an order on Shiva Shakthi Collections?',
    a: 'Simply browse our collections, add pieces to your cart, and tap "Order on WhatsApp". Your complete order details are pre-filled so you can connect directly with our concierge team, confirm live availability, and complete payment smoothly via UPI or direct bank transfer.',
  },
  {
    q: 'What is your return and exchange policy?',
    a: 'We offer replacements or exchanges within 3 days of delivery strictly in cases of transit damage. For verification, please record and share an unbroken 360-degree unboxing video showing the outer package seal being opened.',
  },
  {
    q: 'Is the jewellery hypoallergenic and safe for sensitive skin?',
    a: 'Yes, all our jewellery pieces are 100% nickel-free and lead-safe, making them comfortable to wear throughout wedding festivities and long functions without skin irritation.',
  },
  {
    q: 'Can I request bridal customizations or bulk orders for family functions?',
    a: 'Yes! We love crafting bespoke sets for brides and wedding parties. Contact us on WhatsApp with your outfit pictures or design preferences for customized bridal consultations.',
  },
  {
    q: 'Do you ship internationally outside India?',
    a: 'We currently serve customers across all states and union territories in India. For international bulk orders, please contact our support team directly on WhatsApp.',
  },
];

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-8 max-w-3xl">
        <Breadcrumb items={[{ label: 'FAQs' }]} />

        <div className="py-8 text-center space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-brand-champagne">
            Got Questions?
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#F7F5F0]">
            Frequently Asked Questions
          </h1>
          <p className="text-xs text-[#A8A29E]">
            Everything you need to know about our jewellery, orders, shipping, and care.
          </p>
        </div>

        <div className="space-y-3 py-6">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#121215] rounded-2xl border border-white/5 shadow-luxury overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-heading font-semibold text-sm sm:text-base text-[#F7F5F0] hover:text-brand-champagne transition-colors min-h-[44px]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-champagne shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-[#A8A29E] leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
