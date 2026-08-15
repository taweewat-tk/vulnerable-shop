// src/routes/search.ts
import express from 'express';
import { Database, query } from '../lib/minisql';
import { layout, escapeHtml } from '../views/render';

export function searchRouter(db: Database): express.Router {
  const router = express.Router();

  router.get('/search', (req, res) => {
    const q = String(req.query.q ?? '');

    // Parameterised query: the ?q= value is bound as data, never spliced into
    // the SQL text, so a crafted string can no longer break out of the LIKE.
    const sql = 'SELECT id, name, price FROM products WHERE name LIKE ? AND hidden = 0';
    const rows = query(db, sql, [`%${q}%`]);

    const items = rows
      .map((row) => `<li>${escapeHtml(String(row.name))} — ${row.price}</li>`)
      .join('\n');

    res.send(layout('ผลการค้นหา', `<ul>\n${items}\n</ul>`));
  });

  return router;
}
