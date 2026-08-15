// src/index.ts
import { createApp } from './app';
import { PORT } from './config';

createApp().listen(PORT, () => {
  console.log(`vulnerable-shop listening on http://localhost:${PORT}`);
});
