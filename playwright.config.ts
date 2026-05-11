import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for end-to-end smoke tests against the running stack.
 *
 * Locally:
 *   npm run dev          # in one shell starts server (3001) + client (5173)
 *   npm run e2e:install  # one-time browser download
 *   npm run e2e
 *
 * CI starts both services manually in the workflow before running.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
