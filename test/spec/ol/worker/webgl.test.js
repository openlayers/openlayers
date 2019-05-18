import {create} from '../../../../src/ol/worker/webgl.js';
import {WebGLWorkerMessageType, writePointFeatureInstructions} from '../../../../src/ol/renderer/webgl/Layer';


describe('ol/worker/webgl', function() {

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
    it('responds to GENERATE_BUFFERS message type', function(done) {
      worker.addEventListener('error', done);

      worker.addEventListener('message', function(event) {
        expect(event.data.type).to.eql(WebGLWorkerMessageType.GENERATE_BUFFERS);
        expect(event.data.renderInstructions.byteLength).to.greaterThan(0);
        expect(event.data.indexBuffer.byteLength).to.greaterThan(0);
        expect(event.data.vertexBuffer.byteLength).to.greaterThan(0);
        expect(event.data.testInt).to.be(101);
        expect(event.data.testString).to.be('abcd');
        done();
      });

      const instructions = new Float32Array(100);

      const message = {
        type: WebGLWorkerMessageType.GENERATE_BUFFERS,
        renderInstructions: instructions,
        testInt: 101,
        testString: 'abcd'
      };

      worker.postMessage(message);
    });
  });

});
