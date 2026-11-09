import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['tests/browser/*.spec.ts'],
  fullyParallel: false, workers: 1, timeout: 240000,
  use: {
    baseURL: 'http://localhost:5274', headless: true, actionTimeout: 10000,
    reducedMotion: 'reduce', viewport: { width: 1920, height: 1080 },
  },
  webServer: {
    command: 'node node_modules/vite/bin/vite.js preview --outDir .preview-dist --host localhost --port 5274 --strictPort',
    url: 'http://localhost:5274', reuseExistingServer: false, timeout: 30000,
  },
  reporter: 'list',
});
