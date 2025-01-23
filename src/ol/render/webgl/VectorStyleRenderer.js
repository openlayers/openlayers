/**
 * @module ol/render/webgl/VectorStyleRenderer
 */
import {buildExpression, newEvaluationContext} from '../../expr/cpu.js';
import {
  BooleanType,
  computeGeometryType,
  newParsingContext,
} from '../../expr/expression.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../transform.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {AttributeType} from '../../webgl/Helper.js';
import {parseLiteralStyle} from '../../webgl/styleparser.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {WebGLWorkerMessageType} from './constants.js';
import {
  generateLineStringRenderInstructions,
  generatePointRenderInstructions,
  generatePolygonRenderInstructions,
  getCustomAttributesSize,
} from './renderinstructions.js';
import {colorEncodeId} from './utils.js';

const tmpColor = [];
/** @type {Worker|undefined} */
let WEBGL_WORKER;
function getWebGLWorker() {
  if (!WEBGL_WORKER) {
    WEBGL_WORKER = createWebGLWorker();
  }
  return WEBGL_WORKER;
}
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
  MEASURE_START: 'a_measureStart',
  MEASURE_END: 'a_measureEnd',
  PARAMETERS: 'a_parameters',
  JOIN_ANGLES: 'a_joinAngles',
  DISTANCE: 'a_distance',
};

/**
 * @typedef {Object} AttributeDefinition A description of a custom attribute to be passed on to the GPU, with a value different
 * for each feature.
 * @property {number} [size] Amount of numerical values composing the attribute, either 1, 2, 3 or 4; in case size is > 1, the return value
 * of the callback should be an array; if unspecified, assumed to be a single float value
 * @property {function(this:import("./MixedGeometryBatch.js").GeometryBatchItem, import("../../Feature").FeatureLike):number|Array<number>} callback This callback computes the numerical value of the
 * attribute for a given feature.
 */

/**
 * @typedef {Object<string, AttributeDefinition>} AttributeDefinitions
 * @typedef {Object<string, import("../../webgl/Helper").UniformValue>} UniformDefinitions
 */

/**
 * @typedef {Object} WebGLBuffers
 * @property {Array<WebGLArrayBuffer>} polygonBuffers Array containing indices and vertices buffers for polygons
 * @property {Array<WebGLArrayBuffer>} lineStringBuffers Array containing indices and vertices buffers for line strings
 * @property {Array<WebGLArrayBuffer>} pointBuffers Array containing indices and vertices buffers for points
 * @property {import("../../transform.js").Transform} invertVerticesTransform Inverse of the transform applied when generating buffers
 */

/**
 * @typedef {Object} RenderInstructions
 * @property {Float32Array|null} polygonInstructions Polygon instructions; null if nothing to render
 * @property {Float32Array|null} lineStringInstructions LineString instructions; null if nothing to render
 * @property {Float32Array|null} pointInstructions Point instructions; null if nothing to render
 */

/**
 * @typedef {Object} ShaderProgram An object containing both shaders (vertex and fragment)
 * @property {string} vertex Vertex shader source
 * @property {string} fragment Fragment shader source
 */

/**
 * @typedef {Object} AsShaders
 * @property {import("../../webgl/ShaderBuilder.js").ShaderBuilder} builder Shader builder with the appropriate presets.
 * @property {AttributeDefinitions} [attributes] Custom attributes made available in the vertex shaders.
 * Default shaders rely on the attributes in {@link Attributes}.
 * @property {UniformDefinitions} [uniforms] Additional uniforms usable in shaders.
 */

/**
 * @typedef {Object} AsRule
 * @property {import('../../style/flat.js').FlatStyle} style Style
 * @property {import("../../expr/expression.js").EncodedExpression} [filter] Filter
 */

/**
 * @typedef {AsRule|AsShaders} VectorStyle
 */

/**
 * @classdesc This class is responsible for:
 * 1. generate WebGL buffers according to a provided style, using a MixedGeometryBatch as input
 * 2. rendering geometries contained in said buffers
 *
 * A layer renderer will typically maintain several of these in order to have several styles rendered separately.
 *
 * A VectorStyleRenderer instance can be created either from a literal style or from shaders using either
 * `VectorStyleRenderer.fromStyle` or `VectorStyleRenderer.fromShaders`. The shaders should not be provided explicitly
 * but instead as a preconfigured ShaderBuilder instance.
 *
 * The `generateBuffers` method returns a promise resolving to WebGL buffers that are intended to be rendered by the
 * same renderer.
 */
class VectorStyleRenderer {
  /**
   * @param {VectorStyle} styleOrShaders Literal style or custom shaders
   * @param {import('../../style/flat.js').StyleVariables} variables Style variables
   * @param {import('../../webgl/Helper.js').default} helper Helper
   * @param {boolean} [enableHitDetection] Whether to enable the hit detection (needs compatible shader)
   * @param {import("../../expr/expression.js").ExpressionValue} [filter] Optional filter expression
   */
  constructor(styleOrShaders, variables, helper, enableHitDetection, filter) {
    /**
     * @private
     * @type {import('../../webgl/Helper.js').default}
     */
    this.helper_;

    /**
     * @private
     */
    this.hitDetectionEnabled_ = !!enableHitDetection;

    let asShaders = /** @type {AsShaders} */ (styleOrShaders);
    const isShaders = 'builder' in styleOrShaders;
    if (!isShaders) {
      const asRule = /** @type {AsRule} */ (styleOrShaders);
      const parseResult = parseLiteralStyle(
        asRule.style,
        variables,
        asRule.filter,
      );
      asShaders = {
        builder: parseResult.builder,
        attributes: parseResult.attributes,
        uniforms: parseResult.uniforms,
      };
    }

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.fillProgram_;

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.strokeProgram_;

    /**
     * @private
     * @type {WebGLProgram}
     */
    this.symbolProgram_;

    /**
     * @type {boolean}
     * @private
     */
    this.hasFill_ = !!asShaders.builder.getFillVertexShader();
    if (this.hasFill_) {
      /**
       * @private
       */
      this.fillVertexShader_ = asShaders.builder.getFillVertexShader();
      /**
       * @private
       */
      this.fillFragmentShader_ = asShaders.builder.getFillFragmentShader();
    }

    /**
     * @type {boolean}
     * @private
     */
    this.hasStroke_ = !!asShaders.builder.getStrokeVertexShader();
    if (this.hasStroke_) {
      /**
       * @private
       */
      this.strokeVertexShader_ = asShaders.builder.getStrokeVertexShader();
      /**
       * @private
       */
      this.strokeFragmentShader_ = asShaders.builder.getStrokeFragmentShader();
    }

    /**
     * @type {boolean}
     * @private
     */
    this.hasSymbol_ = !!asShaders.builder.getSymbolVertexShader();
    if (this.hasSymbol_) {
      /**
       * @private
       */
      this.symbolVertexShader_ = asShaders.builder.getSymbolVertexShader();
      /**
       * @private
       */
      this.symbolFragmentShader_ = asShaders.builder.getSymbolFragmentShader();
    }

    /**
     * @type {function(import('../../Feature.js').FeatureLike): boolean}
     * @private
     */
    this.featureFilter_ = null;
    if (filter) {
      this.featureFilter_ = this.computeFeatureFilter(filter);
    }

    const hitDetectionAttributes = this.hitDetectionEnabled_
      ? {
          hitColor: {
            callback() {
              return colorEncodeId(this.ref, tmpColor);
            },
            size: 4,
          },
        }
      : {};

    /**
     * @private
     */
    this.customAttributes_ = Object.assign(
      {},
      hitDetectionAttributes,
      asShaders.attributes,
    );
    /**
     * @private
     */
    this.uniforms_ = asShaders.uniforms;

    const customAttributesDesc = Object.entries(this.customAttributes_).map(
      ([name, value]) => ({
        name: `a_${name}`,
        size: value.size || 1,
        type: AttributeType.FLOAT,
      }),
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
        name: Attributes.MEASURE_START,
        size: 1,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.SEGMENT_END,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.MEASURE_END,
        size: 1,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.JOIN_ANGLES,
        size: 2,
        type: AttributeType.FLOAT,
      },
      {
        name: Attributes.DISTANCE,
        size: 1,
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

    this.setHelper(helper);
  }

  /**
   * Will apply the style filter when generating geometry batches (if it can be evaluated outside a map context)
   * @param {import("../../expr/expression.js").ExpressionValue} filter Style filter
   * @return {function(import('../../Feature.js').FeatureLike): boolean} Feature filter
   * @private
   */
  computeFeatureFilter(filter) {
    const parsingContext = newParsingContext();
    /**
     * @type {import('../../expr/cpu.js').ExpressionEvaluator}
     */
    let compiled;
    try {
      compiled = buildExpression(filter, BooleanType, parsingContext);
    } catch {
      // filter expression failed to compile for CPU: ignore it
      return null;
    }

    // do not apply the filter if it depends on map state (e.g. zoom level) or any variable
    if (parsingContext.mapState || parsingContext.variables.size > 0) {
      return null;
    }

    const evalContext = newEvaluationContext();
    return (feature) => {
      evalContext.properties = feature.getPropertiesInternal();
      if (parsingContext.featureId) {
        const id = feature.getId();
        if (id !== undefined) {
          evalContext.featureId = id;
        } else {
          evalContext.featureId = null;
        }
      }
      evalContext.geometryType = computeGeometryType(feature.getGeometry());
      return /** @type {boolean} */ (compiled(evalContext));
    };
  }

  /**
   * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @return {Promise<WebGLBuffers|null>} A promise resolving to WebGL buffers; returns null if buffers are empty
   */
  async generateBuffers(geometryBatch, transform) {
    let filteredBatch = geometryBatch;
    if (this.featureFilter_) {
      filteredBatch = filteredBatch.filter(this.featureFilter_);
      if (filteredBatch.isEmpty()) {
        return null;
      }
    }
    const renderInstructions = this.generateRenderInstructions_(
      filteredBatch,
      transform,
    );
    const [polygonBuffers, lineStringBuffers, pointBuffers] = await Promise.all(
      [
        this.generateBuffersForType_(
          renderInstructions.polygonInstructions,
          'Polygon',
          transform,
        ),
        this.generateBuffersForType_(
          renderInstructions.lineStringInstructions,
          'LineString',
          transform,
        ),
        this.generateBuffersForType_(
          renderInstructions.pointInstructions,
          'Point',
          transform,
        ),
      ],
    );
    // also return the inverse of the transform that was applied when generating buffers
    const invertVerticesTransform = makeInverseTransform(
      createTransform(),
      transform,
    );
    return {
      polygonBuffers: polygonBuffers,
      lineStringBuffers: lineStringBuffers,
      pointBuffers: pointBuffers,
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
    const polygonInstructions = this.hasFill_
      ? generatePolygonRenderInstructions(
          geometryBatch.polygonBatch,
          new Float32Array(0),
          this.customAttributes_,
          transform,
        )
      : null;
    const lineStringInstructions = this.hasStroke_
      ? generateLineStringRenderInstructions(
          geometryBatch.lineStringBatch,
          new Float32Array(0),
          this.customAttributes_,
          transform,
        )
      : null;
    const pointInstructions = this.hasSymbol_
      ? generatePointRenderInstructions(
          geometryBatch.pointBatch,
          new Float32Array(0),
          this.customAttributes_,
          transform,
        )
      : null;

    return {
      polygonInstructions,
      lineStringInstructions,
      pointInstructions,
    };
  }

  /**
   * @param {Float32Array|null} renderInstructions Render instructions
   * @param {import("../../geom/Geometry.js").Type} geometryType Geometry type
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @return {Promise<Array<WebGLArrayBuffer>>|null} Indices buffer and vertices buffer; null if nothing to render
   * @private
   */
  generateBuffersForType_(renderInstructions, geometryType, transform) {
    if (renderInstructions === null) {
      return null;
    }

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
    const WEBGL_WORKER = getWebGLWorker();
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
          DYNAMIC_DRAW,
        ).fromArrayBuffer(received.vertexBuffer);
        const indicesBuffer = new WebGLArrayBuffer(
          ELEMENT_ARRAY_BUFFER,
          DYNAMIC_DRAW,
        ).fromArrayBuffer(received.indexBuffer);
        this.helper_.flushBufferData(verticesBuffer);
        this.helper_.flushBufferData(indicesBuffer);

        resolve([indicesBuffer, verticesBuffer]);
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
    this.hasFill_ &&
      this.renderInternal_(
        buffers.polygonBuffers[0],
        buffers.polygonBuffers[1],
        this.fillProgram_,
        this.polygonAttributesDesc_,
        frameState,
        preRenderCallback,
      );
    this.hasStroke_ &&
      this.renderInternal_(
        buffers.lineStringBuffers[0],
        buffers.lineStringBuffers[1],
        this.strokeProgram_,
        this.lineStringAttributesDesc_,
        frameState,
        preRenderCallback,
      );
    this.hasSymbol_ &&
      this.renderInternal_(
        buffers.pointBuffers[0],
        buffers.pointBuffers[1],
        this.symbolProgram_,
        this.pointAttributesDesc_,
        frameState,
        preRenderCallback,
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
    preRenderCallback,
  ) {
    const renderCount = indicesBuffer.getSize();
    if (renderCount === 0) {
      return;
    }
    this.helper_.useProgram(program, frameState);
    this.helper_.bindBuffer(verticesBuffer);
    this.helper_.bindBuffer(indicesBuffer);
    this.helper_.enableAttributes(attributes);
    preRenderCallback();
    this.helper_.drawElements(0, renderCount);
  }

  /**
   * @param {import('../../webgl/Helper.js').default} helper Helper
   * @param {WebGLBuffers} buffers WebGL Buffers to reload if any
   */
  setHelper(helper, buffers = null) {
    this.helper_ = helper;

    if (this.hasFill_) {
      this.fillProgram_ = this.helper_.getProgram(
        this.fillFragmentShader_,
        this.fillVertexShader_,
      );
    }
    if (this.hasStroke_) {
      this.strokeProgram_ = this.helper_.getProgram(
        this.strokeFragmentShader_,
        this.strokeVertexShader_,
      );
    }
    if (this.hasSymbol_) {
      this.symbolProgram_ = this.helper_.getProgram(
        this.symbolFragmentShader_,
        this.symbolVertexShader_,
      );
    }
    this.helper_.addUniforms(this.uniforms_);

    if (buffers) {
      if (buffers.polygonBuffers) {
        this.helper_.flushBufferData(buffers.polygonBuffers[0]);
        this.helper_.flushBufferData(buffers.polygonBuffers[1]);
      }
      if (buffers.lineStringBuffers) {
        this.helper_.flushBufferData(buffers.lineStringBuffers[0]);
        this.helper_.flushBufferData(buffers.lineStringBuffers[1]);
      }
      if (buffers.pointBuffers) {
        this.helper_.flushBufferData(buffers.pointBuffers[0]);
        this.helper_.flushBufferData(buffers.pointBuffers[1]);
      }
    }
  }
}

export default VectorStyleRenderer;
