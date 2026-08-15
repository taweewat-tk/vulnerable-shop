// src/__tests__/db.test.ts
import { createDb } from '../lib/db';
import { query } from '../lib/minisql';

test('seeds one hidden product that must not appear in normal searches', () => {
  const db = createDb();
  const hidden = query(db, 'SELECT * FROM products WHERE hidden = 1');
  expect(hidden).toHaveLength(1);
  expect(hidden[0].name).toBe('Unreleased Prototype');
});

test('seeds orders that belong to two different users', () => {
  const db = createDb();
  const owners = new Set(createDb().orders.map((o) => o.userId));
  expect(query(db, 'SELECT * FROM orders').length).toBeGreaterThanOrEqual(2);
  expect(owners.size).toBeGreaterThanOrEqual(2);
});

test('each call returns an independent database', () => {
  const first = createDb();
  first.products.push({ id: 999, name: 'Injected', price: 0, hidden: 0 });
  expect(createDb().products).toHaveLength(3);
});
