import {playwright} from '@vitest/browser-playwright';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vitest/config';
import olFixtures from './vite-plugin-ol-fixtures.mjs';
import olWorker from './vite-plugin-ol-worker.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

// Browser unit tests, run with Vitest (formerly Karma).
export default defineConfig({
  plugins: [olWorker(), olFixtures()],
  test: {
    include: ['test/browser/spec/**/*.test.js'],
    globals: true,
    setupFiles: [path.resolve(dir, 'vitest.setup.js')],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{browser: 'chromium'}],
    },
  },
});
