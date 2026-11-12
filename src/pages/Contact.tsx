import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Mail, MapPin, MessageSquare, Send, Instagram, Youtube, ExternalLink } from 'lucide-react';
import { APP_NAME, WHATSAPP_NUMBER, SOCIAL_LINKS } from '@/lib/constants';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { whatsappUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Thank you! Your message has been sent to our customer care team.');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }, 600);
  };

  const whatsappDirect = whatsappUrl(
    WHATSAPP_NUMBER,
    'Namaste! I would like to contact Shiva Shakthi Collections customer care.'
  );

  return (
    <>
      <Helmet>
        <title>Contact Us — {APP_NAME}</title>
      </Helmet>

      <div className="container-custom py-8">
        <Breadcrumb items={[{ label: 'Contact Us' }]} />

        <div className="py-8 text-center max-w-xl mx-auto space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#F7F5F0]">
            We Are Here To Assist You
          </h1>
          <p className="text-xs sm:text-sm text-[#A8A29E]">
            Have questions about bridal orders, sizing, customization or order tracking? Reach out to our dedicated concierge.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-6 max-w-5xl mx-auto">
          {/* Contact Details Card */}
          <div className="bg-[#121215] text-[#F7F5F0] p-8 rounded-2xl border border-white/5 shadow-luxury space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="font-heading text-2xl font-bold text-brand-champagne">
                Customer Care & Concierge
              </h2>
              <p className="text-xs sm:text-sm text-[#A8A29E] leading-relaxed">
                Our support team is available Monday through Saturday, from 10:00 AM to 7:00 PM IST.
              </p>

              <div className="space-y-4 text-xs sm:text-sm text-[#A8A29E]">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-brand-champagne shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#F7F5F0]">Call / WhatsApp</p>
                    <p>+91 {WHATSAPP_NUMBER.slice(2)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-brand-champagne shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#F7F5F0]">Email Address</p>
                    <p>support@shivashakthicollections.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-brand-champagne shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#F7F5F0]">Main Studio</p>
                    <p>Shiva Shakthi Collections, India</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <a
                href={whatsappDirect}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors min-h-[44px]"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Chat Instantly on WhatsApp</span>
              </a>

              <div className="pt-2">
                <p className="text-[11px] uppercase tracking-wider text-brand-champagne font-semibold mb-2">
                  Connect on Social Media
                </p>
                <div className="flex gap-2">
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#141418] hover:bg-[#1A1A22] border border-white/10 text-[#F7F5F0] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#141418] hover:bg-[#1A1A22] border border-white/10 text-[#F7F5F0] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[44px]"
                    aria-label="YouTube"
                  >
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span>YouTube</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#121215] p-8 rounded-2xl border border-white/5 shadow-luxury">
            <h2 className="font-heading text-xl font-bold text-[#F7F5F0] mb-4">
              Send Us a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Your Name"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Phone Number"
                placeholder="Mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Textarea
                label="Message or Inquiry"
                placeholder="Tell us about the design, occasion, or question..."
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full flex items-center justify-center gap-2 font-bold min-h-[44px]">
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
