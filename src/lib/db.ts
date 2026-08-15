// src/lib/db.ts
import { Database } from './minisql';

// A fresh database per call keeps tests independent of each other.
export function createDb(): Database {
  return {
    products: [
      { id: 1, name: 'Blue Mug', price: 25000, hidden: 0 },
      { id: 2, name: 'Red Mug', price: 27000, hidden: 0 },
      { id: 3, name: 'Unreleased Prototype', price: 99900, hidden: 1 },
    ],
    users: [
      { id: 1, username: 'alice', email: 'alice@example.com' },
      { id: 2, username: 'bob', email: 'bob@example.com' },
    ],
    orders: [
      { id: 1001, userId: 1, total: 52000, note: 'Alice — ของขวัญวันเกิด' },
      { id: 1002, userId: 2, total: 27000, note: 'Bob — ซื้อเอง' },
    ],
    reviews: [{ id: 1, productId: 1, author: 'alice', body: 'ใช้ดีมาก' }],
  };
}
