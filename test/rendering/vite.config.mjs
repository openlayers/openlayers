import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import olWorker from '../browser/vite-plugin-ol-worker.mjs';

const dir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dir,
  appType: 'custom',
  plugins: [olWorker()],
  resolve: {
    alias: {
      ol: path.join(dir, '..', '..', 'src', 'ol'),
    },
  },
  optimizeDeps: {
    exclude: ['ol-mapbox-style', 'ol'],
    entries: ['cases/*/main.js'],
  },
});
