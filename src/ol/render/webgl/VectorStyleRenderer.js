/**
 * @module ol/render/webgl/VectorStyleRenderer
 */
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import {AttributeType} from '../../webgl/Helper.js';
import {WebGLWorkerMessageType} from './constants.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../transform.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {
  generateLineStringRenderInstructions,
  generatePointRenderInstructions,
  generatePolygonRenderInstructions,
  getCustomAttributesSize,
} from './renderinstructions.js';
import {parseLiteralStyle} from '../../webgl/styleparser.js';

const WEBGL_WORKER = createWebGLWorker();
let workerMessageCounter = 0;

/**
 * Names of attributes made available to the vertex shader.
 * Please note: changing these *will* break custom shaders!
 * @enum {string}
 */
export const Attributes = {
  POSITION: 'a_position',
  INDEX: 'a_index',
  SEGMENT_START: 'a_segmentStart',
  SEGMENT_END: 'a_segmentEnd',
  PARAMETERS: 'a_parameters',
};

/**
 * @typedef {Object} AttributeDefinition A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {number} [size] Amount of numerical values composing the attribute, either 1, 2, 3 or 4; in case size is > 1, the return value
 * of the callback should be an array; if unspecified, assumed to be a single float value
 * @property {function(import("../../Feature").FeatureLike):number|Array<number>} callback This callback computes the numerical value of the
 * attribute for a given feature.
 */

/**
 * @typedef {Object<string, AttributeDefinition>} AttributeDefinitions
 * @typedef {Object<string, import("../../webgl/Helper").UniformValue>} UniformDefinitions
 */

/**
 * @typedef {Object} WebGLBuffers
 * @property {WebGLArrayBuffer} polygonIndicesBuffer Polygon indices buffer
 * @property {WebGLArrayBuffer} polygonVerticesBuffer Polygon vertices buffer
 * @property {WebGLArrayBuffer} lineStringIndicesBuffer LineString indices buffer
 * @property {WebGLArrayBuffer} lineStringVerticesBuffer LineString vertices buffer
 * @property {WebGLArrayBuffer} pointIndicesBuffer Point indices buffer
 * @property {WebGLArrayBuffer} pointVerticesBuffer Point vertices buffer
 * @property {import("../../transform.js").Transform} invertVerticesTransform Inverse of the transform applied when generating buffers
 */

/**
 * @typedef {Object} RenderInstructions
 * @property {Float32Array} polygonInstructions Polygon instructions
 * @property {Float32Array} lineStringInstructions LineString instructions
 * @property {Float32Array} pointInstructions Point instructions
 */

/**
 * @typedef {Object} ShaderProgram An object containing both shaders (vertex and fragment)
 * @property {string} vertex Vertex shader source
 * @property {string} fragment Fragment shader source
 */

/**
 * @typedef {Object} StyleShaders
 * @property {ShaderProgram} [fill] Shaders for filling polygons.
 * @property {ShaderProgram} [stroke] Shaders for line strings and polygon strokes.
 * @property {ShaderProgram} [symbol] Shaders for symbols.
 * @property {AttributeDefinitions} [attributes] Custom attributes made available in the vertex shaders.
 * Default shaders rely on the attributes in {@link Attributes}.
 * @property {UniformDefinitions} [uniforms] Additional uniforms usable in shaders.
 */

/**
 * @typedef {import('../../style/literal.js').LiteralStyle|StyleShaders} VectorStyle
 */

/**
 * @classdesc This class is responsible for:
 * 1. generate WebGL buffers according to a provided style, using a MixedGeometryBatch as input
 * 2. rendering geometries contained in said buffers
 *
 * A layer renderer will typically maintain several of these in order to have several styles rendered separately.
 *
 * A VectorStyleRenderer instance can be created either from a literal style or from shaders using either
 * `VectorStyleRenderer.fromStyle` or `VectorStyleRenderer.fromShaders`.
 *
 * The `generateBuffers` method returns a promise resolving to WebGL buffers that are intended to be rendered by the
 * same renderer.
 */
class VectorStyleRenderer {
  /**
   * @param {VectorStyle} styleOrShaders Literal style or custom shaders
   * @param {import('../../webgl/Helper.js').default} helper Helper
   */
  constructor(styleOrShaders, helper) {
    this.helper_ = helper;

    let shaders = /** @type {StyleShaders} */ (styleOrShaders);

    // TODO: improve discrimination between shaders and style
    if (
      !('fill' in styleOrShaders || 'stroke' in styleOrShaders) ||
      ('symbol' in styleOrShaders &&
        'symbolType' in styleOrShaders.symbol &&
        'size' in styleOrShaders.symbol)
    ) {
      const parseResult = parseLiteralStyle(
        /** @type {import('../../style/literal.js').LiteralStyle} */ (
          styleOrShaders
        )
      );
      shaders = {
        fill: {
          vertex: parseResult.builder.getFillVertexShader(),
          fragment: parseResult.builder.getFillFragmentShader(),
        },
        stroke: {
          vertex: parseResult.builder.getStrokeVertexShader(),
          fragment: parseResult.builder.getStrokeFragmentShader(),
        },
        symbol: {
          vertex: parseResult.builder.getSymbolVertexShader(),
          fragment: parseResult.builder.getSymbolFragmentShader(),
        },
        attributes: parseResult.attributes,
        uniforms: parseResult.uniforms,
      };
    }

    this.fillVertexShader_ = shaders.fill && shaders.fill.vertex;
    this.fillFragmentShader_ = shaders.fill && shaders.fill.fragment;
    this.fillProgram_ = this.helper_.getProgram(
      this.fillFragmentShader_,
      this.fillVertexShader_
    );

    this.strokeVertexShader_ = shaders.stroke && shaders.stroke.vertex;
    this.strokeFragmentShader_ = shaders.stroke && shaders.stroke.fragment;
    this.strokeProgram_ = this.helper_.getProgram(
      this.strokeFragmentShader_,
      this.strokeVertexShader_
    );

    this.symbolVertexShader_ = shaders.symbol && shaders.symbol.vertex;
    this.symbolFragmentShader_ = shaders.symbol && shaders.symbol.fragment;
    this.symbolProgram_ = this.helper_.getProgram(
      this.symbolFragmentShader_,
      this.symbolVertexShader_
    );

    this.customAttributes_ = shaders.attributes;
    this.uniforms_ = shaders.uniforms;

    const customAttributesDesc = Object.keys(this.customAttributes_).map(
      (name) => ({
        name: `a_${name}`,
        size: this.customAttributes_[name].size || 1,
        type: AttributeType.FLOAT,
      })
    );
    /**
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     * @private
     */
    this.polygonAttributesDesc_ = [
      {
        name: Attributes.POSITION,
        size: 2,
        type: AttributeType.FLOAT,
      },
      ...customAttributesDesc,
    ];
    /**
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     * @private
     */
    this.lineStringAttributesDesc_ = [
      {
        name: Attributes.SEGMENT_START,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.SEGMENT_END,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.PARAMETERS,
        size: 1,
        type: AttributeType.FLOAT,
      },
      ...customAttributesDesc,
    ];
    /**
     * @type {Array<import('../../webgl/Helper.js').AttributeDescription>}
     * @private
     */
    this.pointAttributesDesc_ = [
      {
        name: Attributes.POSITION,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.INDEX,
        size: 1,
        type: AttributeType.FLOAT,
      },
      ...customAttributesDesc,
    ];
  }

  /**
   * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @return {Promise<WebGLBuffers>} A promise resolving to WebGL buffers
   */
  async generateBuffers(geometryBatch, transform) {
    const renderInstructions = this.generateRenderInstructions_(
      geometryBatch,
      transform
    );
    const [polygonBuffers, lineStringBuffers, pointBuffers] = await Promise.all(
      [
        this.generateBuffersForType_(
          renderInstructions.polygonInstructions,
          'Polygon',
          transform
        ),
        this.generateBuffersForType_(
          renderInstructions.lineStringInstructions,
          'LineString',
          transform
        ),
        this.generateBuffersForType_(
          renderInstructions.pointInstructions,
          'Point',
          transform
        ),
      ]
    );
    // also return the inverse of the transform that was applied when generating buffers
    const invertVerticesTransform = makeInverseTransform(
      createTransform(),
      transform
    );
    return {
      polygonVerticesBuffer: polygonBuffers[0],
      polygonIndicesBuffer: polygonBuffers[1],
      lineStringVerticesBuffer: lineStringBuffers[0],
      lineStringIndicesBuffer: lineStringBuffers[1],
      pointVerticesBuffer: pointBuffers[0],
      pointIndicesBuffer: pointBuffers[1],
      invertVerticesTransform: invertVerticesTransform,
    };
  }

  /**
   * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @return {RenderInstructions} Render instructions
   * @private
   */
  generateRenderInstructions_(geometryBatch, transform) {
    const polygonInstructions = generatePolygonRenderInstructions(
      geometryBatch.polygonBatch,
      new Float32Array(0),
      this.customAttributes_,
      transform
    );
    const lineStringInstructions = generateLineStringRenderInstructions(
      geometryBatch.lineStringBatch,
      new Float32Array(0),
      this.customAttributes_,
      transform
    );
    const pointInstructions = generatePointRenderInstructions(
      geometryBatch.pointBatch,
      new Float32Array(0),
      this.customAttributes_,
      transform
    );

    return {
      polygonInstructions,
      lineStringInstructions,
      pointInstructions,
    };
  }

  /**
   * @param {Float32Array} renderInstructions Render instructions
   * @param {import("../../geom/Geometry.js").Type} geometryType Geometry type
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @return {Promise<Array<WebGLArrayBuffer>>} Vertices buffer and indices buffer
   * @private
   */
  generateBuffersForType_(renderInstructions, geometryType, transform) {
    const messageId = workerMessageCounter++;
    let messageType;
    switch (geometryType) {
      case 'Polygon':
        messageType = WebGLWorkerMessageType.GENERATE_POLYGON_BUFFERS;
        break;
      case 'LineString':
        messageType = WebGLWorkerMessageType.GENERATE_LINE_STRING_BUFFERS;
        break;
      case 'Point':
        messageType = WebGLWorkerMessageType.GENERATE_POINT_BUFFERS;
        break;
      default:
      // pass
    }

    /** @type {import('./constants.js').WebGLWorkerGenerateBuffersMessage} */
    const message = {
      id: messageId,
      type: messageType,
      renderInstructions: renderInstructions.buffer,
      renderInstructionsTransform: transform,
      customAttributesSize: getCustomAttributesSize(this.customAttributes_),
    };
    WEBGL_WORKER.postMessage(message, [renderInstructions.buffer]);

    // leave ownership of render instructions
    renderInstructions = null;

    return new Promise((resolve) => {
      /**
       * @param {*} event Event.
       */
      const handleMessage = (event) => {
        const received = event.data;

        // this is not the response to our request: skip
        if (received.id !== messageId) {
          return;
        }

        // we've received our response: stop listening
        WEBGL_WORKER.removeEventListener('message', handleMessage);

        // the helper has disposed in the meantime; the promise will not be resolved
        if (!this.helper_.getGL()) {
          return;
        }

        // copy & flush received buffers to GPU
        const verticesBuffer = new WebGLArrayBuffer(
          ARRAY_BUFFER,
          DYNAMIC_DRAW
        ).fromArrayBuffer(received.vertexBuffer);
        const indicesBuffer = new WebGLArrayBuffer(
          ELEMENT_ARRAY_BUFFER,
          DYNAMIC_DRAW
        ).fromArrayBuffer(received.indexBuffer);
        this.helper_.flushBufferData(verticesBuffer);
        this.helper_.flushBufferData(indicesBuffer);

        resolve([verticesBuffer, indicesBuffer]);
      };

      WEBGL_WORKER.addEventListener('message', handleMessage);
    });
  }

  /**
   * Render the geometries in the given buffers.
   * @param {WebGLBuffers} buffers WebGL Buffers to draw
   * @param {import("../../Map.js").FrameState} frameState Frame state
   * @param {function(): void} preRenderCallback This callback will be called right before drawing, and can be used to set uniforms
   */
  render(buffers, frameState, preRenderCallback) {
    this.renderInternal_(
      buffers.polygonIndicesBuffer,
      buffers.polygonVerticesBuffer,
      this.fillProgram_,
      this.polygonAttributesDesc_,
      frameState,
      preRenderCallback
    );
    this.renderInternal_(
      buffers.lineStringIndicesBuffer,
      buffers.lineStringVerticesBuffer,
      this.strokeProgram_,
      this.lineStringAttributesDesc_,
      frameState,
      preRenderCallback
    );
    this.renderInternal_(
      buffers.pointIndicesBuffer,
      buffers.pointVerticesBuffer,
      this.symbolProgram_,
      this.pointAttributesDesc_,
      frameState,
      preRenderCallback
    );
  }

  /**
   * @param {WebGLArrayBuffer} indicesBuffer Indices buffer
   * @param {WebGLArrayBuffer} verticesBuffer Vertices buffer
   * @param {WebGLProgram} program Program
   * @param {Array<import('../../webgl/Helper.js').AttributeDescription>} attributes Attribute descriptions
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {function(): void} preRenderCallback This callback will be called right before drawing, and can be used to set uniforms
   * @private
   */
  renderInternal_(
    indicesBuffer,
    verticesBuffer,
    program,
    attributes,
    frameState,
    preRenderCallback
  ) {
    this.helper_.useProgram(program, frameState);
    this.helper_.bindBuffer(verticesBuffer);
    this.helper_.bindBuffer(indicesBuffer);
    this.helper_.enableAttributes(attributes);
    preRenderCallback();
    const renderCount = indicesBuffer.getSize();
    this.helper_.drawElements(0, renderCount);
  }
}

export default VectorStyleRenderer;
