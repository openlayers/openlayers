import {create} from '../../../../src/ol/worker/version.js';
import {VERSION} from '../../../../src/ol/util.js';


describe('ol/worker/version', () => {

  let worker;
  beforeEach(() => {
    worker = create();
  });

  afterEach(() => {
    if (worker) {
      worker.terminate();
    }
    worker = null;
  });

  describe('messaging', () => {
    test('responds with the version', done => {
      worker.addEventListener('error', done);

      worker.addEventListener('message', function(event) {
        expect(event.data).toBe('version: ' + VERSION);
        done();
      });

      worker.postMessage('test message');
    });
  });

});
