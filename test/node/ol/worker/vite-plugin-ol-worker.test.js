import path from 'path';
import {fileURLToPath} from 'url';
import {assert} from 'chai';
import olWorker from '../../../browser/vite-plugin-ol-worker.mjs';

const workerDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../src/ol/worker',
);

describe('ol worker vite plugin', () => {
  it('watches the modules bundled into a worker', async () => {
    const plugin = olWorker();
    /** @type {Array<string>} */
    const watched = [];
    const result = await plugin.transform.call(
      {
        addWatchFile(id) {
          watched.push(id);
        },
      },
      '',
      path.join(workerDir, 'webgpuvector.js'),
    );

    assert.strictEqual(typeof result.code, 'string');
    assert.isTrue(
      watched.some((id) => id.endsWith(`${path.sep}geometryBuffers.js`)),
    );
    assert.isTrue(
      watched.some((id) => id.endsWith(`${path.sep}webgpuvector.js`)),
    );
  });
});
