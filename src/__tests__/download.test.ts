// src/__tests__/download.test.ts
import request from 'supertest';
import { createApp } from '../app';

test('serves an invoice from the public folder', async () => {
  const res = await request(createApp()).get('/download').query({ file: 'INV-1001.txt' });
  expect(res.status).toBe(200);
  expect(res.text).toContain('INV-1001');
});

// Recording test for the path traversal at download.ts. It used to assert the
// "....//" bypass escaped the invoice folder and served package.json; with the
// resolve+containment check the request is now refused.
test('a doubled traversal sequence is blocked (path traversal fixed)', async () => {
  const res = await request(createApp())
    .get('/download')
    .query({ file: '....//....//package.json' });
  expect(res.status).toBe(404);
  expect(res.text).not.toContain('"name": "vulnerable-shop"');
});
