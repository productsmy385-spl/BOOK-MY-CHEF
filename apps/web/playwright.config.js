import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a real backend + PostgreSQL. Clerk is replaced by
 * e2e/support/fake-clerk.mjs (an RS256 issuer); the backend verifies its tokens
 * exactly as it verifies Clerk's. See e2e/README.md for the required setup.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_WEB_URL || 'http://localhost:5179',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
