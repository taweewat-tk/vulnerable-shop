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

// Recording test for the secret-in-logs issue at errorHandler.ts. It used to
// assert the bearer token was written to the error log; the handler no longer
// logs the Authorization header, so the token must be absent while the request
// path is still logged for diagnostics.
test('the error handler does NOT log the authorization header (secret-in-logs fixed)', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

  await request(createApp()).get('/boom').set('Authorization', 'Bearer super-secret-token');

  const logged = spy.mock.calls.flat().join(' ');
  expect(logged).not.toContain('super-secret-token');
  expect(logged).toContain('/boom');

  spy.mockRestore();
});
