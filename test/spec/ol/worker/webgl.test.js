import {create} from '../../../../src/ol/worker/webgl.js';
import {
  WebGLWorkerMessageType
} from '../../../../src/ol/renderer/webgl/Layer.js';


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
    describe('GENERATE_BUFFERS', function() {
      it('responds with buffer data', function(done) {
        worker.addEventListener('error', function(error) {
          expect().fail(error.message);
        });

        worker.addEventListener('message', function(event) {
          expect(event.data.type).to.eql(WebGLWorkerMessageType.GENERATE_BUFFERS);
          expect(event.data.renderInstructions.byteLength).to.greaterThan(0);
          expect(event.data.indexBuffer.byteLength).to.greaterThan(0);
          expect(event.data.vertexBuffer.byteLength).to.greaterThan(0);
          expect(event.data.testInt).to.be(101);
          expect(event.data.testString).to.be('abcd');
          done();
        });

        const instructions = new Float32Array(10);

        const message = {
          type: WebGLWorkerMessageType.GENERATE_BUFFERS,
          renderInstructions: instructions,
          customAttributesCount: 0,
          testInt: 101,
          testString: 'abcd'
        };

        worker.postMessage(message);
      });
    });
  });

});
