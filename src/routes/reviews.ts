// src/routes/reviews.ts
import express from 'express';
import { Database, query } from '../lib/minisql';
import { layout, escapeHtml } from '../views/render';

export function reviewsRouter(db: Database): express.Router {
  const router = express.Router();

  router.get('/product/:id', (req, res) => {
    const id = Number(req.params.id);
    const products = query(db, 'SELECT * FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      res.status(404).send(layout('ไม่พบสินค้า', '<p>ไม่พบสินค้าที่ต้องการ</p>'));
      return;
    }

    const reviews = query(db, 'SELECT * FROM reviews WHERE productId = ?', [id]);

    // render each stored review into the list
    const rendered = reviews
      .map((row) => `<li><b>${escapeHtml(String(row.author))}</b>: ${row.body}</li>`)
      .join('\n');

    res.send(
      layout(
        String(products[0].name),
        `<ul id="reviews">\n${rendered}\n</ul>
<form method="post" action="/product/${id}/reviews">
  <input name="author" placeholder="ชื่อ">
  <input name="body" placeholder="รีวิว">
  <button type="submit">ส่งรีวิว</button>
</form>`,
      ),
    );
  });

  router.post('/product/:id/reviews', (req, res) => {
    const id = Number(req.params.id);
    const nextId = db.reviews.length + 1;
    db.reviews.push({
      id: nextId,
      productId: id,
      author: String(req.body.author ?? 'anonymous'),
      body: String(req.body.body ?? ''),
    });
    res.redirect(`/product/${id}`);
  });

  return router;
}
