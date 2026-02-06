import {spy as sinonSpy} from 'sinon';
import Feature from '../../../../../../src/ol/Feature.js';
import {stringToGlsl} from '../../../../../../src/ol/expr/gpu.js';
import LineString from '../../../../../../src/ol/geom/LineString.js';
import Point from '../../../../../../src/ol/geom/Point.js';
import Polygon from '../../../../../../src/ol/geom/Polygon.js';
import MixedGeometryBatch from '../../../../../../src/ol/render/webgl/MixedGeometryBatch.js';
import {ShaderBuilder} from '../../../../../../src/ol/render/webgl/ShaderBuilder.js';
import VectorStyleRenderer, {
  convertStyleToShaders,
} from '../../../../../../src/ol/render/webgl/VectorStyleRenderer.js';
import {
  compose as composeTransform,
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../../../../../src/ol/transform.js';
import WebGLArrayBuffer from '../../../../../../src/ol/webgl/Buffer.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import {
  ARRAY_BUFFER,
  DYNAMIC_DRAW,
  ELEMENT_ARRAY_BUFFER,
  FLOAT,
} from '../../../../../../src/ol/webgl.js';

/**
 * @type {import('../../../../../../src/ol/render/webgl/VectorStyleRenderer.js').StyleShaders}
 */
const SAMPLE_SHADERS = () => ({
  builder: new ShaderBuilder()
    .setFillColorExpression('vec4(1.0)')
    .setStrokeColorExpression('vec4(1.0)')
    .setSymbolColorExpression('vec4(1.0)'),
  attributes: {
    prop_attr1: {
      callback: (feature) => feature.get('test'),
    },
    prop_attr2: {callback: () => [10, 20, 30], size: 3},
  },
  uniforms: {
    custom: () => 1234,
  },
});

/**
 * @type {Array<import('../../../../../../src/ol/style/flat.js').Rule>}
 */
const SAMPLE_STYLE_RULES = [
  {
    style: {
      'fill-color': ['get', 'color'],
      'stroke-width': 2,
      'circle-radius': ['get', 'size'],
      'circle-fill-color': 'red',
    },
    filter: ['>', ['get', 'size'], 10],
  },
  {
    style: {
      'fill-color': 'white',
    },
    filter: ['==', ['get', 'id'], ['var', 'highlightedId']],
  },
];

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
  -200,
);

describe('VectorStyleRenderer', () => {
  let geometryBatch, helper, vectorStyleRenderer;
  beforeEach(() => {
    helper = new WebGLHelper();
    geometryBatch = new MixedGeometryBatch();
    geometryBatch.addFeatures([
      new Feature({
        id: 1,
        size: 1000,
        color: 'red',
        geometry: new Point([10, 20]),
      }),
      new Feature({
        id: 2,
        size: 2000,
        color: 'blue',
        geometry: new Point([30, 40]),
      }),
      new Feature({
        id: 3,
        size: 3000,
        color: 'green',
        geometry: new Polygon([
          [
            [10, 10],
            [20, 10],
            [20, 20],
            [10, 40],
            [10, 10],
          ],
        ]),
      }),
      new Feature({
        id: 4,
        size: 4000,
        color: 'yellow',
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

  describe('constructor using style rules', () => {
    beforeEach(() => {
      vectorStyleRenderer = new VectorStyleRenderer(
        SAMPLE_STYLE_RULES,
        {},
        helper,
      );
    });
    it('creates a VectorStyleRenderer with two render passes and all attributes and uniforms combined', () => {
      expect(vectorStyleRenderer.customAttributes_).to.eql({
        prop_color: {
          callback: {},
          size: 2,
        },
        prop_size: {
          callback: {},
          size: 1,
        },
        prop_id: {
          callback: {},
          size: 1,
        },
      });
      expect(vectorStyleRenderer.uniforms_).to.eql({u_var_highlightedId: {}});
      expect(vectorStyleRenderer.renderPasses_).to.have.length(2);
    });
    it('initializes two render passes with the proper attributes', () => {
      const firstPass = vectorStyleRenderer.renderPasses_[0];
      expect(firstPass.fillRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.fillRenderPass.attributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT}, // this is padding for the `id` attribute
      ]);
      expect(firstPass.strokeRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.strokeRenderPass.attributesDesc).to.eql([
        {name: 'a_localPosition', size: 2, type: 5126},
      ]);
      expect(firstPass.strokeRenderPass.instancedAttributesDesc).to.eql([
        {name: 'a_segmentStart', size: 2, type: FLOAT},
        {name: 'a_measureStart', size: 1, type: FLOAT},
        {name: 'a_segmentEnd', size: 2, type: FLOAT},
        {name: 'a_measureEnd', size: 1, type: FLOAT},
        {name: 'a_joinAngles', size: 2, type: FLOAT},
        {name: 'a_distanceLow', size: 1, type: FLOAT},
        {name: 'a_distanceHigh', size: 1, type: FLOAT},
        {name: 'a_angleTangentSum', size: 1, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
      ]);
      expect(firstPass.symbolRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.symbolRenderPass.attributesDesc).to.eql([
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      expect(firstPass.symbolRenderPass.instancedAttributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
      ]);

      const secondPass = vectorStyleRenderer.renderPasses_[1];
      expect(secondPass.fillRenderPass.program).to.be.an(WebGLProgram);
      expect(secondPass.fillRenderPass.attributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
        {name: null, size: 2, type: FLOAT},
        {name: 'a_prop_id', size: 1, type: FLOAT},
      ]);
      expect(secondPass.strokeRenderPass).to.be(undefined);
      expect(secondPass.symbolRenderPass).to.be(undefined);
    });
  });
  describe('constructor using style rules & hit detection enabled', () => {
    beforeEach(() => {
      vectorStyleRenderer = new VectorStyleRenderer(
        SAMPLE_STYLE_RULES,
        {},
        helper,
        true,
      );
    });
    it('creates a VectorStyleRenderer with two render passes and all attributes and uniforms combined', () => {
      expect(vectorStyleRenderer.customAttributes_).to.eql({
        hitColor: {
          callback: {},
          size: 2,
        },
        prop_color: {
          callback: {},
          size: 2,
        },
        prop_size: {
          callback: {},
          size: 1,
        },
        prop_id: {
          callback: {},
          size: 1,
        },
      });
      expect(vectorStyleRenderer.uniforms_).to.eql({u_var_highlightedId: {}});
      expect(vectorStyleRenderer.renderPasses_).to.have.length(2);
    });
    it('initializes two render passes with the proper attributes', () => {
      const firstPass = vectorStyleRenderer.renderPasses_[0];
      expect(firstPass.fillRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.fillRenderPass.attributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_hitColor', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT}, // this is padding for the `id` attribute
      ]);
      expect(firstPass.strokeRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.strokeRenderPass.attributesDesc).to.eql([
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      expect(firstPass.strokeRenderPass.instancedAttributesDesc).to.eql([
        {name: 'a_segmentStart', size: 2, type: FLOAT},
        {name: 'a_measureStart', size: 1, type: FLOAT},
        {name: 'a_segmentEnd', size: 2, type: FLOAT},
        {name: 'a_measureEnd', size: 1, type: FLOAT},
        {name: 'a_joinAngles', size: 2, type: FLOAT},
        {name: 'a_distanceLow', size: 1, type: FLOAT},
        {name: 'a_distanceHigh', size: 1, type: FLOAT},
        {name: 'a_angleTangentSum', size: 1, type: FLOAT},
        {name: 'a_hitColor', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
      ]);
      expect(firstPass.symbolRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.symbolRenderPass.attributesDesc).to.eql([
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      expect(firstPass.symbolRenderPass.instancedAttributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_hitColor', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
      ]);

      const secondPass = vectorStyleRenderer.renderPasses_[1];
      expect(secondPass.fillRenderPass.program).to.be.an(WebGLProgram);
      expect(secondPass.fillRenderPass.attributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_hitColor', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
        {name: null, size: 2, type: FLOAT},
        {name: 'a_prop_id', size: 1, type: FLOAT},
      ]);
      expect(secondPass.strokeRenderPass).to.be(undefined);
      expect(secondPass.symbolRenderPass).to.be(undefined);
    });
  });
  describe('constructor using shaders', () => {
    beforeEach(() => {
      vectorStyleRenderer = new VectorStyleRenderer(
        SAMPLE_SHADERS(),
        {},
        helper,
      );
    });
    it('creates a VectorStyleRenderer with a single render pass', () => {
      expect(vectorStyleRenderer.customAttributes_).to.eql({
        prop_attr1: {
          callback: {},
        },
        prop_attr2: {
          callback: {},
          size: 3,
        },
      });
      expect(vectorStyleRenderer.uniforms_).to.eql({
        custom: {},
      });

      expect(vectorStyleRenderer.renderPasses_).to.have.length(1);
      const firstPass = vectorStyleRenderer.renderPasses_[0];
      expect(firstPass.fillRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.fillRenderPass.attributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_prop_attr1', size: 1, type: FLOAT},
        {name: 'a_prop_attr2', size: 3, type: FLOAT},
      ]);
      expect(firstPass.strokeRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.strokeRenderPass.attributesDesc).to.eql([
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      expect(firstPass.strokeRenderPass.instancedAttributesDesc).to.eql([
        {name: 'a_segmentStart', size: 2, type: FLOAT},
        {name: 'a_measureStart', size: 1, type: FLOAT},
        {name: 'a_segmentEnd', size: 2, type: FLOAT},
        {name: 'a_measureEnd', size: 1, type: FLOAT},
        {name: 'a_joinAngles', size: 2, type: FLOAT},
        {name: 'a_distanceLow', size: 1, type: FLOAT},
        {name: 'a_distanceHigh', size: 1, type: FLOAT},
        {name: 'a_angleTangentSum', size: 1, type: FLOAT},
        {name: 'a_prop_attr1', size: 1, type: FLOAT},
        {name: 'a_prop_attr2', size: 3, type: FLOAT},
      ]);
      expect(firstPass.symbolRenderPass.program).to.be.an(WebGLProgram);
      expect(firstPass.symbolRenderPass.attributesDesc).to.eql([
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      expect(firstPass.symbolRenderPass.instancedAttributesDesc).to.eql([
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_prop_attr1', size: 1, type: FLOAT},
        {name: 'a_prop_attr2', size: 3, type: FLOAT},
      ]);
    });
  });
  describe('methods', () => {
    beforeEach(() => {
      vectorStyleRenderer = new VectorStyleRenderer(
        SAMPLE_STYLE_RULES,
        {},
        helper,
      );
    });
    describe('generateBuffers', () => {
      let buffers;
      beforeEach(async () => {
        buffers = await vectorStyleRenderer.generateBuffers(
          geometryBatch,
          SAMPLE_TRANSFORM,
        );
      });
      it('creates buffers for a geometry batch', () => {
        expect(buffers.invertVerticesTransform).to.eql(
          makeInverseTransform(createTransform(), SAMPLE_TRANSFORM),
        );
        expect(buffers.polygonBuffers[0]).to.be.an(WebGLArrayBuffer);
        expect(buffers.polygonBuffers[0].getType()).to.be(ELEMENT_ARRAY_BUFFER);
        expect(buffers.polygonBuffers[0].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.polygonBuffers[1]).to.be.an(WebGLArrayBuffer);
        expect(buffers.polygonBuffers[1].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.polygonBuffers[1].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.polygonBuffers[1].getArray().slice(0, 6)).to.eql([
          -45, -47.5, 3000, 128, 255, 3,
        ]);

        expect(buffers.lineStringBuffers[0]).to.be.an(WebGLArrayBuffer);
        expect(buffers.lineStringBuffers[0].getType()).to.be(
          ELEMENT_ARRAY_BUFFER,
        );
        expect(buffers.lineStringBuffers[0].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.lineStringBuffers[1]).to.be.an(WebGLArrayBuffer);
        expect(buffers.lineStringBuffers[1].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.lineStringBuffers[1].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.lineStringBuffers[1].getArray().slice(0, 8)).to.eql([
          -1, -1, 1, -1, 1, 1, -1, 1,
        ]);
        expect(buffers.lineStringBuffers[2]).to.be.an(WebGLArrayBuffer);
        expect(buffers.lineStringBuffers[2].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.lineStringBuffers[2].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.lineStringBuffers[2].getArray().slice(0, 15)).to.eql([
          -45, -47.5, 0, -40, -47.5, 0, 1.5707963705062866, 4.71238899230957, 0,
          0, 0, 3000, 128, 255, 3,
        ]);

        expect(buffers.pointBuffers[0]).to.be.an(WebGLArrayBuffer);
        expect(buffers.pointBuffers[0].getType()).to.be(ELEMENT_ARRAY_BUFFER);
        expect(buffers.pointBuffers[0].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.pointBuffers[1]).to.be.an(WebGLArrayBuffer);
        expect(buffers.pointBuffers[1].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.pointBuffers[1].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.pointBuffers[1].getArray().slice(0, 8)).to.eql([
          -1, -1, 1, -1, 1, 1, -1, 1,
        ]);
        expect(buffers.pointBuffers[2]).to.be.an(WebGLArrayBuffer);
        expect(buffers.pointBuffers[2].getType()).to.be(ARRAY_BUFFER);
        expect(buffers.pointBuffers[2].getUsage()).to.be(DYNAMIC_DRAW);
        expect(buffers.pointBuffers[2].getArray().slice(0, 6)).to.eql([
          -45, -45, 1000, 65280, 255, 1,
        ]);
      });
    });
    describe('render', () => {
      let buffers, preRenderCb;
      beforeEach(async () => {
        buffers = await vectorStyleRenderer.generateBuffers(
          geometryBatch,
          SAMPLE_TRANSFORM,
        );
        sinonSpy(helper, 'bindBuffer');
        sinonSpy(helper, 'enableAttributes');
        sinonSpy(helper, 'enableAttributesInstanced');
        sinonSpy(helper, 'useProgram');
        sinonSpy(helper, 'drawElements');
        sinonSpy(helper, 'drawElementsInstanced');
        preRenderCb = sinonSpy();
        vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
      });
      it('uses programs for all render passes & geometry types', function () {
        expect(helper.useProgram.callCount).to.be(4);
        const firstPass = vectorStyleRenderer.renderPasses_[0];
        const secondPass = vectorStyleRenderer.renderPasses_[1];
        expect(helper.useProgram.getCall(0).firstArg).to.be(
          firstPass.fillRenderPass.program,
        );
        expect(helper.useProgram.getCall(1).firstArg).to.be(
          firstPass.strokeRenderPass.program,
        );
        expect(helper.useProgram.getCall(2).firstArg).to.be(
          firstPass.symbolRenderPass.program,
        );
        expect(helper.useProgram.getCall(3).firstArg).to.be(
          secondPass.fillRenderPass.program,
        );
      });
      it('binds buffers for all render passes & geometry types', function () {
        expect(helper.bindBuffer.callCount).to.be(12);
        const args = helper.bindBuffer.getCalls().map((call) => call.firstArg);

        // first pass
        expect(args[0]).to.equal(buffers.polygonBuffers[1]);
        expect(args[1]).to.equal(buffers.polygonBuffers[0]);
        expect(args[2]).to.equal(buffers.polygonBuffers[2]);
        expect(args[3]).to.equal(buffers.lineStringBuffers[1]);
        expect(args[4]).to.equal(buffers.lineStringBuffers[0]);
        expect(args[5]).to.equal(buffers.lineStringBuffers[2]);
        // second pass
        expect(args[6]).to.equal(buffers.pointBuffers[1]);
        expect(args[7]).to.equal(buffers.pointBuffers[0]);
        expect(args[8]).to.equal(buffers.pointBuffers[2]);
        expect(args[9]).to.equal(buffers.polygonBuffers[1]);
        expect(args[10]).to.equal(buffers.polygonBuffers[0]);
        expect(args[11]).to.equal(buffers.polygonBuffers[2]);
      });
      it('enables attributes for all render passes & geometry types', function () {
        expect(helper.enableAttributes.callCount).to.be(4);
        const firstPass = vectorStyleRenderer.renderPasses_[0];
        const secondPass = vectorStyleRenderer.renderPasses_[1];
        expect(helper.enableAttributes.getCall(0).firstArg).to.be(
          firstPass.fillRenderPass.attributesDesc,
        );
        expect(helper.enableAttributes.getCall(1).firstArg).to.be(
          firstPass.strokeRenderPass.attributesDesc,
        );
        expect(helper.enableAttributes.getCall(2).firstArg).to.be(
          firstPass.symbolRenderPass.attributesDesc,
        );
        expect(helper.enableAttributes.getCall(3).firstArg).to.be(
          secondPass.fillRenderPass.attributesDesc,
        );
      });
      it('calls the pre render callback once per render pass & geometry type', function () {
        expect(preRenderCb.callCount).to.be(4);
      });
      it('renders all render passes & geometry types', function () {
        expect(helper.drawElements.callCount).to.be(2);
        expect(helper.drawElementsInstanced.callCount).to.be(2);

        expect(helper.drawElements.getCall(0).args).to.eql([
          0,
          buffers.polygonBuffers[0].getSize(),
        ]);
        expect(helper.drawElements.getCall(1).args).to.eql([
          0,
          buffers.polygonBuffers[0].getSize(),
        ]);
        expect(helper.drawElementsInstanced.getCall(0).args).to.eql([
          0,
          buffers.lineStringBuffers[0].getSize(),
          6, // segments count
        ]);
        expect(helper.drawElementsInstanced.getCall(1).args).to.eql([
          0,
          buffers.pointBuffers[0].getSize(),
          2, // symbols count
        ]);
      });
    });
  });
  describe('rendering only fill', () => {
    let buffers, preRenderCb;
    beforeEach(async () => {
      const fillOnlyShaders = SAMPLE_SHADERS();
      fillOnlyShaders.builder = new ShaderBuilder().setFillColorExpression(
        'vec4(1.0)',
      );
      sinonSpy(helper, 'flushBufferData');
      sinonSpy(helper, 'enableAttributes');
      sinonSpy(helper, 'enableAttributesInstanced');
      sinonSpy(helper, 'useProgram');
      sinonSpy(helper, 'drawElements');
      sinonSpy(helper, 'drawElementsInstanced');
      vectorStyleRenderer = new VectorStyleRenderer(
        fillOnlyShaders,
        {},
        helper,
      );
      buffers = await vectorStyleRenderer.generateBuffers(
        geometryBatch,
        SAMPLE_TRANSFORM,
      );
      preRenderCb = sinonSpy();
      vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
    });
    it('only loads buffer data for one geometry type', function () {
      expect(helper.flushBufferData.callCount).to.be(3);
    });
    it('only does one render', function () {
      expect(preRenderCb.callCount).to.be(1);
    });
    it('only does the polygon render pass', function () {
      expect(helper.enableAttributes.callCount).to.be(1);
      const renderPass = vectorStyleRenderer.renderPasses_[0];
      expect(helper.enableAttributes.firstCall.firstArg).to.be(
        renderPass.fillRenderPass.attributesDesc,
      );
      expect(helper.enableAttributesInstanced.callCount).to.be(1);
      expect(helper.enableAttributesInstanced.firstCall.firstArg).to.be(
        renderPass.fillRenderPass.instancedAttributesDesc,
      );
      expect(helper.useProgram.callCount).to.be(1);
      expect(helper.useProgram.firstCall.firstArg).to.be(
        renderPass.fillRenderPass.program,
      );
      expect(helper.drawElements.callCount).to.be(1);
      expect(helper.drawElements.firstCall.args).to.eql([
        0,
        buffers.polygonBuffers[0].getSize(),
      ]);

      expect(helper.drawElementsInstanced.callCount).to.be(0);
    });
  });
  describe('rendering only stroke', () => {
    let buffers, preRenderCb;
    beforeEach(async () => {
      const strokeOnlyShaders = SAMPLE_SHADERS();
      strokeOnlyShaders.builder = new ShaderBuilder().setStrokeColorExpression(
        'vec4(1.0)',
      );
      sinonSpy(helper, 'flushBufferData');
      sinonSpy(helper, 'enableAttributes');
      sinonSpy(helper, 'enableAttributesInstanced');
      sinonSpy(helper, 'useProgram');
      sinonSpy(helper, 'drawElements');
      sinonSpy(helper, 'drawElementsInstanced');
      vectorStyleRenderer = new VectorStyleRenderer(
        strokeOnlyShaders,
        {},
        helper,
      );
      buffers = await vectorStyleRenderer.generateBuffers(
        geometryBatch,
        SAMPLE_TRANSFORM,
      );
      preRenderCb = sinonSpy();
      vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
    });
    it('only loads buffer data for one geometry type', function () {
      expect(helper.flushBufferData.callCount).to.be(3);
    });
    it('only does one render', function () {
      expect(preRenderCb.callCount).to.be(1);
    });
    it('only does the line string render pass', function () {
      expect(helper.enableAttributes.callCount).to.be(1);
      const renderPass = vectorStyleRenderer.renderPasses_[0];
      expect(helper.enableAttributes.firstCall.firstArg).to.be(
        renderPass.strokeRenderPass.attributesDesc,
      );
      expect(helper.enableAttributesInstanced.callCount).to.be(1);
      expect(helper.enableAttributesInstanced.firstCall.firstArg).to.be(
        renderPass.strokeRenderPass.instancedAttributesDesc,
      );
      expect(helper.useProgram.callCount).to.be(1);
      expect(helper.useProgram.firstCall.firstArg).to.be(
        renderPass.strokeRenderPass.program,
      );
      expect(helper.drawElementsInstanced.callCount).to.be(1);
      expect(helper.drawElementsInstanced.firstCall.args).to.eql([
        0,
        buffers.lineStringBuffers[0].getSize(),
        6, // segments count
      ]);

      expect(helper.drawElements.callCount).to.be(0);
    });
  });
  describe('rendering only symbol', () => {
    let buffers, preRenderCb;
    beforeEach(async () => {
      const symbolOnlyShaders = SAMPLE_SHADERS();
      symbolOnlyShaders.builder = new ShaderBuilder().setSymbolColorExpression(
        'vec4(1.)',
      );
      sinonSpy(helper, 'flushBufferData');
      sinonSpy(helper, 'enableAttributes');
      sinonSpy(helper, 'enableAttributesInstanced');
      sinonSpy(helper, 'useProgram');
      sinonSpy(helper, 'drawElements');
      sinonSpy(helper, 'drawElementsInstanced');
      vectorStyleRenderer = new VectorStyleRenderer(
        symbolOnlyShaders,
        {},
        helper,
      );
      buffers = await vectorStyleRenderer.generateBuffers(
        geometryBatch,
        SAMPLE_TRANSFORM,
      );
      preRenderCb = sinonSpy();
      vectorStyleRenderer.render(buffers, SAMPLE_FRAMESTATE, preRenderCb);
    });
    it('only loads buffer data for one geometry type', function () {
      expect(helper.flushBufferData.callCount).to.be(3);
    });
    it('only does one render', function () {
      expect(preRenderCb.callCount).to.be(1);
    });
    it('only does the point render pass', function () {
      expect(helper.enableAttributes.callCount).to.be(1);
      const renderPass = vectorStyleRenderer.renderPasses_[0];
      expect(helper.enableAttributes.firstCall.firstArg).to.be(
        renderPass.symbolRenderPass.attributesDesc,
      );
      expect(helper.enableAttributesInstanced.callCount).to.be(1);
      expect(helper.enableAttributesInstanced.firstCall.firstArg).to.be(
        renderPass.symbolRenderPass.instancedAttributesDesc,
      );
      expect(helper.useProgram.callCount).to.be(1);
      expect(helper.useProgram.firstCall.firstArg).to.be(
        renderPass.symbolRenderPass.program,
      );
      expect(helper.drawElementsInstanced.callCount).to.be(1);
      expect(helper.drawElementsInstanced.firstCall.args).to.eql([
        0,
        buffers.pointBuffers[0].getSize(),
        buffers.pointBuffers[2].getSize() / 6,
      ]);

      expect(helper.drawElements.callCount).to.be(0);
    });
  });

  describe('convertStyleToShaders', function () {
    it('breaks down a single flat style', function () {
      const style = {
        'fill-color': 'red',
        'stroke-color': 'blue',
        'stroke-width': 2,
      };
      const result = convertStyleToShaders(style);
      expect(result).to.eql([
        {
          builder: new ShaderBuilder()
            .setFillColorExpression('vec4(1.0, 0.0, 0.0, 1.0)')
            .setStrokeColorExpression('vec4(0.0, 0.0, 1.0, 1.0)')
            .setStrokeWidthExpression('2.0'),
          'attributes': {},
          'uniforms': {},
        },
      ]);
    });
    it('breaks down an array of flat styles', function () {
      const styles = [
        {
          'fill-color': 'red',
        },
        {
          'stroke-color': 'blue',
          'stroke-width': 2,
        },
      ];
      const result = convertStyleToShaders(styles);
      expect(result).to.eql([
        {
          builder: new ShaderBuilder().setFillColorExpression(
            'vec4(1.0, 0.0, 0.0, 1.0)',
          ),
          'attributes': {},
          'uniforms': {},
        },
        {
          builder: new ShaderBuilder()
            .setStrokeColorExpression('vec4(0.0, 0.0, 1.0, 1.0)')
            .setStrokeWidthExpression('2.0'),
          'attributes': {},
          'uniforms': {},
        },
      ]);
    });
    it('breaks down an array of rules, generating appropriate filters for "else" rules', function () {
      const rules = [
        {
          filter: ['>', ['get', 'size'], 10],
          style: [{'fill-color': 'red'}, {'fill-color': 'green'}],
        },
        {
          else: true,
          style: {'circle-radius': 5, 'circle-fill-color': 'red'},
        },
        {
          else: true,
          filter: ['==', ['get', 'type'], 'road'],
          style: {'stroke-color': 'blue', 'stroke-width': 2},
        },
        {
          else: true,
          style: [
            {'stroke-color': 'green', 'stroke-width': 2},
            {'stroke-color': 'white', 'stroke-width': 1},
          ],
        },
        {
          style: {'stroke-color': 'yellow', 'stroke-width': 2},
        },
        {
          filter: ['==', ['get', 'type'], 'street'],
          style: {'stroke-color': 'black', 'stroke-width': 2},
        },
      ];
      const result = convertStyleToShaders(rules);

      expect(result).to.have.length(8);

      expect(result[0].attributes).to.only.have.key('prop_size');
      expect(result[0].builder).to.eql(
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .setFillColorExpression('vec4(1.0, 0.0, 0.0, 1.0)')
          .setFragmentDiscardExpression('!(a_prop_size > 10.0)'),
      );

      expect(result[1].attributes).to.only.have.key('prop_size');
      expect(result[1].builder).to.eql(
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .setFillColorExpression('vec4(0.0, 0.5019607843137255, 0.0, 1.0)')
          .setFragmentDiscardExpression('!(a_prop_size > 10.0)'),
      );

      expect(result[2].attributes).to.only.have.key('prop_size');
      expect(result[2].builder).to.eql(
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .setSymbolColorExpression(
            'vec4(1.0, 0.0, 0.0, 1.0) * vec4(1.0, 1.0, 1.0, (1.0 - smoothstep(-0.63, 0.58, circleDistanceField(coordsPx, 5.0))))',
          )
          .setSymbolSizeExpression('vec2(5.0 * 2. + 0.5)')
          .addFragmentShaderFunction(
            'float circleDistanceField(vec2 point, float radius) {\n  return length(point) - radius;\n}',
          )
          .addVertexShaderFunction(
            'float circleDistanceField(vec2 point, float radius) {\n  return length(point) - radius;\n}',
          )
          .setFragmentDiscardExpression('!(!(a_prop_size > 10.0))'),
      );

      expect(result[3].attributes).to.only.have.keys([
        'prop_size',
        'prop_type',
      ]);
      expect(result[3].builder).to.eql(
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(0.0, 0.0, 1.0, 1.0)')
          .setStrokeWidthExpression('2.0')
          .setFragmentDiscardExpression(
            `!((!(a_prop_size > 10.0)) && (a_prop_type == ${stringToGlsl('road')}))`,
          ),
      );

      expect(result[4].attributes).to.only.have.keys([
        'prop_size',
        'prop_type',
      ]);
      expect(result[4].builder).to.eql(
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(0.0, 0.5019607843137255, 0.0, 1.0)')
          .setStrokeWidthExpression('2.0')
          .setFragmentDiscardExpression(
            `!((!(a_prop_size > 10.0)) && (!(a_prop_type == ${stringToGlsl('road')})))`,
          ),
      );

      expect(result[5].attributes).to.only.have.key('prop_size', 'prop_type');
      expect(result[5].builder).to.eql(
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(1.0, 1.0, 1.0, 1.0)')
          .setStrokeWidthExpression('1.0')
          .setFragmentDiscardExpression(
            `!((!(a_prop_size > 10.0)) && (!(a_prop_type == ${stringToGlsl('road')})))`,
          ),
      );

      expect(result[6].attributes).to.eql({});
      expect(result[6].builder).to.eql(
        new ShaderBuilder()
          .setStrokeColorExpression('vec4(1.0, 1.0, 0.0, 1.0)')
          .setStrokeWidthExpression('2.0'),
      );

      expect(result[7].attributes).to.only.have.key('prop_type');
      expect(result[7].builder).to.eql(
        new ShaderBuilder()
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(0.0, 0.0, 0.0, 1.0)')
          .setStrokeWidthExpression('2.0')
          .setFragmentDiscardExpression(
            `!(a_prop_type == ${stringToGlsl('street')})`,
          ),
      );
    });
    it('returns an array of shaders as is', function () {
      const shaders = [
        {
          builder: new ShaderBuilder().setStrokeColorExpression(
            'vec4(1.0, 0.0, 0.0, 1.0)',
          ),
          attributes: [],
        },
        {
          builder: new ShaderBuilder().setStrokeColorExpression(
            'vec4(0.0, 0.7, 0.7, 1.0)',
          ),
          attributes: [],
        },
      ];
      const result = convertStyleToShaders(shaders);
      expect(result).to.eql(shaders);
    });
    it('returns a single shader as array', function () {
      const shader = {
        builder: new ShaderBuilder().setStrokeWidthExpression('3.0'),
        attributes: [],
      };
      const result = convertStyleToShaders(shader);
      expect(result).to.eql([shader]);
    });
  });
});
