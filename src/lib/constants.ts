// ============================================================
// App-wide constants
// ============================================================

export const APP_NAME = 'Shiva Shakthi Collections';
export const APP_TAGLINE = 'Premium Indian Jewellery';
export const APP_DESCRIPTION =
  'Discover exquisite handcrafted Indian jewellery — earrings, necklaces, bangles, rings, and bridal sets that celebrate tradition and elegance.';

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '918971263989';

export const CURRENCY = 'INR';
export const CURRENCY_SYMBOL = '₹';

/** Free shipping threshold in paise */
export const FREE_SHIPPING_THRESHOLD_PAISE = 99900; // ₹999

/** Default shipping charge in paise */
export const SHIPPING_CHARGE_PAISE = 4900; // ₹49

/** GST percentage (as integer, e.g. 3 = 3%) */
export const GST_PERCENT = 3;

export const PRODUCTS_PER_PAGE = 12;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  processing: 'badge-blue',
  shipped: 'badge-gold',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  authorized: 'Authorized',
  captured: 'Captured',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/#categories' },
  { label: 'Catalogue', href: '/#catalogue' },
  { label: 'Bridal', href: '/shop?category=bridal-jewellery' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = {
  shop: [
    { label: 'All Jewellery', href: '/shop' },
    { label: 'Earrings', href: '/shop?category=earrings' },
    { label: 'Necklaces', href: '/shop?category=necklaces' },
    { label: 'Bangles', href: '/shop?category=bangles' },
    { label: 'Rings', href: '/shop?category=rings' },
    { label: 'Bridal Jewellery', href: '/shop?category=bridal-jewellery' },
  ],
  help: [
    { label: 'FAQs', href: '/faq' },
    { label: 'Shipping & Returns', href: '/shipping-returns' },
    { label: 'Contact Us', href: '/contact' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
};

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/shiva_shakthi_collections999/',
  youtube: 'https://youtube.com/@shiva_shakthi_collections999',
  instagramHandle: '@shiva_shakthi_collections999',
  youtubeHandle: '@shiva_shakthi_collections999',
};

export const LUXURY_FALLBACK_SVG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="%23121215"/><circle cx="50" cy="50" r="32" stroke="%23C5A059" stroke-width="1.2" stroke-dasharray="3 3"/><polygon points="50,26 66,42 50,74 34,42" stroke="%23DFBE76" stroke-width="1.5" fill="%23C5A059" fill-opacity="0.18"/><circle cx="50" cy="42" r="4.5" fill="%23DFBE76"/></svg>';

export const PLACEHOLDER_IMAGE = LUXURY_FALLBACK_SVG;
