import { APP_NAME, WHATSAPP_NUMBER } from './constants';
import { formatPrice } from './utils';
import type { Product, ProductVariant, CartItemLocal } from '@/types';

/**
 * Resolves the canonical base URL for product links:
 * - In live production browser: uses window.location.origin
 * - In local dev or SSR: defaults to production Vercel deployment URL
 */
export function getSiteBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.trim().replace(/\/+$/, '');
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin;
    }
  }

  const envUrl = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '');
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  return 'https://shiva-shakthi-collections.vercel.app';
}

/**
 * Generates direct clickable URL for a product detail page.
 */
export function getProductDetailUrl(slugOrId: string, baseUrl?: string): string {
  const base = (baseUrl || getSiteBaseUrl()).replace(/\/+$/, '');
  const clean = String(slugOrId || '').trim().replace(/^\/+|\/+$/g, '');
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  return `${base}/product/${clean}`;
}

/**
 * Strips all non-digit characters from the phone number.
 */
export function sanitizeWhatsAppPhone(phone?: string): string {
  const raw = (phone || WHATSAPP_NUMBER || '').trim();
  const cleaned = raw.replace(/[^0-9]/g, '');
  return cleaned || '918971263989';
}

/**
 * Builds a formatted single-product order inquiry message for WhatsApp.
 */
export function buildSingleProductWhatsAppMessage(
  product: Product,
  variant?: ProductVariant | null,
  quantity = 1,
  productUrl?: string
): string {
  const unitPricePaise = product.price_paise + (variant?.price_adjustment_paise || 0);
  const lineSubtotalPaise = unitPricePaise * quantity;
  const link = productUrl || getProductDetailUrl(product.slug || product.id);

  const lines = [
    `*ORDER INQUIRY — ${APP_NAME.toUpperCase()}*`,
    `----------------------------------------`,
    `*Product:* ${product.name}`,
    ...(variant ? [`*Variant:* ${variant.name} (${variant.value})`] : []),
    ...(product.sku ? [`*SKU:* ${product.sku}`] : []),
    `*Quantity:* ${quantity}`,
    `*Unit Price:* ${formatPrice(unitPricePaise)}`,
    `*Total:* ${formatPrice(lineSubtotalPaise)}`,
    ...(link ? [`*Product Link:* ${link}`] : []),
    `----------------------------------------`,
    `Namaste! I would like to order this piece. Please let me know about stock availability, delivery timelines, and payment options.`,
  ];

  return lines.join('\n');
}

/**
 * Builds a restock / inquiry message for out-of-stock items.
 */
export function buildOutOfStockInquiryWhatsAppMessage(
  product: Product,
  variant?: ProductVariant | null,
  productUrl?: string
): string {
  const unitPricePaise = product.price_paise + (variant?.price_adjustment_paise || 0);
  const link = productUrl || getProductDetailUrl(product.slug || product.id);

  const lines = [
    `*RESTOCK INQUIRY — ${APP_NAME.toUpperCase()}*`,
    `----------------------------------------`,
    `*Product:* ${product.name}`,
    ...(variant ? [`*Variant:* ${variant.name} (${variant.value})`] : []),
    ...(product.sku ? [`*SKU:* ${product.sku}`] : []),
    `*Status:* Currently Out of Stock`,
    `*Price:* ${formatPrice(unitPricePaise)}`,
    ...(link ? [`*Product Link:* ${link}`] : []),
    `----------------------------------------`,
    `Namaste! I would like to inquire about this piece which is currently out of stock. Please let me know when it will be restocked or if I can pre-order / customize it.`,
  ];

  return lines.join('\n');
}

export interface BuildCartWhatsAppOptions {
  discountPaise?: number;
  baseUrl?: string;
}

/**
 * Builds a formatted itemized cart order message for WhatsApp with direct clickable product links.
 *
 * Format matches:
 * *NEW CART ORDER — SHIVA SHAKTHI COLLECTIONS*
 * ----------------------------------------
 * *Items Ordered:*
 *
 * 1. *Product Name*
 *    Product Link: https://shiva-shakthi-collections.vercel.app/product/{slug}
 *    Qty: 1 × ₹299 = ₹299
 *
 * ----------------------------------------
 * *Total Items:* 1
 * *Subtotal:* ₹299
 * *Estimated Shipping:* ₹49
 * *Grand Total:* ₹348
 *
 * ----------------------------------------
 * Namaste! I have prepared my cart on your website. Please confirm availability, delivery details, and payment arrangements.
 */
export function buildCartWhatsAppMessage(
  items: CartItemLocal[],
  subtotalPaise: number,
  shippingPaise: number,
  totalPaise: number,
  options?: BuildCartWhatsAppOptions
): string {
  const baseUrl = options?.baseUrl || getSiteBaseUrl();
  const discountPaise = options?.discountPaise || 0;

  const lines = [
    `*NEW CART ORDER — ${APP_NAME.toUpperCase()}*`,
    `----------------------------------------`,
    `*Items Ordered:*`,
    '',
  ];

  items.forEach((item, index) => {
    const unitPricePaise = item.product.price_paise + (item.variant?.price_adjustment_paise || 0);
    const lineTotalPaise = unitPricePaise * item.quantity;
    const variantText = item.variant ? ` [${item.variant.value}]` : '';
    const productSlug = item.product.slug || item.product.id || item.productId;
    const productLink = getProductDetailUrl(productSlug, baseUrl);

    lines.push(`${index + 1}. *${item.product.name}*${variantText}`);
    lines.push(`   Product Link: ${productLink}`);
    lines.push(`   Qty: ${item.quantity} \u00D7 ${formatPrice(unitPricePaise)} = ${formatPrice(lineTotalPaise)}`);

    if (index < items.length - 1) {
      lines.push('');
    }
  });

  const totalItemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  lines.push(
    '',
    `----------------------------------------`,
    `*Total Items:* ${totalItemCount}`,
    `*Subtotal:* ${formatPrice(subtotalPaise)}`
  );

  if (discountPaise > 0) {
    lines.push(`*Discount:* -${formatPrice(discountPaise)}`);
  }

  lines.push(
    `*Estimated Shipping:* ${shippingPaise === 0 ? 'FREE' : formatPrice(shippingPaise)}`,
    `*Grand Total:* ${formatPrice(totalPaise)}`,
    '',
    `----------------------------------------`,
    `Namaste! I have prepared my cart on your website. Please confirm availability, delivery details, and payment arrangements.`
  );

  return lines.join('\n');
}

/**
 * Creates an encoded WhatsApp link ready to open in browser or app.
 */
export function createWhatsAppUrl(phone: string, message: string): string {
  const clean = sanitizeWhatsAppPhone(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}
