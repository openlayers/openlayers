import {create} from '../../../../src/ol/worker/webgl.js';
import {
  POINT_INSTRUCTIONS_COUNT,
  WebGLWorkerMessageType
} from '../../../../src/ol/renderer/webgl/Layer.js';


describe('ol/worker/webgl', () => {

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
    describe('GENERATE_BUFFERS', () => {
      test('responds with buffer data', done => {
        worker.addEventListener('error', done);

        worker.addEventListener('message', function(event) {
          expect(event.data.type).toEqual(WebGLWorkerMessageType.GENERATE_BUFFERS);
          expect(event.data.renderInstructions.byteLength).toBeGreaterThan(0);
          expect(event.data.indexBuffer.byteLength).toBeGreaterThan(0);
          expect(event.data.vertexBuffer.byteLength).toBeGreaterThan(0);
          expect(event.data.testInt).toBe(101);
          expect(event.data.testString).toBe('abcd');
          done();
        });

        const instructions = new Float32Array(POINT_INSTRUCTIONS_COUNT);

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

});
