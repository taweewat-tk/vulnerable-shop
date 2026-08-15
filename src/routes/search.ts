// src/routes/search.ts
import express from 'express';
import { Database, query } from '../lib/minisql';
import { layout, escapeHtml } from '../views/render';

export function searchRouter(db: Database): express.Router {
  const router = express.Router();

  router.get('/search', (req, res) => {
    const q = String(req.query.q ?? '');

    // build the product search query from the ?q= parameter
    const sql = `SELECT id, name, price FROM products WHERE name LIKE '%${q}%' AND hidden = 0`;
    const rows = query(db, sql);

    const items = rows
      .map((row) => `<li>${escapeHtml(String(row.name))} — ${row.price}</li>`)
      .join('\n');

    res.send(layout('ผลการค้นหา', `<ul>\n${items}\n</ul>`));
  });

  return router;
}
