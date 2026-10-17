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
    provide: {
      // WebGPU tests skip without an adapter. Where they are expected to run,
      // a missing or software adapter has to fail instead.
      requireWebGPU: !!process.env.REQUIRE_WEBGPU,
    },
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          // The default headless shell only has a software WebGPU adapter,
          // which cannot present WebGPU canvases. Full Chromium in new
          // headless mode uses the GPU.
          channel: 'chromium',
        },
      }),
      headless: true,
      instances: [{browser: 'chromium'}],
    },
  },
});
