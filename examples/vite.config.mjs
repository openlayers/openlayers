import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import {defineConfig} from 'vite';
import olWorker from '../test/browser/vite-plugin-ol-worker.mjs';
import exampleBuilder from './vite-plugin-example-builder.mjs';

const dir = dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');

const exampleEntries = fs
  .readdirSync(dir)
  .filter((name) => /^(?!index).*\.html$/.test(name))
  .reduce((entries, name) => {
    const key = name.replace(/\.html$/, '');
    entries[key] = path.join(dir, `${key}.js`);
    return entries;
  }, {});

function copyDir(emitFile, from, to) {
  if (!fs.existsSync(from)) {
    return;
  }
  for (const file of fs.readdirSync(from, {recursive: true})) {
    const fromPath = path.join(from, file);
    if (fs.statSync(fromPath).isFile()) {
      emitFile({
        type: 'asset',
        fileName: path.join(to, file),
        source: fs.readFileSync(fromPath),
      });
    }
  }
}

export default defineConfig({
  root: dir,
  plugins: [
    olWorker(),
    exampleBuilder({
      templates: path.join(dir, 'templates'),
    }),
    {
      name: 'copy-assets',
      generateBundle() {
        copyDir(
          this.emitFile.bind(this),
          path.join(root, 'site', 'src', 'theme'),
          'theme',
        );
        this.emitFile({
          type: 'asset',
          fileName: path.join('theme', 'ol.css'),
          source: fs.readFileSync(path.join(root, 'src', 'ol', 'ol.css')),
        });
        copyDir(this.emitFile.bind(this), path.join(dir, 'data'), 'data');
        copyDir(
          this.emitFile.bind(this),
          path.join(dir, 'resources'),
          'resources',
        );
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: fs.readFileSync(path.join(dir, 'index.html')),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'index.js',
          source: fs.readFileSync(path.join(dir, 'index.js')),
        });
      },
    },
  ],
  resolve: {
    alias: {
      ol: path.join(root, 'src', 'ol'),
    },
  },
  optimizeDeps: {
    exclude: ['ol-mapbox-style', 'ol'],
  },
  build: {
    outDir: path.join(root, 'build', 'examples'),
    emptyOutDir: true,
    sourcemap: true,
    // Do not minify examples that inject code into workers via Function#toString
    minify: false,
    rollupOptions: {
      input: exampleEntries,
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        manualChunks(id) {
          if (
            id.includes('node_modules') ||
            id.includes(`${path.sep}src${path.sep}ol${path.sep}`)
          ) {
            return 'common';
          }
        },
      },
    },
  },
  server: {
    port: 3001,
  },
});
