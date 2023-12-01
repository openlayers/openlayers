import {WebGLWorkerMessageType} from '../../../../../src/ol/render/webgl/constants.js';
import {create} from '../../../../../src/ol/worker/webgl.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';

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
          WebGLWorkerMessageType.GENERATE_POINT_BUFFERS
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', () => {
        const indices = Array.from(new Uint32Array(responseData.indexBuffer));
        const vertices = Array.from(
          new Float32Array(responseData.vertexBuffer)
        );
        expect(indices).to.eql([0, 1, 3, 1, 2, 3, 4, 5, 7, 5, 6, 7]);
        expect(vertices).to.eql([
          0, 10, 0, 111, 0, 10, 1, 111, 0, 10, 2, 111, 0, 10, 3, 111, 20, 30, 0,
          222, 20, 30, 1, 222, 20, 30, 2, 222, 20, 30, 3, 222,
        ]);
      });
    });

    describe('GENERATE_LINE_STRING_BUFFERS', () => {
      let responseData;
      let indices;
      let vertices;
      beforeEach((done) => {
        const renderInstructions = Float32Array.from([
          111, 4, 20, 30, 40, 50, 6, 7, 80, 90,
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
            indices = Array.from(new Uint32Array(responseData.indexBuffer));
            vertices = Array.from(new Float32Array(responseData.vertexBuffer));
            done();
          }
        });
      });
      it('responds with info passed in the message', () => {
        expect(responseData.type).to.eql(
          WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', () => {
        expect(indices).to.eql([
          0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10,
        ]);
        expect(vertices.length).to.eql(108); // 3 segments, 4 vertices each, 8 attributes each + 1 custom attr
      });
      it('computes join angles for an open line', () => {
        // join angles for first and last segments; the line is not a loop so it starts and ends with -1 angles
        expect(vertices.slice(4, 6)).to.eql([-1, 0.11635516583919525]);
        expect(vertices.slice(4 + 72, 6 + 72)).to.eql([
          0.05909299477934837, -1,
        ]);
      });
      it('computes the base length for each segment', () => {
        expect(vertices[6]).to.eql(0);
        expect(vertices[6 + 36]).to.eql(28.284271240234375);
        expect(vertices[6 + 72]).to.eql(83.1021499633789);
      });

      describe('closed line', () => {
        beforeEach((done) => {
          const renderInstructions = Float32Array.from([
            111, 4, 20, 30, 40, 50, 6, 7, 20, 30,
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
                new Float32Array(responseData.vertexBuffer)
              );
              done();
            }
          });
        });
        it('computes join angles for a closed loop', () => {
          // the sum of the first and last join angle should be 2PI
          expect(vertices.slice(4, 6)).to.eql([
            3.380202054977417, 0.11635516583919525,
          ]);
          expect(vertices.slice(4 + 72, 6 + 72)).to.eql([
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
          WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', () => {
        const indices = Array.from(new Uint32Array(responseData.indexBuffer));
        const vertices = Array.from(
          new Float32Array(responseData.vertexBuffer)
        );
        expect(indices).to.have.length(27);
        expect(vertices).to.have.length(33);
      });
    });
  });
});
