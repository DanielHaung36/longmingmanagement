import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  timeout: 40000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/report', open: 'never' }],
  ],

  use: {
    baseURL: 'https://clientlongi.easytool.page',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    headless: true,
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
