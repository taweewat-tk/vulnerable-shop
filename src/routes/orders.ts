// src/routes/orders.ts
import express from 'express';
import { Database, query } from '../lib/minisql';

export function ordersRouter(db: Database): express.Router {
  const router = express.Router();

  router.get('/api/orders/:id', (req, res) => {
    const callerId = Number(req.headers['x-user-id'] ?? 0);
    if (!callerId) {
      res.status(401).json({ error: 'missing x-user-id' });
      return;
    }

    // look up the requested order by id
    const rows = query(db, 'SELECT * FROM orders WHERE id = ?', [Number(req.params.id)]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'not found' });
      return;
    }

    // Enforce ownership: a caller may only read their own orders. Return 404
    // (not 403) so the endpoint does not confirm that someone else's order id
    // exists.
    if (Number(rows[0].userId) !== callerId) {
      res.status(404).json({ error: 'not found' });
      return;
    }

    res.json(rows[0]);
  });

  return router;
}
