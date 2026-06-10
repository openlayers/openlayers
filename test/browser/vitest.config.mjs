import {playwright} from '@vitest/browser-playwright';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vitest/config';
import olFixtures from './vite-plugin-ol-fixtures.mjs';
import olWorker from './vite-plugin-ol-worker.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));

// Runs a few representative specs while the migration off Karma is in progress.
export default defineConfig({
  plugins: [olWorker(), olFixtures()],
  test: {
    include: [
      'test/browser/spec/ol/resolutionconstraint.test.js',
      'test/browser/spec/ol/tileurlfunction.test.js',
      'test/browser/spec/ol/worker/webgl.test.js',
      'test/browser/spec/ol/featureloader.test.js',
      'test/browser/spec/ol/Map.test.js',
      'test/browser/spec/ol/format/wmtscapabilities.test.js',
      'test/browser/spec/ol/layer/Heatmap.test.js',
    ],
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
