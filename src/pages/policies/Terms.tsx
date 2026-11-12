import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms & Conditions — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-8 max-w-3xl">
        <Breadcrumb items={[{ label: 'Terms & Conditions' }]} />

        <div className="py-6 space-y-6 text-sm text-[#A8A29E] leading-relaxed">
          <h1 className="font-heading text-3xl font-bold text-[#F7F5F0] border-b border-white/5 pb-3">
            Terms & Conditions
          </h1>

          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold text-[#F7F5F0]">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this website, you agree to comply with and be bound by the terms and conditions of {APP_NAME}.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold text-[#F7F5F0]">2. Accuracy of Products & Color Variations</h2>
            <p>
              We strive to display the colors, textures, and dimensions of our handcrafted jewellery as accurately as possible. However, slight variations may occur due to photography lighting, monitor displays, and handmade variations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading text-lg font-bold text-[#F7F5F0]">3. Pricing & Intellectual Property</h2>
            <p>
              All prices listed on the site are in Indian National Rupees (INR) and are inclusive of GST. All photographs, brand logos, copywriting, and jewellery design assets belong strictly to {APP_NAME}.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
