import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/inventory/tests',
  timeout: 60000,
  expect: { timeout: 12000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/inventory/report', open: 'never' }],
  ],

  use: {
    baseURL: 'https://inventory.easytool.page',
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
