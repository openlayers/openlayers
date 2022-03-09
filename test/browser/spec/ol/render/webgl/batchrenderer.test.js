import PointBatchRenderer from '../../../../../../src/ol/render/webgl/PointBatchRenderer.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import {create as createWebGLWorker} from '../../../../../../src/ol/worker/webgl.js';
import MixedGeometryBatch from '../../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import Feature from '../../../../../../src/ol/Feature.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import GeometryType from '../../../../../../src/ol/geom/GeometryType.js';
import {create as createTransform} from '../../../../../../src/ol/transform.js';
import {WebGLWorkerMessageType} from '../../../../../../src/ol/render/webgl/constants.js';
import LineStringBatchRenderer from '../../../../../../src/ol/render/webgl/LineStringBatchRenderer.js';
import {FLOAT} from '../../../../../../src/ol/webgl.js';
import PolygonBatchRenderer from '../../../../../../src/ol/render/webgl/PolygonBatchRenderer.js';

const POINT_VERTEX_SHADER = `precision mediump float;
void main(void) {}`;
const POINT_FRAGMENT_SHADER = `precision mediump float;
void main(void) {}`;

const SAMPLE_FRAMESTATE = {
  viewState: {
    center: [0, 10],
    resolution: 1,
    rotation: 0,
  },
  size: [10, 10],
};

describe('Batch renderers', function () {
  let batchRenderer, helper, mixedBatch, worker, attributes;

  beforeEach(function () {
    helper = new WebGLHelper();
    worker = createWebGLWorker();
    attributes = [
      {
        name: 'test',
        callback: function (feature, properties) {
          return properties.test;
        },
      },
    ];

    mixedBatch = new MixedGeometryBatch();
    mixedBatch.addFeatures([
      new Feature({
        test: 1000,
        geometry: new Point([10, 20]),
      }),
      new Feature({
        test: 2000,
        geometry: new Point([30, 40]),
      }),
      new Feature({
        test: 3000,
        geometry: new Polygon([
          [
            [10, 10],
            [20, 10],
            [30, 20],
            [20, 40],
            [10, 10],
          ],
        ]),
      }),
      new Feature({
        test: 4000,
        geometry: new LineString([
          [100, 200],
          [300, 400],
          [500, 600],
        ]),
      }),
    ]);
  });

  describe('PointBatchRenderer', function () {
    beforeEach(function () {
      batchRenderer = new PointBatchRenderer(
        helper,
        worker,
        POINT_VERTEX_SHADER,
        POINT_FRAGMENT_SHADER,
        attributes
      );
    });
    describe('constructor', function () {
      it('generates the attributes list', function () {
        expect(batchRenderer.attributes_).to.eql([
          {name: 'a_position', size: 2, type: FLOAT},
          {name: 'a_index', size: 1, type: FLOAT},
          {name: 'a_test', size: 1, type: FLOAT},
        ]);
      });
    });
    describe('#rebuild', function () {
      beforeEach(function (done) {
        sinon.spy(helper, 'flushBufferData');
        batchRenderer.rebuild(
          mixedBatch.pointBatch,
          SAMPLE_FRAMESTATE,
          GeometryType.POINT
        );
        // wait for worker response for our specific message
        worker.addEventListener('message', function (event) {
          if (
            event.data.type === WebGLWorkerMessageType.GENERATE_POINT_BUFFERS &&
            event.data.renderInstructions.byteLength > 0
          ) {
            done();
          }
        });
      });
      it('generates render instructions and updates buffers from the worker response', function () {
        expect(Array.from(mixedBatch.pointBatch.renderInstructions)).to.eql([
          2, 2, 1000, 6, 6, 2000,
        ]);
      });
      it('updates buffers', function () {
        expect(
          mixedBatch.pointBatch.verticesBuffer.getArray().length
        ).to.be.greaterThan(0);
        expect(
          mixedBatch.pointBatch.indicesBuffer.getArray().length
        ).to.be.greaterThan(0);
        expect(helper.flushBufferData.calledTwice).to.be(true);
      });
      it('updates the instructions transform', function () {
        expect(mixedBatch.pointBatch.renderInstructionsTransform).to.eql([
          0.2, 0, 0, 0.2, 0, -2,
        ]);
      });
    });
    describe('#render (from parent)', function () {
      beforeEach(function () {
        sinon.spy(helper, 'makeProjectionTransform');
        sinon.spy(helper, 'useProgram');
        sinon.spy(helper, 'bindBuffer');
        sinon.spy(helper, 'enableAttributes');
        sinon.spy(helper, 'drawElements');

        const transform = createTransform();
        batchRenderer.render(
          mixedBatch.pointBatch,
          transform,
          SAMPLE_FRAMESTATE
        );
      });
      it('computes current transform', function () {
        expect(helper.makeProjectionTransform.calledOnce).to.be(true);
      });
      it('computes sets up render parameters', function () {
        expect(helper.useProgram.calledOnce).to.be(true);
        expect(helper.enableAttributes.calledOnce).to.be(true);
        expect(helper.bindBuffer.calledTwice).to.be(true);
      });
      it('renders elements', function () {
        expect(helper.drawElements.calledOnce).to.be(true);
      });
    });
  });

  describe('LineStringBatchRenderer', function () {
    beforeEach(function () {
      batchRenderer = new LineStringBatchRenderer(
        helper,
        worker,
        POINT_VERTEX_SHADER,
        POINT_FRAGMENT_SHADER,
        attributes
      );
    });
    describe('constructor', function () {
      it('generates the attributes list', function () {
        expect(batchRenderer.attributes_).to.eql([
          {name: 'a_segmentStart', size: 2, type: FLOAT},
          {name: 'a_segmentEnd', size: 2, type: FLOAT},
          {name: 'a_parameters', size: 1, type: FLOAT},
          {name: 'a_test', size: 1, type: FLOAT},
        ]);
      });
    });
    describe('#rebuild', function () {
      beforeEach(function (done) {
        sinon.spy(helper, 'flushBufferData');
        batchRenderer.rebuild(
          mixedBatch.lineStringBatch,
          SAMPLE_FRAMESTATE,
          GeometryType.LINE_STRING
        );
        // wait for worker response for our specific message
        worker.addEventListener('message', function (event) {
          if (
            event.data.type ===
              WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS &&
            event.data.renderInstructions.byteLength > 0
          ) {
            done();
          }
        });
      });
      it('generates render instructions and updates buffers from the worker response', function () {
        expect(
          Array.from(mixedBatch.lineStringBatch.renderInstructions)
        ).to.eql([
          3000, 5, 2, 0, 4, 0, 6, 2, 4, 6, 2, 0, 4000, 3, 20, 38, 60, 78, 100,
          118,
        ]);
      });
      it('updates buffers', function () {
        expect(
          mixedBatch.lineStringBatch.verticesBuffer.getArray().length
        ).to.be.greaterThan(0);
        expect(
          mixedBatch.lineStringBatch.indicesBuffer.getArray().length
        ).to.be.greaterThan(0);
        expect(helper.flushBufferData.calledTwice).to.be(true);
      });
    });
  });

  describe('PolygonBatchRenderer', function () {
    beforeEach(function () {
      batchRenderer = new PolygonBatchRenderer(
        helper,
        worker,
        POINT_VERTEX_SHADER,
        POINT_FRAGMENT_SHADER,
        attributes
      );
    });
    describe('constructor', function () {
      it('generates the attributes list', function () {
        expect(batchRenderer.attributes_).to.eql([
          {name: 'a_position', size: 2, type: FLOAT},
          {name: 'a_test', size: 1, type: FLOAT},
        ]);
      });
    });
    describe('#rebuild', function () {
      beforeEach(function (done) {
        sinon.spy(helper, 'flushBufferData');
        batchRenderer.rebuild(
          mixedBatch.polygonBatch,
          SAMPLE_FRAMESTATE,
          GeometryType.POLYGON
        );
        // wait for worker response for our specific message
        worker.addEventListener('message', function (event) {
          if (
            event.data.type ===
              WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS &&
            event.data.renderInstructions.byteLength > 0
          ) {
            done();
          }
        });
      });
      it('generates render instructions and updates buffers from the worker response', function () {
        expect(Array.from(mixedBatch.polygonBatch.renderInstructions)).to.eql([
          3000, 1, 5, 2, 0, 4, 0, 6, 2, 4, 6, 2, 0,
        ]);
      });
      it('updates buffers', function () {
        expect(
          mixedBatch.polygonBatch.verticesBuffer.getArray().length
        ).to.be.greaterThan(0);
        expect(
          mixedBatch.polygonBatch.indicesBuffer.getArray().length
        ).to.be.greaterThan(0);
        expect(helper.flushBufferData.calledTwice).to.be(true);
      });
    });
  });
});
