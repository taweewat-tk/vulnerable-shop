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

// --- comparison operators (compare()) -----------------------------------
test('supports every comparison operator', () => {
  expect(query(db, 'SELECT id FROM products WHERE price > 26000').map((r) => r.id)).toEqual([2, 3]);
  expect(query(db, 'SELECT id FROM products WHERE price < 26000').map((r) => r.id)).toEqual([1]);
  expect(query(db, 'SELECT id FROM products WHERE price >= 27000').map((r) => r.id)).toEqual([2, 3]);
  expect(query(db, 'SELECT id FROM products WHERE price <= 25000').map((r) => r.id)).toEqual([1]);
  expect(query(db, 'SELECT id FROM products WHERE id != 1').map((r) => r.id)).toEqual([2, 3]);
  expect(query(db, 'SELECT id FROM products WHERE id <> 2').map((r) => r.id)).toEqual([1, 3]);
});

// --- parser edge cases ---------------------------------------------------
test('honours parentheses to group a sub-expression', () => {
  const rows = query(db, 'SELECT id FROM products WHERE (hidden = 0)');
  expect(rows.map((r) => r.id)).toEqual([1, 2]);
});

test('a bare column acts as a truthiness filter', () => {
  // no operator after the operand → the value itself is the predicate
  const rows = query(db, 'SELECT id FROM products WHERE hidden');
  expect(rows.map((r) => r.id)).toEqual([3]);
});

test('a doubled quote is one literal quote inside a string', () => {
  // matches nothing, but exercises the '' escape branch of the tokenizer
  const rows = query(db, "SELECT id FROM products WHERE name = 'Blue''Mug'");
  expect(rows).toHaveLength(0);
});

// --- error paths ---------------------------------------------------------
test('rejects an unexpected character', () => {
  expect(() => query(db, 'SELECT * FROM products WHERE id @ 1')).toThrow(/unexpected character/);
});

test('rejects an unclosed parenthesis', () => {
  expect(() => query(db, 'SELECT * FROM products WHERE (hidden = 0')).toThrow(/expected \)/);
});

test('rejects an operator where an operand is expected', () => {
  expect(() => query(db, 'SELECT * FROM products WHERE = 1')).toThrow(/unexpected token/);
});
