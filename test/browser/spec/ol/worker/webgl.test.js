import {WebGLWorkerMessageType} from '../../../../../src/ol/render/webgl/constants.js';
import {create} from '../../../../../src/ol/worker/webgl.js';
import {create as createTransform} from '../../../../../src/ol/transform.js';

describe('ol/worker/webgl', function () {
  let worker;
  beforeEach(function () {
    worker = create();
    worker.addEventListener('error', function (error) {
      expect().fail(error.message);
    });
  });

  afterEach(function () {
    if (worker) {
      worker.terminate();
    }
    worker = null;
  });

  describe('messaging', function () {
    describe('GENERATE_POINT_BUFFERS', function () {
      let responseData;
      beforeEach(function (done) {
        const renderInstructions = Float32Array.from([0, 10, 111, 20, 30, 222]);
        const id = Math.floor(Math.random() * 10000);
        const message = {
          type: WebGLWorkerMessageType.GENERATE_POINT_BUFFERS,
          renderInstructions,
          customAttributesCount: 1,
          testInt: 101,
          testString: 'abcd',
          id,
        };
        responseData = null;
        worker.postMessage(message);

        worker.addEventListener('message', function (event) {
          if (event.data.id === id) {
            responseData = event.data;
            done();
          }
        });
      });
      it('responds with info passed in the message', function () {
        expect(responseData.type).to.eql(
          WebGLWorkerMessageType.GENERATE_POINT_BUFFERS
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', function () {
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

    describe('GENERATE_LINE_STRING_BUFFERS', function () {
      let responseData;
      beforeEach(function (done) {
        const renderInstructions = Float32Array.from([
          111, 4, 20, 30, 40, 50, 6, 7, 80, 90,
        ]);
        const id = Math.floor(Math.random() * 10000);
        const renderInstructionsTransform = createTransform();
        const message = {
          type: WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS,
          renderInstructions,
          customAttributesCount: 1,
          testInt: 101,
          testString: 'abcd',
          id,
          renderInstructionsTransform,
        };
        responseData = null;
        worker.postMessage(message);

        worker.addEventListener('message', function (event) {
          if (event.data.id === id) {
            responseData = event.data;
            done();
          }
        });
      });
      it('responds with info passed in the message', function () {
        expect(responseData.type).to.eql(
          WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', function () {
        const indices = Array.from(new Uint32Array(responseData.indexBuffer));
        const vertices = Array.from(
          new Float32Array(responseData.vertexBuffer)
        );
        expect(indices).to.eql([
          0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10,
        ]);
        expect(vertices).to.eql([
          20, 30, 40, 50, 1750000, 111, 20, 30, 40, 50, 101750000, 111, 20, 30,
          40, 50, 201750000, 111, 20, 30, 40, 50, 301750016, 111, 40, 50, 6, 7,
          93369248, 111, 40, 50, 6, 7, 193369248, 111, 40, 50, 6, 7, 293369248,
          111, 40, 50, 6, 7, 393369248, 111, 6, 7, 80, 90, 89, 111, 6, 7, 80,
          90, 100000088, 111, 6, 7, 80, 90, 200000096, 111, 6, 7, 80, 90,
          300000096, 111,
        ]);
      });
    });

    describe('GENERATE_POLYGON_BUFFERS', function () {
      let responseData;
      beforeEach(function (done) {
        const renderInstructions = Float32Array.from([
          1234, 2, 6, 5, 0, 0, 10, 0, 15, 6, 10, 12, 0, 12, 0, 0, 3, 3, 5, 1, 7,
          3, 5, 5, 3, 3,
        ]);
        const id = Math.floor(Math.random() * 10000);
        const message = {
          type: WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS,
          renderInstructions,
          customAttributesCount: 1,
          testInt: 101,
          testString: 'abcd',
          id,
        };
        responseData = null;
        worker.postMessage(message);

        worker.addEventListener('message', function (event) {
          if (event.data.id === id) {
            responseData = event.data;
            done();
          }
        });
      });
      it('responds with info passed in the message', function () {
        expect(responseData.type).to.eql(
          WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS
        );
        expect(responseData.renderInstructions.byteLength).to.greaterThan(0);
        expect(responseData.testInt).to.be(101);
        expect(responseData.testString).to.be('abcd');
      });
      it('responds with buffer data', function () {
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
