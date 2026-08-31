import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import olWorker from '../browser/vite-plugin-ol-worker.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dir, '../..');

export default defineConfig({
  root: dir,
  plugins: [olWorker()],
  resolve: {
    alias: {
      ol: path.join(repoRoot, 'src', 'ol'),
    },
  },
  optimizeDeps: {
    exclude: ['ol'],
  },
  server: {
    host: '127.0.0.1',
    port: 8123,
    strictPort: false,
  },
});
