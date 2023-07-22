import Feature from '../../../../../../src/ol/Feature.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import MixedGeometryBatch from '../../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import VectorStyleRenderer from '../../../../../../src/ol/render/webgl/VectorStyleRenderer.js';
import WebGLArrayBuffer from '../../../../../../src/ol/webgl/Buffer.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import {
  ARRAY_BUFFER,
  DYNAMIC_DRAW,
  ELEMENT_ARRAY_BUFFER,
  FLOAT,
} from '../../../../../../src/ol/webgl.js';
import {
  compose as composeTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../../../../../src/ol/transform.js';

const SAMPLE_VERTEX_SHADER = `
void main(void) {
  gl_Position = vec4(1.0);
}`;
const SAMPLE_FRAGMENT_SHADER = `
void main(void) {
  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}`;

/**
 * @type {import('../../../../../../src/ol/render/webgl/VectorStyleRenderer.js').StyleShaders}
 */
const SAMPLE_SHADERS = {
  fill: {
    fragment: SAMPLE_FRAGMENT_SHADER,
    vertex: SAMPLE_VERTEX_SHADER,
  },
  stroke: {
    fragment: SAMPLE_FRAGMENT_SHADER,
    vertex: SAMPLE_VERTEX_SHADER,
  },
  symbol: {
    fragment: SAMPLE_FRAGMENT_SHADER,
    vertex: SAMPLE_VERTEX_SHADER,
  },
  attributes: {
    attr1: {
      callback: (feature) => feature.get('test'),
    },
    attr2: {callback: () => [10, 20, 30], size: 3},
  },
  uniforms: {
    custom: () => 1234,
  },
};

/**
 * @type {import('../../../../../../src/ol/style/literal.js').LiteralStyle}
 */
const SAMPLE_STYLE = {
  ['fill-color']: ['get', 'color'],
  ['stroke-width']: 2,
  symbol: {
    symbolType: 'square',
    color: 'red',
    size: ['array', 4, ['get', 'size']],
  },
};

const SAMPLE_FRAMESTATE = {
  viewState: {
    center: [0, 10],
    resolution: 1,
    rotation: 0,
  },
  size: [10, 10],
};

const SAMPLE_TRANSFORM = composeTransform(
  createTransform(),
  0,
  0,
  0.5,
  0.25,
  0,
  -100,
  -200
);

describe('VectorStyleRenderer', () => {
  let geometryBatch, helper, vectorStyleRenderer;
  beforeEach(() => {
    helper = new WebGLHelper();
    geometryBatch = new MixedGeometryBatch();
    geometryBatch.addFeatures([
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
  afterEach(() => {
    helper.dispose();
  });

  describe('constructor using style', () => {
    beforeEach(() => {
      vectorStyleRenderer = new VectorStyleRenderer(SAMPLE_STYLE, helper);
    });
    it('creates a VectorStyleRenderer', () => {
      expect(vectorStyleRenderer.customAttributes_).to.eql({
        color: {
          callback: {},
          size: 2,
        },
        size: {
          callback: {},
          size: 1,
        },
      });
      expect(vectorStyleRenderer.uniforms_).to.eql({});
      expect(vectorStyleRenderer.fillProgram_).to.be.an(WebGLProgram);
      expect(vectorStyleRenderer.strokeProgram_).to.be.an(WebGLProgram);
      expect(vectorStyleRenderer.symbolProgram_).to.be.an(WebGLProgram);
      expect(vectorStyleRenderer.polygonAttributesDesc_).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_size', size: 1, type: FLOAT},
        {name: 'a_color', size: 2, type: FLOAT},
      ]);
      expect(vectorStyleRenderer.lineStringAttributesDesc_).to.eql([
        {name: 'a_segmentStart', size: 2, type: FLOAT},
        {name: 'a_segmentEnd', size: 2, type: FLOAT},
        {name: 'a_parameters', size: 1, type: FLOAT},
        {name: 'a_size', size: 1, type: FLOAT},
        {name: 'a_color', size: 2, type: FLOAT},
      ]);
      expect(vectorStyleRenderer.pointAttributesDesc_).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_index', size: 1, type: FLOAT},
        {name: 'a_size', size: 1, type: FLOAT},
        {name: 'a_color', size: 2, type: FLOAT},
      ]);
    });
  });
  describe('constructor using shaders', () => {
    beforeEach(() => {
      vectorStyleRenderer = new VectorStyleRenderer(SAMPLE_SHADERS, helper);
    });
    it('creates a VectorStyleRenderer', () => {
      expect(vectorStyleRenderer.customAttributes_).to.eql({
        attr1: {
          callback: {},
        },
        attr2: {
          callback: {},
          size: 3,
        },
      });
      expect(vectorStyleRenderer.uniforms_).to.eql({
        custom: {},
      });
      expect(vectorStyleRenderer.fillProgram_).to.be.an(WebGLProgram);
      expect(vectorStyleRenderer.strokeProgram_).to.be.an(WebGLProgram);
      expect(vectorStyleRenderer.symbolProgram_).to.be.an(WebGLProgram);
      expect(vectorStyleRenderer.polygonAttributesDesc_).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_attr1', size: 1, type: FLOAT},
        {name: 'a_attr2', size: 3, type: FLOAT},
      ]);
      expect(vectorStyleRenderer.lineStringAttributesDesc_).to.eql([
        {name: 'a_segmentStart', size: 2, type: FLOAT},
        {name: 'a_segmentEnd', size: 2, type: FLOAT},
        {name: 'a_parameters', size: 1, type: FLOAT},
        {name: 'a_attr1', size: 1, type: FLOAT},
        {name: 'a_attr2', size: 3, type: FLOAT},
      ]);
      expect(vectorStyleRenderer.pointAttributesDesc_).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_index', size: 1, type: FLOAT},
        {name: 'a_attr1', size: 1, type: FLOAT},
        {name: 'a_attr2', size: 3, type: FLOAT},
      ]);
    });
  });
  describe('methods', () => {
    beforeEach(() => {
      vectorStyleRenderer = new VectorStyleRenderer(SAMPLE_SHADERS, helper);
    });
    describe('generateBuffers', () => {
      let buffers;
      beforeEach(async () => {
        buffers = await vectorStyleRenderer.generateBuffers(
          geometryBatch,
          SAMPLE_TRANSFORM
        );
      });
      it('creates buffers for a geometry batch', () => {
        expect(buffers.invertVerticesTransform).to.eql(
          makeInverseTransform(createTransform(), SAMPLE_TRANSFORM)
        );
        expect(buffers.polygonBuffers[0]).to.be.an(WebGLArrayBuffer);
        expect(buffers.polygonBuffers[0].getType()).to.be(ELEMENT_ARRAY_BUFFER);
        expect(buffers.polygonBuffers[0].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.polygonBuffers[1]).to.be.an(WebGLArrayBuffer);
        expect(buffers.polygonBuffers[1].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.polygonBuffers[1].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.polygonBuffers[1].getArray().slice(0, 6)).to.eql([
          -45, -47.5, 3000, 10, 20, 30,
        ]);

        expect(buffers.lineStringBuffers[0]).to.be.an(WebGLArrayBuffer);
        expect(buffers.lineStringBuffers[0].getType()).to.be(
          ELEMENT_ARRAY_BUFFER
        );
        expect(buffers.lineStringBuffers[0].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.lineStringBuffers[1]).to.be.an(WebGLArrayBuffer);
        expect(buffers.lineStringBuffers[1].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.lineStringBuffers[1].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.lineStringBuffers[1].getArray().slice(0, 9)).to.eql([
          -45, -47.5, -40, -47.5, 58900000, 3000, 10, 20, 30,
        ]);

        expect(buffers.pointBuffers[0]).to.be.an(WebGLArrayBuffer);
        expect(buffers.pointBuffers[0].getType()).to.be(ELEMENT_ARRAY_BUFFER);
        expect(buffers.pointBuffers[0].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.pointBuffers[1]).to.be.an(WebGLArrayBuffer);
        expect(buffers.pointBuffers[1].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.pointBuffers[1].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.pointBuffers[1].getArray().slice(0, 7)).to.eql([
          -45, -45, 0, 1000, 10, 20, 30,
        ]);
      });
    });
    describe('render', () => {
      let buffers, preRenderCb;
      beforeEach(async () => {
        buffers = await vectorStyleRenderer.generateBuffers(
          geometryBatch,
          SAMPLE_TRANSFORM
        );
        sinon.spy(helper, 'bindBuffer');
        sinon.spy(helper, 'enableAttributes');
        sinon.spy(helper, 'useProgram');
        sinon.spy(helper, 'drawElements');
        preRenderCb = sinon.spy();
        vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
      });
      it('uses programs for all geometry types', function () {
        expect(helper.useProgram.callCount).to.be(3);
        expect(helper.useProgram.firstCall.firstArg).to.be(
          vectorStyleRenderer.fillProgram_
        );
        expect(helper.useProgram.secondCall.firstArg).to.be(
          vectorStyleRenderer.strokeProgram_
        );
        expect(helper.useProgram.thirdCall.firstArg).to.be(
          vectorStyleRenderer.symbolProgram_
        );
      });
      it('binds buffers for all geometry types', function () {
        expect(helper.bindBuffer.callCount).to.be(6);
        expect(helper.bindBuffer.calledWith(buffers.polygonBuffers[0])).to.be(
          true
        );
        expect(helper.bindBuffer.calledWith(buffers.polygonBuffers[1])).to.be(
          true
        );
        expect(
          helper.bindBuffer.calledWith(buffers.lineStringBuffers[0])
        ).to.be(true);
        expect(
          helper.bindBuffer.calledWith(buffers.lineStringBuffers[1])
        ).to.be(true);
        expect(helper.bindBuffer.calledWith(buffers.pointBuffers[0])).to.be(
          true
        );
        expect(helper.bindBuffer.calledWith(buffers.pointBuffers[1])).to.be(
          true
        );
      });
      it('enables attributes for all geometry types', function () {
        expect(helper.enableAttributes.callCount).to.be(3);
        expect(helper.enableAttributes.firstCall.firstArg).to.be(
          vectorStyleRenderer.polygonAttributesDesc_
        );
        expect(helper.enableAttributes.secondCall.firstArg).to.be(
          vectorStyleRenderer.lineStringAttributesDesc_
        );
        expect(helper.enableAttributes.thirdCall.firstArg).to.be(
          vectorStyleRenderer.pointAttributesDesc_
        );
      });
      it('calls the pre render callback once per geometry type', function () {
        expect(preRenderCb.callCount).to.be(3);
      });
      it('renders all geometry types', function () {
        expect(helper.drawElements.callCount).to.be(3);
        expect(helper.drawElements.firstCall.args).to.eql([
          0,
          buffers.polygonBuffers[0].getSize(),
        ]);
        expect(helper.drawElements.secondCall.args).to.eql([
          0,
          buffers.lineStringBuffers[0].getSize(),
        ]);
        expect(helper.drawElements.thirdCall.args).to.eql([
          0,
          buffers.pointBuffers[0].getSize(),
        ]);
      });
    });
  });
  describe('rendering only fill', () => {
    let buffers, preRenderCb;
    beforeEach(async () => {
      const fillOnlyShaders = {...SAMPLE_SHADERS};
      delete fillOnlyShaders.stroke;
      delete fillOnlyShaders.symbol;
      sinon.spy(helper, 'flushBufferData');
      sinon.spy(helper, 'enableAttributes');
      sinon.spy(helper, 'useProgram');
      sinon.spy(helper, 'drawElements');
      vectorStyleRenderer = new VectorStyleRenderer(fillOnlyShaders, helper);
      buffers = await vectorStyleRenderer.generateBuffers(
        geometryBatch,
        SAMPLE_TRANSFORM
      );
      preRenderCb = sinon.spy();
      vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
    });
    it('only loads buffer data for one geometry type', function () {
      expect(helper.flushBufferData.callCount).to.be(2);
    });
    it('only does one render', function () {
      expect(preRenderCb.callCount).to.be(1);
    });
    it('only does the polygon render pass', function () {
      expect(helper.enableAttributes.callCount).to.be(1);
      expect(helper.enableAttributes.firstCall.firstArg).to.be(
        vectorStyleRenderer.polygonAttributesDesc_
      );
      expect(helper.useProgram.callCount).to.be(1);
      expect(helper.useProgram.firstCall.firstArg).to.be(
        vectorStyleRenderer.fillProgram_
      );
      expect(helper.drawElements.callCount).to.be(1);
      expect(helper.drawElements.firstCall.args).to.eql([
        0,
        buffers.polygonBuffers[0].getSize(),
      ]);
    });
  });
  describe('rendering only stroke', () => {
    let buffers, preRenderCb;
    beforeEach(async () => {
      const strokeOnlyShaders = {...SAMPLE_SHADERS};
      delete strokeOnlyShaders.fill;
      delete strokeOnlyShaders.symbol;
      sinon.spy(helper, 'flushBufferData');
      sinon.spy(helper, 'enableAttributes');
      sinon.spy(helper, 'useProgram');
      sinon.spy(helper, 'drawElements');
      vectorStyleRenderer = new VectorStyleRenderer(strokeOnlyShaders, helper);
      buffers = await vectorStyleRenderer.generateBuffers(
        geometryBatch,
        SAMPLE_TRANSFORM
      );
      preRenderCb = sinon.spy();
      vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
    });
    it('only loads buffer data for one geometry type', function () {
      expect(helper.flushBufferData.callCount).to.be(2);
    });
    it('only does one render', function () {
      expect(preRenderCb.callCount).to.be(1);
    });
    it('only does the line string render pass', function () {
      expect(helper.enableAttributes.callCount).to.be(1);
      expect(helper.enableAttributes.firstCall.firstArg).to.be(
        vectorStyleRenderer.lineStringAttributesDesc_
      );
      expect(helper.useProgram.callCount).to.be(1);
      expect(helper.useProgram.firstCall.firstArg).to.be(
        vectorStyleRenderer.strokeProgram_
      );
      expect(helper.drawElements.callCount).to.be(1);
      expect(helper.drawElements.firstCall.args).to.eql([
        0,
        buffers.lineStringBuffers[0].getSize(),
      ]);
    });
  });
  describe('rendering only symbol', () => {
    let buffers, preRenderCb;
    beforeEach(async () => {
      const symbolOnlyShaders = {...SAMPLE_SHADERS};
      delete symbolOnlyShaders.fill;
      delete symbolOnlyShaders.stroke;
      sinon.spy(helper, 'flushBufferData');
      sinon.spy(helper, 'enableAttributes');
      sinon.spy(helper, 'useProgram');
      sinon.spy(helper, 'drawElements');
      vectorStyleRenderer = new VectorStyleRenderer(symbolOnlyShaders, helper);
      buffers = await vectorStyleRenderer.generateBuffers(
        geometryBatch,
        SAMPLE_TRANSFORM
      );
      preRenderCb = sinon.spy();
      vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
    });
    it('only loads buffer data for one geometry type', function () {
      expect(helper.flushBufferData.callCount).to.be(2);
    });
    it('only does one render', function () {
      expect(preRenderCb.callCount).to.be(1);
    });
    it('only does the point render pass', function () {
      expect(helper.enableAttributes.callCount).to.be(1);
      expect(helper.enableAttributes.firstCall.firstArg).to.be(
        vectorStyleRenderer.pointAttributesDesc_
      );
      expect(helper.useProgram.callCount).to.be(1);
      expect(helper.useProgram.firstCall.firstArg).to.be(
        vectorStyleRenderer.symbolProgram_
      );
      expect(helper.drawElements.callCount).to.be(1);
      expect(helper.drawElements.firstCall.args).to.eql([
        0,
        buffers.pointBuffers[0].getSize(),
      ]);
    });
  });
});
