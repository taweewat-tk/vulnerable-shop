// src/__tests__/orders.test.ts
import request from 'supertest';
import { createApp } from '../app';

test('a user can read their own order', async () => {
  const res = await request(createApp()).get('/api/orders/1001').set('x-user-id', '1');
  expect(res.status).toBe(200);
  expect(res.body.note).toContain('Alice');
});

test('a user can read somebody else order', async () => {
  const res = await request(createApp()).get('/api/orders/1001').set('x-user-id', '2');
  expect(res.status).toBe(200);
  expect(res.body.userId).toBe(1);
});
