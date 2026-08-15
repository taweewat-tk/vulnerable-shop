// e2e/xss.spec.ts
import { test, expect } from '@playwright/test';

// This is the test the QA track writes after reproducing the bug with
// Playwright MCP. It must go from passing (hole open) to failing (hole fixed)
// once the body is escaped — at which point the assertion is inverted.
//
// Reproduced live via Playwright MCP against the dev server: submitting this
// review as `mallory`, then reloading /product/1 as a later visitor, set
// window.__pwned === true and ran the payload (the browser hit /product/x for
// `<img src=x>`, got a 404, and fired onerror). The stored body is emitted as
// raw markup at src/routes/reviews.ts:21 — `${row.body}` interpolated with no
// escaping, while the neighbouring `author` is passed through escapeHtml().
//
// Boss stage 2 fix: wrap row.body in escapeHtml() at reviews.ts:21. After that
// the payload renders as inert text, window.__pwned stays undefined, and this
// assertion must be inverted to `.not.toBe(true)` (or assert the escaped text
// is present) to lock the hole shut.
test('a stored review payload executes in a later visitor browser', async ({ page }) => {
  await page.goto('/product/1');

  await page.fill('input[name="author"]', 'mallory');
  await page.fill('input[name="body"]', '<img src=x onerror="window.__pwned = true">');
  await page.click('button[type="submit"]');

  await page.goto('/product/1');
  await expect.poll(() => page.evaluate(() => (window as never as { __pwned?: boolean }).__pwned))
    .toBe(true);
});

test('the product page lists the seeded review', async ({ page }) => {
  await page.goto('/product/1');
  await expect(page.locator('#reviews')).toContainText('ใช้ดีมาก');
});
