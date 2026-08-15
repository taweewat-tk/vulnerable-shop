// src/app.ts
import express from 'express';
import { createDb } from './lib/db';
import { searchRouter } from './routes/search';
import { reviewsRouter } from './routes/reviews';
import { ordersRouter } from './routes/orders';
import { downloadRouter } from './routes/download';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): express.Express {
  const app = express();
  const db = createDb();

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(searchRouter(db));
  app.use(reviewsRouter(db));
  app.use(ordersRouter(db));
  app.use(downloadRouter());

  app.get('/boom', () => {
    throw new Error('unhandled failure in the checkout path');
  });

  app.use(errorHandler);

  return app;
}
