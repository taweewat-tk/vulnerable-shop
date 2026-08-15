// playwright.config.ts
import { defineConfig } from '@playwright/test';

// A DIFFERENT port from the app's default dev port (3000) so this E2E run
// never collides with a learner's `npm run dev:bg` server on 3000.
const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    // NOTE: `npm run dev` uses `tsx watch`, which does not shut down
    // cleanly when Playwright sends it a termination signal during
    // teardown, causing `npx playwright test` to hang after the tests
    // finish. Running `tsx` directly (no watch mode) starts the same app
    // but exits cleanly, so the whole run terminates on its own.
    command: 'npx tsx src/index.ts',
    url: `http://localhost:${PORT}/search?q=Mug`,
    env: { PORT: String(PORT) },
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
