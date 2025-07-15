import {WebGLWorkerMessageType} from '../../../../../src/ol/render/webgl/constants.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';
import {create} from '../../../../../src/ol/worker/webgl.js';

describe('ol/worker/webgl', () => {
  let worker;
  beforeEach(() => {
    worker = create();
    worker.addEventListener('error', (error) => {
      expect().fail(error.message);
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
        expect(responseData.type).to.eql(
          WebGLWorkerMessageType.GENERATE_POINT_BUFFERS,
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', () => {
        const indices = Array.from(new Uint32Array(responseData.indicesBuffer));
        const vertices = Array.from(
          new Float32Array(responseData.vertexAttributesBuffer),
        );
        const instanceAttrs = Array.from(
          new Float32Array(responseData.instanceAttributesBuffer),
        );
        expect(indices).to.eql([0, 1, 3, 1, 2, 3]);
        expect(vertices).to.eql([-1, -1, 1, -1, 1, 1, -1, 1]);
        expect(instanceAttrs).to.eql([0, 10, 111, 20, 30, 222]);
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
        expect(responseData.type).to.eql(
          WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS,
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', () => {
        expect(indices).to.eql([0, 1, 3, 1, 2, 3]);
        expect(vertices).to.eql([-1, -1, 1, -1, 1, 1, -1, 1]);
        expect(instanceAttrs.length).to.eql(36); // 3 segments, 11 attributes each + 1 custom attr
      });
      it('computes join angles for an open line', () => {
        // join angles for first and last segments; the line is not a loop so it starts and ends with -1 angles
        expect(instanceAttrs.slice(6, 8)).to.eql([-1, 0.11635516583919525]);
        expect(instanceAttrs.slice(6 + 24, 8 + 24)).to.eql([
          0.05909299477934837, -1,
        ]);
      });
      it('computes the base length for each segment', () => {
        expect(instanceAttrs[8]).to.eql(0);
        expect(instanceAttrs[8 + 12]).to.eql(28.284271240234375);
        expect(instanceAttrs[8 + 24]).to.eql(83.1021499633789);
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
          // the sum of the first and last join angle should be 2PI
          expect(instanceAttrs.slice(6, 8)).to.eql([
            3.380202054977417, 0.11635516583919525,
          ]);
          expect(instanceAttrs.slice(6 + 24, 8 + 24)).to.eql([
            6.16093111038208, 2.9029834270477295,
          ]);
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
        expect(responseData.type).to.eql(
          WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS,
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', () => {
        const indices = Array.from(new Uint32Array(responseData.indicesBuffer));
        const vertices = Array.from(
          new Float32Array(responseData.vertexAttributesBuffer),
        );
        const instanceAttrs = Array.from(
          new Float32Array(responseData.instanceAttributesBuffer),
        );
        expect(indices).to.have.length(27);
        expect(vertices).to.have.length(33);
        expect(instanceAttrs).to.eql([]); // no instance attributes for polygons
      });
    });
  });
});
