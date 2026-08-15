// src/__tests__/secrets.test.ts
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../app';
import { PAYMENT_API_KEY } from '../config';

test('a payment key is hardcoded in the source', () => {
  expect(PAYMENT_API_KEY).toMatch(/^sk_live_/);
});

test('the .env file is present in the repository', () => {
  const envPath = path.join(__dirname, '..', '..', '.env');
  expect(fs.existsSync(envPath)).toBe(true);
  expect(fs.readFileSync(envPath, 'utf8')).toContain('SESSION_SECRET=');
});

test('the error handler logs the incoming authorization header', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  await request(createApp()).get('/boom').set('Authorization', 'Bearer super-secret-token');

  const logged = spy.mock.calls.flat().join(' ');
  expect(logged).toContain('super-secret-token');

  spy.mockRestore();
});
