import {create} from '../../../../src/ol/worker/version.js';
import {VERSION} from '../../../../src/ol/util.js';


describe('ol/worker/version', function() {

  let worker;
  beforeEach(function() {
    worker = create();
  });

  afterEach(function() {
    if (worker) {
      worker.terminate();
    }
    worker = null;
  });

  describe('messaging', function() {
    it('responds with the version', function(done) {
      worker.addEventListener('error', done);

      worker.addEventListener('message', function(event) {
        expect(event.data).to.equal('version: ' + VERSION);
        done();
      });

      worker.postMessage('test message');
    });
  });

});
