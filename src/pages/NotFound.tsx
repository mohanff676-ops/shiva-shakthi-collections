import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Gem, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found — {APP_NAME}</title>
      </Helmet>

      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0C] px-4 text-center relative overflow-hidden">
        {/* Decorative gem icon */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-6 relative z-10"
        >
          <Gem className="mx-auto h-16 w-16 text-brand-champagne" strokeWidth={1.5} />
        </motion.div>

        {/* 404 number */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-heading text-[120px] font-bold leading-none text-[#F7F5F0] sm:text-[160px] relative z-10"
        >
          404
        </motion.h1>

        {/* Decorative divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="my-6 h-px w-40 origin-center bg-gradient-to-r from-transparent via-[#C5A059] to-transparent relative z-10"
        />

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="font-heading text-2xl font-bold text-brand-champagne sm:text-3xl relative z-10"
        >
          Page Not Found
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-3 max-w-md font-sans text-base text-[#A8A29E] relative z-10"
        >
          The jewellery piece or page you&apos;re looking for doesn&apos;t exist or has been moved.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row relative z-10"
        >
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-3 min-h-[44px] font-bold">
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link to="/shop" className="btn-outline inline-flex items-center gap-2 px-6 py-3 min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            Browse Collection
          </Link>
        </motion.div>

        {/* Background ornamental elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#C5A059]/5 blur-3xl" />
          <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#C5A059]/5 blur-3xl" />
        </div>
      </div>
    </>
  );
}
