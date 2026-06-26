import {assert} from 'chai';
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
import {
  ARRAY_BUFFER,
  DYNAMIC_DRAW,
  ELEMENT_ARRAY_BUFFER,
  FLOAT,
} from '../../../../../../src/ol/webgl.js';
import WebGLArrayBuffer from '../../../../../../src/ol/webgl/Buffer.js';
import WebGLHelper from '../../../../../../src/ol/webgl/Helper.js';
import {
  assertArrayLikeEqual,
  assertCustomAttributes,
  assertUniformCallbacks,
} from '../../../../../util/equal.js';

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
      assertCustomAttributes(vectorStyleRenderer.customAttributes_, {
        prop_color: {size: 2},
        prop_size: {size: 1},
        prop_id: {size: 1},
      });
      assertUniformCallbacks(vectorStyleRenderer.uniforms_, {
        u_var_highlightedId: {},
      });
      assert.lengthOf(vectorStyleRenderer.renderPasses_, 2);
    });
    it('initializes two render passes with the proper attributes', () => {
      const firstPass = vectorStyleRenderer.renderPasses_[0];
      assert.instanceOf(firstPass.fillRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.fillRenderPass.attributesDesc, [
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT}, // this is padding for the `id` attribute
      ]);
      assert.instanceOf(firstPass.strokeRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.strokeRenderPass.attributesDesc, [
        {name: 'a_localPosition', size: 2, type: 5126},
      ]);
      assert.deepEqual(firstPass.strokeRenderPass.instancedAttributesDesc, [
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
      assert.instanceOf(firstPass.symbolRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.symbolRenderPass.attributesDesc, [
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      assert.deepEqual(firstPass.symbolRenderPass.instancedAttributesDesc, [
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
      ]);

      const secondPass = vectorStyleRenderer.renderPasses_[1];
      assert.instanceOf(secondPass.fillRenderPass.program, WebGLProgram);
      assert.deepEqual(secondPass.fillRenderPass.attributesDesc, [
        {name: 'a_position', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
        {name: null, size: 2, type: FLOAT},
        {name: 'a_prop_id', size: 1, type: FLOAT},
      ]);
      assert.strictEqual(secondPass.strokeRenderPass, undefined);
      assert.strictEqual(secondPass.symbolRenderPass, undefined);
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
      assertCustomAttributes(vectorStyleRenderer.customAttributes_, {
        hitColor: {size: 2},
        prop_color: {size: 2},
        prop_size: {size: 1},
        prop_id: {size: 1},
      });
      assertUniformCallbacks(vectorStyleRenderer.uniforms_, {
        u_var_highlightedId: {},
      });
      assert.lengthOf(vectorStyleRenderer.renderPasses_, 2);
    });
    it('initializes two render passes with the proper attributes', () => {
      const firstPass = vectorStyleRenderer.renderPasses_[0];
      assert.instanceOf(firstPass.fillRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.fillRenderPass.attributesDesc, [
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_hitColor', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT}, // this is padding for the `id` attribute
      ]);
      assert.instanceOf(firstPass.strokeRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.strokeRenderPass.attributesDesc, [
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      assert.deepEqual(firstPass.strokeRenderPass.instancedAttributesDesc, [
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
      assert.instanceOf(firstPass.symbolRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.symbolRenderPass.attributesDesc, [
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      assert.deepEqual(firstPass.symbolRenderPass.instancedAttributesDesc, [
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_hitColor', size: 2, type: FLOAT},
        {name: 'a_prop_size', size: 1, type: FLOAT},
        {name: 'a_prop_color', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
      ]);

      const secondPass = vectorStyleRenderer.renderPasses_[1];
      assert.instanceOf(secondPass.fillRenderPass.program, WebGLProgram);
      assert.deepEqual(secondPass.fillRenderPass.attributesDesc, [
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_hitColor', size: 2, type: FLOAT},
        {name: null, size: 1, type: FLOAT},
        {name: null, size: 2, type: FLOAT},
        {name: 'a_prop_id', size: 1, type: FLOAT},
      ]);
      assert.strictEqual(secondPass.strokeRenderPass, undefined);
      assert.strictEqual(secondPass.symbolRenderPass, undefined);
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
      assertCustomAttributes(vectorStyleRenderer.customAttributes_, {
        prop_attr1: {},
        prop_attr2: {size: 3},
      });
      assertUniformCallbacks(vectorStyleRenderer.uniforms_, {
        custom: {},
      });

      assert.lengthOf(vectorStyleRenderer.renderPasses_, 1);
      const firstPass = vectorStyleRenderer.renderPasses_[0];
      assert.instanceOf(firstPass.fillRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.fillRenderPass.attributesDesc, [
        {name: 'a_position', size: 2, type: FLOAT},
        {name: 'a_prop_attr1', size: 1, type: FLOAT},
        {name: 'a_prop_attr2', size: 3, type: FLOAT},
      ]);
      assert.instanceOf(firstPass.strokeRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.strokeRenderPass.attributesDesc, [
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      assert.deepEqual(firstPass.strokeRenderPass.instancedAttributesDesc, [
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
      assert.instanceOf(firstPass.symbolRenderPass.program, WebGLProgram);
      assert.deepEqual(firstPass.symbolRenderPass.attributesDesc, [
        {name: 'a_localPosition', size: 2, type: FLOAT},
      ]);
      assert.deepEqual(firstPass.symbolRenderPass.instancedAttributesDesc, [
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
      it('returns null buffers with invertVerticesTransform when the geometry batch is empty', async () => {
        const emptyBatch = new MixedGeometryBatch();
        const generatedBuffers = await vectorStyleRenderer.generateBuffers(
          emptyBatch,
          SAMPLE_TRANSFORM,
        );
        assert.notEqual(generatedBuffers, null);
        assert.strictEqual(generatedBuffers.polygonBuffers, null);
        assert.strictEqual(generatedBuffers.lineStringBuffers, null);
        assert.strictEqual(generatedBuffers.pointBuffers, null);
        assert.deepEqual(
          generatedBuffers.invertVerticesTransform,
          makeInverseTransform(createTransform(), SAMPLE_TRANSFORM),
        );
      });

      let buffers;
      beforeEach(async () => {
        buffers = await vectorStyleRenderer.generateBuffers(
          geometryBatch,
          SAMPLE_TRANSFORM,
        );
      });
      it('creates buffers for a geometry batch', () => {
        assert.deepEqual(
          buffers.invertVerticesTransform,
          makeInverseTransform(createTransform(), SAMPLE_TRANSFORM),
        );
        assert.instanceOf(buffers.polygonBuffers[0], WebGLArrayBuffer);
        assert.strictEqual(
          buffers.polygonBuffers[0].getType(),
          ELEMENT_ARRAY_BUFFER,
        );
        assert.strictEqual(buffers.polygonBuffers[0].getUsage(), DYNAMIC_DRAW);
        assert.instanceOf(buffers.polygonBuffers[1], WebGLArrayBuffer);
        assert.strictEqual(buffers.polygonBuffers[1].getType(), ARRAY_BUFFER);
        assert.strictEqual(buffers.polygonBuffers[1].getUsage(), DYNAMIC_DRAW);
        assertArrayLikeEqual(
          buffers.polygonBuffers[1].getArray().slice(0, 6),
          [-45, -47.5, 3000, 128, 255, 3],
        );

        assert.instanceOf(buffers.lineStringBuffers[0], WebGLArrayBuffer);
        assert.strictEqual(
          buffers.lineStringBuffers[0].getType(),
          ELEMENT_ARRAY_BUFFER,
        );
        assert.strictEqual(
          buffers.lineStringBuffers[0].getUsage(),
          DYNAMIC_DRAW,
        );
        assert.instanceOf(buffers.lineStringBuffers[1], WebGLArrayBuffer);
        assert.strictEqual(
          buffers.lineStringBuffers[1].getType(),
          ARRAY_BUFFER,
        );
        assert.strictEqual(
          buffers.lineStringBuffers[1].getUsage(),
          DYNAMIC_DRAW,
        );
        assertArrayLikeEqual(
          buffers.lineStringBuffers[1].getArray().slice(0, 8),
          [-1, -1, 1, -1, 1, 1, -1, 1],
        );
        assert.instanceOf(buffers.lineStringBuffers[2], WebGLArrayBuffer);
        assert.strictEqual(
          buffers.lineStringBuffers[2].getType(),
          ARRAY_BUFFER,
        );
        assert.strictEqual(
          buffers.lineStringBuffers[2].getUsage(),
          DYNAMIC_DRAW,
        );
        assertArrayLikeEqual(
          buffers.lineStringBuffers[2].getArray().slice(0, 15),
          [
            -45, -47.5, 0, -40, -47.5, 0, 1.5707963705062866, 4.71238899230957,
            0, 0, 0, 3000, 128, 255, 3,
          ],
        );

        assert.instanceOf(buffers.pointBuffers[0], WebGLArrayBuffer);
        assert.strictEqual(
          buffers.pointBuffers[0].getType(),
          ELEMENT_ARRAY_BUFFER,
        );
        assert.strictEqual(buffers.pointBuffers[0].getUsage(), DYNAMIC_DRAW);
        assert.instanceOf(buffers.pointBuffers[1], WebGLArrayBuffer);
        assert.strictEqual(buffers.pointBuffers[1].getType(), ARRAY_BUFFER);
        assert.strictEqual(buffers.pointBuffers[1].getUsage(), DYNAMIC_DRAW);
        assertArrayLikeEqual(
          buffers.pointBuffers[1].getArray().slice(0, 8),
          [-1, -1, 1, -1, 1, 1, -1, 1],
        );
        assert.instanceOf(buffers.pointBuffers[2], WebGLArrayBuffer);
        assert.strictEqual(buffers.pointBuffers[2].getType(), ARRAY_BUFFER);
        assert.strictEqual(buffers.pointBuffers[2].getUsage(), DYNAMIC_DRAW);
        assertArrayLikeEqual(
          buffers.pointBuffers[2].getArray().slice(0, 6),
          [-45, -45, 1000, 65280, 255, 1],
        );
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
        assert.strictEqual(helper.useProgram.callCount, 4);
        const firstPass = vectorStyleRenderer.renderPasses_[0];
        const secondPass = vectorStyleRenderer.renderPasses_[1];
        assert.strictEqual(
          helper.useProgram.getCall(0).firstArg,
          firstPass.fillRenderPass.program,
        );
        assert.strictEqual(
          helper.useProgram.getCall(1).firstArg,
          firstPass.strokeRenderPass.program,
        );
        assert.strictEqual(
          helper.useProgram.getCall(2).firstArg,
          firstPass.symbolRenderPass.program,
        );
        assert.strictEqual(
          helper.useProgram.getCall(3).firstArg,
          secondPass.fillRenderPass.program,
        );
      });
      it('binds buffers for all render passes & geometry types', function () {
        assert.strictEqual(helper.bindBuffer.callCount, 12);
        const args = helper.bindBuffer.getCalls().map((call) => call.firstArg);

        assert.equal(args[0], buffers.polygonBuffers[1]);
        assert.equal(args[1], buffers.polygonBuffers[0]);
        assert.equal(args[2], buffers.polygonBuffers[2]);
        assert.equal(args[3], buffers.lineStringBuffers[1]);
        assert.equal(args[4], buffers.lineStringBuffers[0]);
        assert.equal(args[5], buffers.lineStringBuffers[2]);
        assert.equal(args[6], buffers.pointBuffers[1]);
        assert.equal(args[7], buffers.pointBuffers[0]);
        assert.equal(args[8], buffers.pointBuffers[2]);
        assert.equal(args[9], buffers.polygonBuffers[1]);
        assert.equal(args[10], buffers.polygonBuffers[0]);
        assert.equal(args[11], buffers.polygonBuffers[2]);
      });
      it('enables attributes for all render passes & geometry types', function () {
        assert.strictEqual(helper.enableAttributes.callCount, 4);
        const firstPass = vectorStyleRenderer.renderPasses_[0];
        const secondPass = vectorStyleRenderer.renderPasses_[1];
        assert.strictEqual(
          helper.enableAttributes.getCall(0).firstArg,
          firstPass.fillRenderPass.attributesDesc,
        );
        assert.strictEqual(
          helper.enableAttributes.getCall(1).firstArg,
          firstPass.strokeRenderPass.attributesDesc,
        );
        assert.strictEqual(
          helper.enableAttributes.getCall(2).firstArg,
          firstPass.symbolRenderPass.attributesDesc,
        );
        assert.strictEqual(
          helper.enableAttributes.getCall(3).firstArg,
          secondPass.fillRenderPass.attributesDesc,
        );
      });
      it('calls the pre render callback once per render pass & geometry type', function () {
        assert.strictEqual(preRenderCb.callCount, 4);
      });
      it('renders all render passes & geometry types', function () {
        assert.strictEqual(helper.drawElements.callCount, 2);
        assert.strictEqual(helper.drawElementsInstanced.callCount, 2);

        assert.deepEqual(helper.drawElements.getCall(0).args, [
          0,
          buffers.polygonBuffers[0].getSize(),
        ]);
        assert.deepEqual(helper.drawElements.getCall(1).args, [
          0,
          buffers.polygonBuffers[0].getSize(),
        ]);
        assert.deepEqual(helper.drawElementsInstanced.getCall(0).args, [
          0,
          buffers.lineStringBuffers[0].getSize(),
          6, // segments count
        ]);
        assert.deepEqual(helper.drawElementsInstanced.getCall(1).args, [
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
      assert.strictEqual(helper.flushBufferData.callCount, 3);
    });
    it('only does one render', function () {
      assert.strictEqual(preRenderCb.callCount, 1);
    });
    it('only does the polygon render pass', function () {
      assert.strictEqual(helper.enableAttributes.callCount, 1);
      const renderPass = vectorStyleRenderer.renderPasses_[0];
      assert.strictEqual(
        helper.enableAttributes.firstCall.firstArg,
        renderPass.fillRenderPass.attributesDesc,
      );
      assert.strictEqual(helper.enableAttributesInstanced.callCount, 1);
      assert.strictEqual(
        helper.enableAttributesInstanced.firstCall.firstArg,
        renderPass.fillRenderPass.instancedAttributesDesc,
      );
      assert.strictEqual(helper.useProgram.callCount, 1);
      assert.strictEqual(
        helper.useProgram.firstCall.firstArg,
        renderPass.fillRenderPass.program,
      );
      assert.strictEqual(helper.drawElements.callCount, 1);
      assert.deepEqual(helper.drawElements.firstCall.args, [
        0,
        buffers.polygonBuffers[0].getSize(),
      ]);

      assert.strictEqual(helper.drawElementsInstanced.callCount, 0);
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
      assert.strictEqual(helper.flushBufferData.callCount, 3);
    });
    it('only does one render', function () {
      assert.strictEqual(preRenderCb.callCount, 1);
    });
    it('only does the line string render pass', function () {
      assert.strictEqual(helper.enableAttributes.callCount, 1);
      const renderPass = vectorStyleRenderer.renderPasses_[0];
      assert.strictEqual(
        helper.enableAttributes.firstCall.firstArg,
        renderPass.strokeRenderPass.attributesDesc,
      );
      assert.strictEqual(helper.enableAttributesInstanced.callCount, 1);
      assert.strictEqual(
        helper.enableAttributesInstanced.firstCall.firstArg,
        renderPass.strokeRenderPass.instancedAttributesDesc,
      );
      assert.strictEqual(helper.useProgram.callCount, 1);
      assert.strictEqual(
        helper.useProgram.firstCall.firstArg,
        renderPass.strokeRenderPass.program,
      );
      assert.strictEqual(helper.drawElementsInstanced.callCount, 1);
      assert.deepEqual(helper.drawElementsInstanced.firstCall.args, [
        0,
        buffers.lineStringBuffers[0].getSize(),
        6, // segments count
      ]);

      assert.strictEqual(helper.drawElements.callCount, 0);
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
      assert.strictEqual(helper.flushBufferData.callCount, 3);
    });
    it('only does one render', function () {
      assert.strictEqual(preRenderCb.callCount, 1);
    });
    it('only does the point render pass', function () {
      assert.strictEqual(helper.enableAttributes.callCount, 1);
      const renderPass = vectorStyleRenderer.renderPasses_[0];
      assert.strictEqual(
        helper.enableAttributes.firstCall.firstArg,
        renderPass.symbolRenderPass.attributesDesc,
      );
      assert.strictEqual(helper.enableAttributesInstanced.callCount, 1);
      assert.strictEqual(
        helper.enableAttributesInstanced.firstCall.firstArg,
        renderPass.symbolRenderPass.instancedAttributesDesc,
      );
      assert.strictEqual(helper.useProgram.callCount, 1);
      assert.strictEqual(
        helper.useProgram.firstCall.firstArg,
        renderPass.symbolRenderPass.program,
      );
      assert.strictEqual(helper.drawElementsInstanced.callCount, 1);
      assert.deepEqual(helper.drawElementsInstanced.firstCall.args, [
        0,
        buffers.pointBuffers[0].getSize(),
        buffers.pointBuffers[2].getSize() / 6,
      ]);

      assert.strictEqual(helper.drawElements.callCount, 0);
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
      assert.deepEqual(result, [
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
      assert.deepEqual(result, [
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

      assert.lengthOf(result, 8);

      assert.hasAllKeys(result[0].attributes, ['prop_size']);
      assert.deepEqual(
        result[0].builder,
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .setFillColorExpression('vec4(1.0, 0.0, 0.0, 1.0)')
          .setShapeDiscardExpression('!(a_prop_size > 10.0)'),
      );

      assert.hasAllKeys(result[1].attributes, ['prop_size']);
      assert.deepEqual(
        result[1].builder,
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .setFillColorExpression('vec4(0.0, 0.5019607843137255, 0.0, 1.0)')
          .setShapeDiscardExpression('!(a_prop_size > 10.0)'),
      );

      assert.hasAllKeys(result[2].attributes, ['prop_size']);
      assert.deepEqual(
        result[2].builder,
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
          .setShapeDiscardExpression('!(!(a_prop_size > 10.0))'),
      );

      assert.hasAllKeys(result[3].attributes, ['prop_size', 'prop_type']);
      assert.deepEqual(
        result[3].builder,
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(0.0, 0.0, 1.0, 1.0)')
          .setStrokeWidthExpression('2.0')
          .setShapeDiscardExpression(
            `!((!(a_prop_size > 10.0)) && (a_prop_type == ${stringToGlsl('road')}))`,
          ),
      );

      assert.hasAllKeys(result[4].attributes, ['prop_size', 'prop_type']);
      assert.deepEqual(
        result[4].builder,
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(0.0, 0.5019607843137255, 0.0, 1.0)')
          .setStrokeWidthExpression('2.0')
          .setShapeDiscardExpression(
            `!((!(a_prop_size > 10.0)) && (!(a_prop_type == ${stringToGlsl('road')})))`,
          ),
      );

      assert.hasAllKeys(result[5].attributes, ['prop_size', 'prop_type']);
      assert.deepEqual(
        result[5].builder,
        new ShaderBuilder()
          .addAttribute('a_prop_size', 'float')
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(1.0, 1.0, 1.0, 1.0)')
          .setStrokeWidthExpression('1.0')
          .setShapeDiscardExpression(
            `!((!(a_prop_size > 10.0)) && (!(a_prop_type == ${stringToGlsl('road')})))`,
          ),
      );

      assert.deepEqual(result[6].attributes, {});
      assert.deepEqual(
        result[6].builder,
        new ShaderBuilder()
          .setStrokeColorExpression('vec4(1.0, 1.0, 0.0, 1.0)')
          .setStrokeWidthExpression('2.0'),
      );

      assert.hasAllKeys(result[7].attributes, ['prop_type']);
      assert.deepEqual(
        result[7].builder,
        new ShaderBuilder()
          .addAttribute('a_prop_type', 'float')
          .setStrokeColorExpression('vec4(0.0, 0.0, 0.0, 1.0)')
          .setStrokeWidthExpression('2.0')
          .setShapeDiscardExpression(
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
      assert.deepEqual(result, shaders);
    });
    it('returns a single shader as array', function () {
      const shader = {
        builder: new ShaderBuilder().setStrokeWidthExpression('3.0'),
        attributes: [],
      };
      const result = convertStyleToShaders(shader);
      assert.deepEqual(result, [shader]);
    });
  });
});
