// src/__tests__/reviews.test.ts
import request from 'supertest';
import { createApp } from '../app';

test('shows the reviews that already exist for a product', async () => {
  const res = await request(createApp()).get('/product/1');
  expect(res.status).toBe(200);
  expect(res.text).toContain('ใช้ดีมาก');
});

test('a review body is stored and rendered as raw markup', async () => {
  const app = createApp();
  const payload = '<img src=x onerror="window.__pwned=1">';

  await request(app).post('/product/1/reviews').send({ author: 'mallory', body: payload });

  const res = await request(app).get('/product/1');
  expect(res.text).toContain(payload);
  expect(res.text).not.toContain('&lt;img');
});
