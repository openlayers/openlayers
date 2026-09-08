import fs from 'fs';
import path, {dirname} from 'path';
import {fileURLToPath} from 'url';
import {defineConfig, loadEnv} from 'vite';
import olWorker from '../../test/browser/vite-plugin-ol-worker.mjs';
import {demoTokens} from './demo-tokens.js';
import exampleBuilder from './example-builder.js';

const configDir = dirname(fileURLToPath(import.meta.url));
const examplesDir = path.join(configDir, '..');
const repoRoot = path.join(examplesDir, '..');

const exampleEntries = fs
  .readdirSync(examplesDir)
  .filter((name) => /^(?!index).*\.html$/.test(name))
  .reduce((entries, name) => {
    const key = name.replace(/\.html$/, '');
    entries[key] = path.join(examplesDir, `${key}.js`);
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

/**
 * Replace committed demo tokens during `vite serve` when `examples/.env` sets
 * the corresponding variable. Production example builds are unchanged.
 * @return {import('vite').Plugin} Plugin.
 */
function localExampleKeysPlugin() {
  /** @type {Array<[string, string]>} */
  let replacements = [];
  return {
    name: 'local-example-keys',
    apply: 'serve',
    configResolved() {
      const env = loadEnv('development', examplesDir, '');
      replacements = [];
      for (const token of demoTokens) {
        if (env[token.env]) {
          replacements.push([token.value, env[token.env]]);
        }
      }
    },
    transform(code, id) {
      if (!replacements.length) {
        return null;
      }
      const filename = id.split('?')[0];
      if (!filename.includes(`${path.sep}examples${path.sep}`)) {
        return null;
      }
      let next = code;
      let changed = false;
      for (const [demo, local] of replacements) {
        if (next.includes(demo)) {
          next = next.replaceAll(demo, local);
          changed = true;
        }
      }
      return changed ? {code: next, map: null} : null;
    },
  };
}

export default defineConfig({
  root: examplesDir,
  base: './',
  plugins: [
    olWorker(),
    exampleBuilder({
      templates: path.join(examplesDir, 'templates'),
    }),
    localExampleKeysPlugin(),
    {
      name: 'copy-assets',
      generateBundle() {
        copyDir(
          this.emitFile.bind(this),
          path.join(repoRoot, 'site', 'src', 'theme'),
          'theme',
        );
        this.emitFile({
          type: 'asset',
          fileName: path.join('theme', 'ol.css'),
          source: fs.readFileSync(path.join(repoRoot, 'src', 'ol', 'ol.css')),
        });
        copyDir(
          this.emitFile.bind(this),
          path.join(examplesDir, 'data'),
          'data',
        );
        copyDir(
          this.emitFile.bind(this),
          path.join(examplesDir, 'resources'),
          'resources',
        );
        this.emitFile({
          type: 'asset',
          fileName: 'index.html',
          source: fs.readFileSync(path.join(examplesDir, 'index.html')),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'index.js',
          source: fs.readFileSync(path.join(examplesDir, 'index.js')),
        });
      },
    },
  ],
  resolve: {
    alias: {
      ol: path.join(repoRoot, 'src', 'ol'),
    },
  },
  optimizeDeps: {
    exclude: ['ol-mapbox-style', 'ol'],
  },
  build: {
    outDir: path.join(repoRoot, 'build', 'examples'),
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
    port: 8080,
    strictPort: true,
  },
});
