import { CURRENCY_SYMBOL, SHIPPING_CHARGE_PAISE, FREE_SHIPPING_THRESHOLD_PAISE, PLACEHOLDER_IMAGE } from './constants';

// ---- clsx-like utility ----
export type ClassValue = string | number | boolean | undefined | null | Record<string, any> | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const process = (args: ClassValue[]): string[] => {
    const classes: string[] = [];
    for (const arg of args) {
      if (!arg) continue;
      if (typeof arg === 'string' || typeof arg === 'number') {
        classes.push(String(arg));
      } else if (Array.isArray(arg)) {
        classes.push(...process(arg));
      } else if (typeof arg === 'object') {
        for (const [key, value] of Object.entries(arg)) {
          if (value) classes.push(key);
        }
      }
    }
    return classes;
  };
  return process(inputs).join(' ').trim();
}

// ---- Money formatting ----

/** Convert paise to rupees (number) */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Convert rupees to paise (integer) */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Format paise as ₹1,234.56 */
export function formatPrice(paise: number): string {
  const rupees = paise / 100;
  return `${CURRENCY_SYMBOL}${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Calculate discount percentage */
export function getDiscountPercent(pricePaise: number, compareAtPaise: number): number {
  if (compareAtPaise <= pricePaise) return 0;
  return Math.round(((compareAtPaise - pricePaise) / compareAtPaise) * 100);
}

/** Calculate shipping for a subtotal */
export function calculateShipping(subtotalPaise: number): number {
  return subtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : SHIPPING_CHARGE_PAISE;
}

// ---- Slug generation ----

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---- Order number generation ----

export function generateOrderNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SSC-${datePart}-${randomPart}`;
}

// ---- Date formatting ----

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr: string): string {
  const now = new Date().getTime();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ---- Validation ----

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
}

export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ---- Misc ----

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len).trim() + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Safely format image URLs to handle spaces and special characters idempotently
 */
export function safeImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  try {
    return encodeURI(decodeURI(url));
  } catch {
    return encodeURI(url);
  }
}

export function getPrimaryImage(product: {
  images?: { url: string; is_primary: boolean; sort_order: number }[];
}): string {
  if (!product.images || product.images.length === 0) {
    return PLACEHOLDER_IMAGE;
  }
  const primary = product.images.find((img) => img.is_primary);
  if (primary && primary.url) return safeImageUrl(primary.url);
  const sorted = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
  return safeImageUrl(sorted[0]?.url) || PLACEHOLDER_IMAGE;
}

/** Debounce a function */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Build a WhatsApp chat URL */
export function whatsappUrl(number: string, message?: string): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
