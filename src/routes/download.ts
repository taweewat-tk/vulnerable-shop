// src/routes/download.ts
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

const INVOICE_DIR = path.join(__dirname, '..', '..', 'public', 'invoices');

export function downloadRouter(): express.Router {
  const router = express.Router();

  router.get('/download', (req, res) => {
    const requested = String(req.query.file ?? '');

    // Resolve the request against the invoice dir, then require the result to
    // stay inside it. The old approach stripped "../" once with a regex, which
    // "....//" defeated (one strip turns it back into "../"). Containment on the
    // fully-resolved path can't be fooled that way.
    const target = path.resolve(INVOICE_DIR, requested);
    if (target !== INVOICE_DIR && !target.startsWith(INVOICE_DIR + path.sep)) {
      res.status(404).send('not found');
      return;
    }

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      res.status(404).send('not found');
      return;
    }

    res.type('text/plain').send(fs.readFileSync(target, 'utf8'));
  });

  return router;
}
