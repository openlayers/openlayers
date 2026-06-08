import {createRequire} from 'module';
import path from 'path';
import {fileURLToPath} from 'url';

const require = createRequire(import.meta.url);
const {build} = require('../../tasks/serialize-workers.cjs');

const dir = path.dirname(fileURLToPath(import.meta.url));
const workerDir = path.resolve(dir, '../../src/ol/worker');

// Vite counterpart of examples/webpack/worker-loader.cjs: serialize each
// src/ol/worker/*.js into a module that exports a working create().
export default function olWorker() {
  return {
    name: 'ol-worker-serialize',
    enforce: 'pre',
    async transform(code, id) {
      const file = id.split('?')[0];
      if (!file.startsWith(workerDir + path.sep) || !file.endsWith('.js')) {
        return null;
      }
      const chunk = await build(file, {minify: false});
      return {code: chunk.code, map: null};
    },
  };
}
