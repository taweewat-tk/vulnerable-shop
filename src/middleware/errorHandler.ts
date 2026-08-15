// src/middleware/errorHandler.ts
import { NextFunction, Request, Response } from 'express';
import { layout } from '../views/render';

// central error handler: logs the failing request, then renders a 500 page.
// The Authorization header is a bearer credential — never write it to logs,
// where it would sit in plaintext for anyone with log access to replay.
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[error] ${req.method} ${req.originalUrl} :: ${err.message}`);
  res.status(500).send(layout('เกิดข้อผิดพลาด', `<pre>${err.message}</pre>`));
}
