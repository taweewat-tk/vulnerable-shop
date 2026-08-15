// src/__tests__/minisql.test.ts
import { query, Database } from '../lib/minisql';

const db: Database = {
  products: [
    { id: 1, name: 'Blue Mug', price: 25000, hidden: 0 },
    { id: 2, name: 'Red Mug', price: 27000, hidden: 0 },
    { id: 3, name: 'Unreleased Prototype', price: 99900, hidden: 1 },
  ],
};

test('selects every row when there is no WHERE clause', () => {
  expect(query(db, 'SELECT * FROM products')).toHaveLength(3);
});

test('filters with LIKE and AND', () => {
  const rows = query(db, "SELECT * FROM products WHERE name LIKE '%Mug%' AND hidden = 0");
  expect(rows.map((r) => r.id)).toEqual([1, 2]);
});

test('projects only the requested columns', () => {
  const rows = query(db, "SELECT id, name FROM products WHERE id = 1");
  expect(rows).toEqual([{ id: 1, name: 'Blue Mug' }]);
});

test('treats -- as a comment to the end of the line', () => {
  const rows = query(db, "SELECT * FROM products WHERE hidden = 0 -- AND id = 1");
  expect(rows).toHaveLength(2);
});

test('a parameter is data, never SQL', () => {
  const payload = "%' OR '1'='1' --";
  const rows = query(db, 'SELECT * FROM products WHERE name LIKE ? AND hidden = 0', [payload]);
  expect(rows).toHaveLength(0);
});

test('string concatenation lets the payload rewrite the query', () => {
  const payload = "' OR '1'='1' --";
  const rows = query(db, `SELECT * FROM products WHERE name LIKE '%${payload}%' AND hidden = 0`);
  expect(rows).toHaveLength(3);
  expect(rows.some((r) => r.hidden === 1)).toBe(true);
});
