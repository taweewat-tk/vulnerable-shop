// src/__tests__/discountEngine.test.ts
//
// Boss stage 1 — QA Gauntlet. discountEngine.ts shipped years ago with 0%
// coverage. These tests take it to ≥85% statement coverage AND aim at the two
// hidden bugs that a coverage-only pass would sail straight past: high coverage
// is not the same as high confidence, so several cases assert on the exact
// wrong number the engine produces today, with a BUG note stating what a
// correct engine should have returned. They stay green (they pin real current
// behavior) so `npm test` is still green, while making the defects explicit.

import {
  subtotalOf,
  tierPercentFor,
  priceCart,
  type CartLine,
  type Coupon,
} from '../legacy/discountEngine';

const line = (unitCents: number, qty: number, sku = 'SKU'): CartLine => ({ sku, unitCents, qty });

// --- subtotalOf ----------------------------------------------------------
describe('subtotalOf', () => {
  test('an empty cart has a zero subtotal', () => {
    expect(subtotalOf([])).toBe(0);
  });

  test('sums unitCents * qty across every line', () => {
    expect(subtotalOf([line(2500, 2), line(1000, 3)])).toBe(2500 * 2 + 1000 * 3);
  });
});

// --- tierPercentFor (boundaries) -----------------------------------------
describe('tierPercentFor', () => {
  test('below the low tier earns no discount', () => {
    expect(tierPercentFor(49999)).toBe(0);
  });

  test('exactly at the low tier earns 5%', () => {
    expect(tierPercentFor(50000)).toBe(5);
  });

  test('between the tiers stays at 5%', () => {
    expect(tierPercentFor(99999)).toBe(5);
  });

  test('exactly at the high tier earns 10%', () => {
    expect(tierPercentFor(100000)).toBe(10);
  });

  test('above the high tier stays at 10%', () => {
    expect(tierPercentFor(250000)).toBe(10);
  });
});

// --- priceCart: normal paths --------------------------------------------
describe('priceCart — normal paths', () => {
  test('an empty cart prices to all zeros with nothing applied', () => {
    expect(priceCart([])).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      totalCents: 0,
      applied: [],
    });
  });

  test('a small cart gets no tier discount', () => {
    const res = priceCart([line(40000, 1)]);
    expect(res.subtotalCents).toBe(40000);
    expect(res.discountCents).toBe(0);
    expect(res.totalCents).toBe(40000);
    expect(res.applied).toEqual([]);
  });

  test('the low tier takes 5% off the whole cart', () => {
    const res = priceCart([line(50000, 1)]);
    expect(res.discountCents).toBe(2500);
    expect(res.totalCents).toBe(47500);
    expect(res.applied).toEqual(['tier-5']);
  });

  test('the high tier takes 10% off the whole cart', () => {
    const res = priceCart([line(100000, 1)]);
    expect(res.discountCents).toBe(10000);
    expect(res.totalCents).toBe(90000);
    expect(res.applied).toEqual(['tier-10']);
  });

  test('a percent coupon discounts a fraction of the subtotal', () => {
    const coupon: Coupon = { code: 'SAVE10', kind: 'percent', value: 10 };
    const res = priceCart([line(40000, 1)], [coupon]);
    expect(res.discountCents).toBe(4000);
    expect(res.totalCents).toBe(36000);
    expect(res.applied).toEqual(['SAVE10']);
  });

  test('a fixed coupon discounts a flat amount', () => {
    const coupon: Coupon = { code: 'FLAT50', kind: 'fixed', value: 5000 };
    const res = priceCart([line(40000, 1)], [coupon]);
    expect(res.discountCents).toBe(5000);
    expect(res.totalCents).toBe(35000);
    expect(res.applied).toEqual(['FLAT50']);
  });

  test('a tier discount and a coupon stack, both off the pre-discount subtotal', () => {
    const coupon: Coupon = { code: 'VIP5', kind: 'percent', value: 5 };
    const res = priceCart([line(100000, 1)], [coupon]);
    // tier-10 = 10000, plus VIP5 = 5000, both computed on the 100000 subtotal
    expect(res.discountCents).toBe(15000);
    expect(res.totalCents).toBe(85000);
    expect(res.applied).toEqual(['tier-10', 'VIP5']);
  });
});

// --- priceCart: hidden bugs (coverage alone would miss these) ------------
describe('priceCart — hidden bugs', () => {
  // BUG 1 — discountEngine.ts:61
  // `totalCents = subtotalCents - discountCents` is never floored at 0, so any
  // discount larger than the cart drives the total negative. Here a 50000-cent
  // fixed coupon on a 10000-cent cart yields total -40000: the store would owe
  // the customer money. A correct engine should clamp totalCents to >= 0 (and
  // cap discountCents at the subtotal). This test pins the buggy value so the
  // defect is documented and cannot regress silently.
  test('BUG: a coupon larger than the cart produces a NEGATIVE total (should floor at 0)', () => {
    const coupon: Coupon = { code: 'OVERKILL', kind: 'fixed', value: 50000 };
    const res = priceCart([line(10000, 1)], [coupon]);
    expect(res.totalCents).toBe(-40000); // current (buggy) behavior
    expect(res.totalCents).toBeLessThan(0); // the smoking gun — should be impossible
    // A correct engine: expect(res.totalCents).toBe(0)
  });

  // BUG 2 — discountEngine.ts:52
  // The coupon loop applies every entry with no de-duplication, so passing the
  // same code twice stacks its discount. `applied` even records the code twice,
  // proving it was counted twice. A correct engine should apply a given code at
  // most once. Here SAVE10 (10% of 40000 = 4000) is applied twice for an 8000
  // discount instead of 4000.
  test('BUG: the same coupon code STACKS when passed twice (should apply once)', () => {
    const save10: Coupon = { code: 'SAVE10', kind: 'percent', value: 10 };
    const res = priceCart([line(40000, 1)], [save10, save10]);
    expect(res.discountCents).toBe(8000); // current (buggy) behavior: 4000 charged twice
    expect(res.applied).toEqual(['SAVE10', 'SAVE10']); // duplicate proves double-count
    // A correct engine: expect(res.discountCents).toBe(4000) and applied === ['SAVE10']
  });
});
