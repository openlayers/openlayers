import {assert} from 'chai';
import {WebGLWorkerMessageType} from '../../../../../src/ol/render/webgl/constants.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';
import {create} from '../../../../../src/ol/worker/webgl.js';

describe('ol/worker/webgl', () => {
  let worker;
  beforeEach(() => {
    worker = create();
    worker.addEventListener('error', (error) => {
      assert.fail();
    });
  });

  afterEach(() => {
    if (worker) {
      worker.terminate();
    }
    worker = null;
  });

  describe('messaging', () => {
    describe('GENERATE_POINT_BUFFERS', () => {
      let responseData;
      beforeEach((done) => {
        const renderInstructions = Float32Array.from([0, 10, 111, 20, 30, 222]);
        const id = Math.floor(Math.random() * 10000);
        const message = {
          type: WebGLWorkerMessageType.GENERATE_POINT_BUFFERS,
          renderInstructions,
          customAttributesSize: 1,
          testInt: 101,
          testString: 'abcd',
          id,
        };
        responseData = null;
        worker.postMessage(message);

        worker.addEventListener('message', (event) => {
          if (event.data.id === id) {
            responseData = event.data;
            done();
          }
        });
      });
      it('responds with info passed in the message', () => {
        assert.deepEqual(
          responseData.type,
          WebGLWorkerMessageType.GENERATE_POINT_BUFFERS,
        );
        assert.isAbove(responseData.renderInstructions.byteLength, 0);
        assert.strictEqual(responseData.testInt, 101);
        assert.strictEqual(responseData.testString, 'abcd');
      });
      it('responds with buffer data', () => {
        const indices = Array.from(new Uint32Array(responseData.indicesBuffer));
        const vertices = Array.from(
          new Float32Array(responseData.vertexAttributesBuffer),
        );
        const instanceAttrs = Array.from(
          new Float32Array(responseData.instanceAttributesBuffer),
        );
        assert.deepEqual(indices, [0, 1, 3, 1, 2, 3]);
        assert.deepEqual(vertices, [-1, -1, 1, -1, 1, 1, -1, 1]);
        assert.deepEqual(instanceAttrs, [0, 10, 111, 20, 30, 222]);
      });
    });

    describe('GENERATE_LINE_STRING_BUFFERS', () => {
      let responseData;
      let indices;
      let vertices;
      let instanceAttrs;
      beforeEach((done) => {
        const renderInstructions = Float32Array.from([
          111, 4, 20, 30, -1, 40, 50, -2, 6, 7, -3, 80, 90, -4,
        ]);
        const id = Math.floor(Math.random() * 10000);
        const renderInstructionsTransform = createTransform();
        const message = {
          type: WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS,
          renderInstructions,
          customAttributesSize: 1,
          testInt: 101,
          testString: 'abcd',
          id,
          renderInstructionsTransform,
        };
        responseData = null;
        worker.postMessage(message);

        worker.addEventListener('message', (event) => {
          if (event.data.id === id) {
            responseData = event.data;
            indices = Array.from(new Uint32Array(responseData.indicesBuffer));
            vertices = Array.from(
              new Float32Array(responseData.vertexAttributesBuffer),
            );
            instanceAttrs = Array.from(
              new Float32Array(responseData.instanceAttributesBuffer),
            );
            done();
          }
        });
      });
      it('responds with info passed in the message', () => {
        assert.deepEqual(
          responseData.type,
          WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS,
        );
        assert.isAbove(responseData.renderInstructions.byteLength, 0);
        assert.strictEqual(responseData.testInt, 101);
        assert.strictEqual(responseData.testString, 'abcd');
      });
      it('responds with buffer data', () => {
        assert.deepEqual(indices, [0, 1, 3, 1, 2, 3]);
        assert.deepEqual(vertices, [-1, -1, 1, -1, 1, 1, -1, 1]);
        assert.deepEqual(instanceAttrs.length, 36);
      });
      it('computes join angles for an open line', () => {
        assert.deepEqual(instanceAttrs.slice(6, 8), [-1, 0.11635516583919525]);
        assert.deepEqual(
          instanceAttrs.slice(6 + 24, 8 + 24),
          [0.05909299477934837, -1],
        );
      });
      it('computes the base length for each segment', () => {
        assert.deepEqual(instanceAttrs[8], 0);
        assert.deepEqual(instanceAttrs[8 + 12], 28.284271240234375);
        assert.deepEqual(instanceAttrs[8 + 24], 83.1021499633789);
      });

      describe('closed line', () => {
        beforeEach((done) => {
          const renderInstructions = Float32Array.from([
            111, 4, 20, 30, -1, 40, 50, -2, 6, 7, -3, 20, 30, -4,
          ]);
          const id = Math.floor(Math.random() * 10000);
          const renderInstructionsTransform = createTransform();
          const message = {
            type: WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS,
            renderInstructions,
            customAttributesSize: 1,
            testInt: 101,
            testString: 'abcd',
            id,
            renderInstructionsTransform,
          };
          responseData = null;
          worker.postMessage(message);

          worker.addEventListener('message', (event) => {
            if (event.data.id === id) {
              responseData = event.data;
              vertices = Array.from(
                new Float32Array(responseData.vertexAttributesBuffer),
              );
              instanceAttrs = Array.from(
                new Float32Array(responseData.instanceAttributesBuffer),
              );
              done();
            }
          });
        });
        it('computes join angles for a closed loop', () => {
          assert.deepEqual(
            instanceAttrs.slice(6, 8),
            [3.380202054977417, 0.11635516583919525],
          );
          assert.deepEqual(
            instanceAttrs.slice(6 + 24, 8 + 24),
            [6.16093111038208, 2.9029834270477295],
          );
        });
      });
    });

    describe('GENERATE_POLYGON_BUFFERS', () => {
      let responseData;
      beforeEach((done) => {
        const renderInstructions = Float32Array.from([
          1234, 2, 6, 5, 0, 0, 10, 0, 15, 6, 10, 12, 0, 12, 0, 0, 3, 3, 5, 1, 7,
          3, 5, 5, 3, 3,
        ]);
        const id = Math.floor(Math.random() * 10000);
        const message = {
          type: WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS,
          renderInstructions,
          customAttributesSize: 1,
          testInt: 101,
          testString: 'abcd',
          id,
        };
        responseData = null;
        worker.postMessage(message);

        worker.addEventListener('message', (event) => {
          if (event.data.id === id) {
            responseData = event.data;
            done();
          }
        });
      });
      it('responds with info passed in the message', () => {
        assert.deepEqual(
          responseData.type,
          WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS,
        );
        assert.isAbove(responseData.renderInstructions.byteLength, 0);
        assert.strictEqual(responseData.testInt, 101);
        assert.strictEqual(responseData.testString, 'abcd');
      });
      it('responds with buffer data', () => {
        const indices = Array.from(new Uint32Array(responseData.indicesBuffer));
        const vertices = Array.from(
          new Float32Array(responseData.vertexAttributesBuffer),
        );
        const instanceAttrs = Array.from(
          new Float32Array(responseData.instanceAttributesBuffer),
        );
        assert.lengthOf(indices, 27);
        assert.lengthOf(vertices, 33);
        assert.deepEqual(instanceAttrs, []);
      });
    });
  });
});
