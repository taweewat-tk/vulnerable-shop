// src/__tests__/search.test.ts
import request from 'supertest';
import { createApp } from '../app';

test('a normal search only returns visible products', async () => {
  const res = await request(createApp()).get('/search').query({ q: 'Mug' });
  expect(res.status).toBe(200);
  expect(res.text).toContain('Blue Mug');
  expect(res.text).toContain('Red Mug');
  expect(res.text).not.toContain('Unreleased Prototype');
});

test('a normal search for a hidden product name still excludes it', async () => {
  const res = await request(createApp()).get('/search').query({ q: 'Prototype' });
  expect(res.status).toBe(200);
  expect(res.text).not.toContain('Unreleased Prototype');
});

// Recording test for the SQL injection at search.ts. It used to assert the
// leak succeeded; after switching to a parameterised query the crafted string
// is bound as data, so the hidden product must NOT appear.
test('a crafted search string no longer leaks hidden products (SQLi fixed)', async () => {
  const res = await request(createApp()).get('/search').query({ q: "' OR '1'='1' --" });
  expect(res.status).toBe(200);
  expect(res.text).not.toContain('Unreleased Prototype');
});
