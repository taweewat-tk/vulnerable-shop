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

test('a crafted search string leaks hidden products', async () => {
  const res = await request(createApp()).get('/search').query({ q: "' OR '1'='1' --" });
  expect(res.status).toBe(200);
  expect(res.text).toContain('Unreleased Prototype');
});
