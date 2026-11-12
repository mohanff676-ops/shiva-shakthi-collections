import { useMutation } from '@tanstack/react-query';
import type { Coupon } from '@/types';

export interface ValidateCouponResult {
  coupon: Coupon;
  discountPaise: number;
}

const DEFAULT_COUPONS: Record<string, { type: 'percentage' | 'fixed'; value: number; minOrderPaise: number; maxDiscountPaise?: number }> = {
  WELCOME10: { type: 'percentage', value: 10, minOrderPaise: 100000, maxDiscountPaise: 50000 },
  FESTIVE15: { type: 'percentage', value: 15, minOrderPaise: 250000, maxDiscountPaise: 100000 },
  ROYAL500: { type: 'fixed', value: 500, minOrderPaise: 300000 },
};

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, subtotalPaise }: { code: string; subtotalPaise: number }): Promise<ValidateCouponResult> => {
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) throw new Error('Please enter a coupon code');

      const c = DEFAULT_COUPONS[trimmed];
      if (!c) {
        throw new Error('Invalid or expired coupon code. Try "WELCOME10" or "FESTIVE15".');
      }

      if (subtotalPaise < c.minOrderPaise) {
        throw new Error(`Minimum order of ₹${c.minOrderPaise / 100} required for this coupon`);
      }

      let discountPaise = 0;
      if (c.type === 'percentage') {
        discountPaise = Math.round((subtotalPaise * c.value) / 100);
        if (c.maxDiscountPaise && discountPaise > c.maxDiscountPaise) {
          discountPaise = c.maxDiscountPaise;
        }
      } else {
        discountPaise = c.value * 100;
      }

      const matchedCoupon: Coupon = {
        id: `coupon-${trimmed.toLowerCase()}`,
        code: trimmed,
        description: `${c.value}${c.type === 'percentage' ? '%' : '₹'} off on your jewellery order`,
        discount_type: c.type,
        discount_value: c.value,
        min_order_paise: c.minOrderPaise,
        max_discount_paise: c.maxDiscountPaise || null,
        usage_limit: 100,
        used_count: 5,
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return {
        coupon: matchedCoupon,
        discountPaise,
      };
    },
  });
}
