import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { whatsappUrl } from '@/lib/utils';

export function WhatsAppButton() {
  const url = whatsappUrl(
    WHATSAPP_NUMBER,
    'Namaste! I would like to enquire about jewellery from Shiva Shakthi Collections.'
  );

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="fixed bottom-3.5 min-[360px]:bottom-4 sm:bottom-6 right-3 min-[360px]:right-4 sm:right-6 z-40 flex items-center justify-center w-11 h-11 min-[360px]:w-12 min-[360px]:h-12 sm:w-[54px] sm:h-[54px] bg-[#25D366] hover:bg-[#1EBE5D] active:bg-[#1DA851] text-white rounded-full shadow-[0_4px_18px_rgba(0,0,0,0.6)] transition-all"
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6 sm:w-7 sm:h-7 fill-white text-[#25D366]" />
    </motion.a>
  );
}
