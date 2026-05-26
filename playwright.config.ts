import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    // ローカルの .env.local に本番用の合言葉ハッシュが入っていると LockGate が
    // 全画面を覆い E2E が進めない。Next.js は process.env を .env.local より
    // 優先するため、ここで空文字を渡してテスト中だけ認証をスキップさせる
    // （isAuthConfigured() が false になる）。本番は GitHub Actions が実 env を渡す。
    env: {
      NEXT_PUBLIC_AUTH_HASH: '',
      NEXT_PUBLIC_AUTH_SALT: '',
    },
  },
});
