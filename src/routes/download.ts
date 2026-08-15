// src/routes/download.ts
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';

const INVOICE_DIR = path.join(__dirname, '..', '..', 'public', 'invoices');

export function downloadRouter(): express.Router {
  const router = express.Router();

  router.get('/download', (req, res) => {
    const requested = String(req.query.file ?? '');

    // strip "../" segments before joining onto the invoice dir
    const cleaned = requested.replace(/\.\.\//g, '');
    const target = path.join(INVOICE_DIR, cleaned);

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      res.status(404).send('not found');
      return;
    }

    res.type('text/plain').send(fs.readFileSync(target, 'utf8'));
  });

  return router;
}
