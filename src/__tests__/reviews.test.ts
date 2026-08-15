// src/__tests__/reviews.test.ts
import request from 'supertest';
import { createApp } from '../app';

test('shows the reviews that already exist for a product', async () => {
  const res = await request(createApp()).get('/product/1');
  expect(res.status).toBe(200);
  expect(res.text).toContain('ใช้ดีมาก');
});

// Recording test for the stored XSS at reviews.ts:21. It used to assert the
// body survived as raw markup; now the body is HTML-escaped, so the raw payload
// must be gone and its escaped form present instead.
test('a review body is escaped, not rendered as raw markup (stored XSS fixed)', async () => {
  const app = createApp();
  const payload = '<img src=x onerror="window.__pwned=1">';

  await request(app).post('/product/1/reviews').send({ author: 'mallory', body: payload });

  const res = await request(app).get('/product/1');
  expect(res.text).not.toContain(payload);
  expect(res.text).toContain('&lt;img');
});
