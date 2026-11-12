import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-8 max-w-3xl">
        <Breadcrumb items={[{ label: 'Privacy Policy' }]} />

        <div className="py-6 space-y-6 text-sm text-[#A8A29E] leading-relaxed">
          <h1 className="font-heading text-3xl font-bold text-[#F7F5F0] border-b border-white/5 pb-3">
            Privacy Policy
          </h1>

          <p>
            At {APP_NAME}, accessible from our online store, your privacy is of paramount importance to us. This Privacy Policy document outlines the types of information collected and how we safeguard it.
          </p>

          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold text-[#F7F5F0]">1. Information We Collect</h2>
            <p>
              When you browse our website, place an order, or register an account, we may collect personal details such as your name, email address, phone number, and physical delivery address.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold text-[#F7F5F0]">2. Payment & Order Processing</h2>
            <p>
              We do not store your credit card, debit card, UPI PINs, or bank credentials on our servers. All orders are initiated via our official WhatsApp Concierge (+91 8971263989) where item availability, verified delivery details, and secure payment arrangements are directly coordinated with our team.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold text-[#F7F5F0]">3. How We Use Your Data</h2>
            <p>
              We use your information solely for order fulfillment, courier delivery updates, responding to customer care queries, and sending transactional notifications. We never sell or rent your personal data to third parties.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
