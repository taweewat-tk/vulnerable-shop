// src/__tests__/smoke.test.ts
import { projectName } from '../config';

test('toolchain is wired up', () => {
  expect(projectName).toBe('vulnerable-shop');
});
