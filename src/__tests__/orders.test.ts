// src/__tests__/orders.test.ts
import request from 'supertest';
import { createApp } from '../app';

test('a user can read their own order', async () => {
  const res = await request(createApp()).get('/api/orders/1001').set('x-user-id', '1');
  expect(res.status).toBe(200);
  expect(res.body.note).toContain('Alice');
});

// Recording test for the IDOR at orders.ts. Order 1001 belongs to user 1; it
// used to be readable by user 2. With the ownership check the endpoint now 404s
// and leaks nothing about the order.
test('a user cannot read somebody else order (IDOR fixed)', async () => {
  const res = await request(createApp()).get('/api/orders/1001').set('x-user-id', '2');
  expect(res.status).toBe(404);
  expect(res.body.userId).toBeUndefined();
});

test('a request without x-user-id is rejected', async () => {
  const res = await request(createApp()).get('/api/orders/1001');
  expect(res.status).toBe(401);
  expect(res.body.error).toMatch(/x-user-id/);
});

test('a request for an order that does not exist is a 404', async () => {
  const res = await request(createApp()).get('/api/orders/9999').set('x-user-id', '1');
  expect(res.status).toBe(404);
  expect(res.body.error).toBe('not found');
});
