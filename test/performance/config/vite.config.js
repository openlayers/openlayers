import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import olWorker from '../../browser/vite-plugin-ol-worker.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(dir, '../..');
const dataRoot = path.join(dir, 'data', 'versatiles');

/**
 * Serve the offline dataset as files. Vite otherwise parses extensionless
 * tiles as JavaScript and rejects them.
 * @return {import('vite').Plugin} Plugin.
 */
function versatilesData() {
  return {
    name: 'versatiles-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split('?')[0];
        if (!pathname?.startsWith('/data/versatiles/')) {
          next();
          return;
        }
        const relative = decodeURIComponent(
          pathname.slice('/data/versatiles/'.length),
        );
        const file = path.resolve(dataRoot, relative);
        if (file !== dataRoot && !file.startsWith(dataRoot + path.sep)) {
          next();
          return;
        }
        fs.stat(file, (error, stat) => {
          if (error || !stat.isFile()) {
            next();
            return;
          }
          const type = versatilesContentType(file);
          if (type) {
            res.setHeader('Content-Type', type);
          }
          fs.createReadStream(file).pipe(res);
        });
      });
    },
  };
}

/**
 * @param {string} file Absolute path.
 * @return {string|undefined} Content type.
 */
function versatilesContentType(file) {
  if (file.endsWith('.json')) {
    return 'application/json';
  }
  if (file.endsWith('.css')) {
    return 'text/css';
  }
  if (file.endsWith('.png')) {
    return 'image/png';
  }
  if (file.endsWith('.woff2')) {
    return 'font/woff2';
  }
  if (file.includes(`${path.sep}tiles${path.sep}`)) {
    return 'application/vnd.mapbox-vector-tile';
  }
  return undefined;
}

export default defineConfig({
  root: dir,
  plugins: [versatilesData(), olWorker()],
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
