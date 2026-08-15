// src/legacy/discountEngine.ts
// Legacy pricing rules, carried over from the old storefront.
// Shipped years ago with no tests.

export interface CartLine {
  sku: string;
  unitCents: number;
  qty: number;
}

export interface Coupon {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
}

export interface PricedCart {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  applied: string[];
}

const TIER_HIGH_CENTS = 100000;
const TIER_LOW_CENTS = 50000;

export function subtotalOf(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitCents * line.qty, 0);
}

export function tierPercentFor(subtotalCents: number): number {
  if (subtotalCents >= TIER_HIGH_CENTS) return 10;
  if (subtotalCents >= TIER_LOW_CENTS) return 5;
  return 0;
}

export function priceCart(lines: CartLine[], coupons: Coupon[] = []): PricedCart {
  const subtotalCents = subtotalOf(lines);
  const applied: string[] = [];
  let discountCents = 0;

  const tierPercent = tierPercentFor(subtotalCents);
  if (tierPercent > 0) {
    // apply the tier discount across the cart lines
    discountCents += lines.reduce(
      (sum, line) => sum + Math.round((line.unitCents * line.qty * tierPercent) / 100),
      0,
    );
    applied.push(`tier-${tierPercent}`);
  }

  for (const coupon of coupons) {
    if (coupon.kind === 'percent') {
      discountCents += Math.round((subtotalCents * coupon.value) / 100);
    } else {
      discountCents += coupon.value;
    }
    applied.push(coupon.code);
  }

  const totalCents = subtotalCents - discountCents;

  return { subtotalCents, discountCents, totalCents, applied };
}
