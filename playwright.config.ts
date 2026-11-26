import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright starts its own copy of the game (with the API) on port 4174, so it never
 * clashes with a dev server you already have open on 5173.
 * Run everything:      npm test
 * Only UI / API / a11y: npm run test:ui | test:api | test:a11y
 * Watch it play:       npx playwright test --headed --project=chromium
 * Test the live site:  BASE_URL=https://your-deploy.vercel.app npm test   (no local server started)
 */
const PORT = 4174;
const LIVE_URL = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: LIVE_URL ?? `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Turn on the browser's "reduce motion" setting, which the game supports: endless animations
    // stop and the door animation takes 0.7 s instead of 2.2 s. Faster, steadier tests, and axe
    // measures colors at their final values.
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: LIVE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
