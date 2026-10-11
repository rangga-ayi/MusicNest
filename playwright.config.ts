import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.TEST_PORT ?? 3031);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
  },
  webServer: process.env.TEST_SKIP_SERVER
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
