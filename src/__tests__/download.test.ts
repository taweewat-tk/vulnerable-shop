// src/__tests__/download.test.ts
import request from 'supertest';
import { createApp } from '../app';

test('serves an invoice from the public folder', async () => {
  const res = await request(createApp()).get('/download').query({ file: 'INV-1001.txt' });
  expect(res.status).toBe(200);
  expect(res.text).toContain('INV-1001');
});

test('a doubled traversal sequence escapes the public folder', async () => {
  const res = await request(createApp())
    .get('/download')
    .query({ file: '....//....//package.json' });
  expect(res.status).toBe(200);
  expect(res.text).toContain('"name": "vulnerable-shop"');
});
