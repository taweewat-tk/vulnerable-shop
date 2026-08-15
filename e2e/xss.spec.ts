// e2e/xss.spec.ts
import { test, expect } from '@playwright/test';

// History: the QA track reproduced this bug live with Playwright MCP — posting
// the review as `mallory`, reloading /product/1 as a later visitor set
// window.__pwned === true because the stored body was emitted as raw markup at
// src/routes/reviews.ts:21. Boss stage 2 fixed it by wrapping row.body in
// escapeHtml(), so this assertion has now been INVERTED: the payload renders as
// inert, escaped text and the script never runs.
test('a stored review payload no longer executes in a later visitor browser (XSS fixed)', async ({ page }) => {
  await page.goto('/product/1');

  await page.fill('input[name="author"]', 'mallory');
  await page.fill('input[name="body"]', '<img src=x onerror="window.__pwned = true">');
  await page.click('button[type="submit"]');

  await page.goto('/product/1');
  // The payload is now visible as literal text, not a live element...
  await expect(page.locator('#reviews')).toContainText('<img src=x onerror="window.__pwned = true">');
  // ...and it never executed.
  expect(await page.evaluate(() => (window as never as { __pwned?: boolean }).__pwned)).not.toBe(true);
});

test('the product page lists the seeded review', async ({ page }) => {
  await page.goto('/product/1');
  await expect(page.locator('#reviews')).toContainText('ใช้ดีมาก');
});
