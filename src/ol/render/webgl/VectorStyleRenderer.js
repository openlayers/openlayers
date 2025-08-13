/**
 * @module ol/render/webgl/VectorStyleRenderer
 */
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../transform.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {AttributeType} from '../../webgl/Helper.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {WebGLWorkerMessageType} from './constants.js';
import {colorEncodeIdAndPack} from './encodeUtil.js';
import {
  generateLineStringRenderInstructions,
  generatePointRenderInstructions,
  generatePolygonRenderInstructions,
  getCustomAttributesSize,
} from './renderinstructions.js';
import {parseLiteralStyle} from './style.js';

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
  LOCAL_POSITION: 'a_localPosition',
  SEGMENT_START: 'a_segmentStart',
  SEGMENT_END: 'a_segmentEnd',
  MEASURE_START: 'a_measureStart',
  MEASURE_END: 'a_measureEnd',
  ANGLE_TANGENT_SUM: 'a_angleTangentSum',
  JOIN_ANGLES: 'a_joinAngles',
  DISTANCE_LOW: 'a_distanceLow',
  DISTANCE_HIGH: 'a_distanceHigh',
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
 * @typedef {Array<WebGLArrayBuffer>} WebGLArrayBufferSet Buffers organized like so: [indicesBuffer, vertexAttributesBuffer, instanceAttributesBuffer]
 */

/**
 * @typedef {Object} WebGLBuffers
 * @property {WebGLArrayBufferSet} polygonBuffers Array containing indices and vertices buffers for polygons
 * @property {WebGLArrayBufferSet} lineStringBuffers Array containing indices and vertices buffers for line strings
 * @property {WebGLArrayBufferSet} pointBuffers Array containing indices and vertices buffers for points
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
 * @typedef {import('./style.js').StyleParseResult} StyleShaders
 */

/**
 * @typedef {import('../../style/flat.js').FlatStyleLike} FlatStyleLike
 */
/**
 * @typedef {import('../../style/flat.js').FlatStyle} FlatStyle
 */
/**
 * @typedef {import('../../style/flat.js').Rule} FlatStyleRule
 */

/**
 * @typedef {Object} SubRenderPass
 * @property {string} vertexShader Vertex shader
 * @property {string} fragmentShader Fragment shader
 * @property {Array<import('../../webgl/Helper.js').AttributeDescription>} attributesDesc Attributes description, defined for each primitive vertex
 * @property {Array<import('../../webgl/Helper.js').AttributeDescription>} instancedAttributesDesc Attributes description, defined once per primitive
 * @property {number} instancePrimitiveVertexCount Number of vertices per instance primitive in this render pass
 * @property {WebGLProgram} [program] Program; this has to be recreated if the helper is lost/changed
 */

/**
 * @typedef {Object} RenderPass
 * @property {SubRenderPass} [fillRenderPass] Fill render pass; undefined if no fill in pass
 * @property {SubRenderPass} [strokeRenderPass] Stroke render pass; undefined if no stroke in pass
 * @property {SubRenderPass} [symbolRenderPass] Symbol render pass; undefined if no symbol in pass
 */

/**
 * @classdesc This class is responsible for:
 * 1. generating WebGL buffers according to a provided style, using a MixedGeometryBatch as input
 * 2. rendering geometries contained in said buffers
 *
 * A VectorStyleRenderer instance can be created either from a literal style or from shaders.
 * The shaders should not be provided explicitly but instead as a preconfigured ShaderBuilder instance.
 *
 * The `generateBuffers` method returns a promise resolving to WebGL buffers that are intended to be rendered by the
 * same renderer.
 */
class VectorStyleRenderer {
  /**
   * @param {FlatStyleLike|StyleShaders|Array<StyleShaders>} styles Vector styles expressed as flat styles, flat style rules or style shaders
   * @param {import('../../style/flat.js').StyleVariables} variables Style variables
   * @param {import('../../webgl/Helper.js').default} helper Helper
   * @param {boolean} [enableHitDetection] Whether to enable the hit detection (needs compatible shader)
   */
  constructor(styles, variables, helper, enableHitDetection) {
    /**
     * @private
     * @type {import('../../webgl/Helper.js').default}
     */
    this.helper_;

    /**
     * @private
     */
    this.hitDetectionEnabled_ = !!enableHitDetection;

    /**
     * @type {Array<StyleShaders>}
     * @private
     */
    this.styleShaders = convertStyleToShaders(styles, variables);

    /**
     * @type {AttributeDefinitions}
     * @private
     */
    this.customAttributes_ = {};

    /**
     @type {UniformDefinitions}
     * @private
     */
    this.uniforms_ = {};

    // add hit detection attribute if enabled
    if (this.hitDetectionEnabled_) {
      this.customAttributes_['hitColor'] = {
        callback() {
          return colorEncodeIdAndPack(this.ref, tmpColor);
        },
        size: 2,
      };
    }

    // add attributes & uniforms coming from all shaders
    for (const styleShader of this.styleShaders) {
      for (const attributeName in styleShader.attributes) {
        if (attributeName in this.customAttributes_) {
          // already defined: skip
          continue;
        }
        this.customAttributes_[attributeName] =
          styleShader.attributes[attributeName];
      }
      for (const uniformName in styleShader.uniforms) {
        if (uniformName in this.uniforms_) {
          // already defined: skip
          continue;
        }
        this.uniforms_[uniformName] = styleShader.uniforms[uniformName];
      }
    }

    // create a render pass for each shader
    /**
     * @type {Array<RenderPass>}
     * @private
     */
    this.renderPasses_ = this.styleShaders.map((styleShader) => {
      /** @type {RenderPass} */
      const renderPass = {};

      const customAttributesDesc = Object.entries(this.customAttributes_).map(
        ([name, value]) => {
          const isUsed = name in styleShader.attributes || name === 'hitColor';
          return {
            name: isUsed ? `a_${name}` : null, // giving a null name means this is only used for "spacing" in between attributes
            size: value.size || 1,
            type: AttributeType.FLOAT,
          };
        },
      );

      // set up each subpass
      if (styleShader.builder.getFillVertexShader()) {
        renderPass.fillRenderPass = {
          vertexShader: styleShader.builder.getFillVertexShader(),
          fragmentShader: styleShader.builder.getFillFragmentShader(),
          attributesDesc: [
            {
              name: Attributes.POSITION,
              size: 2,
              type: AttributeType.FLOAT,
            },
            ...customAttributesDesc,
          ],
          instancedAttributesDesc: [], // no instanced rendering for polygons
          instancePrimitiveVertexCount: 3,
        };
      }
      if (styleShader.builder.getStrokeVertexShader()) {
        renderPass.strokeRenderPass = {
          vertexShader: styleShader.builder.getStrokeVertexShader(),
          fragmentShader: styleShader.builder.getStrokeFragmentShader(),
          attributesDesc: [
            {
              name: Attributes.LOCAL_POSITION,
              size: 2,
              type: AttributeType.FLOAT,
            },
          ],
          instancedAttributesDesc: [
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
              name: Attributes.DISTANCE_LOW,
              size: 1,
              type: AttributeType.FLOAT,
            },
            {
              name: Attributes.DISTANCE_HIGH,
              size: 1,
              type: AttributeType.FLOAT,
            },
            {
              name: Attributes.ANGLE_TANGENT_SUM,
              size: 1,
              type: AttributeType.FLOAT,
            },
            ...customAttributesDesc,
          ],
          instancePrimitiveVertexCount: 6,
        };
      }
      if (styleShader.builder.getSymbolVertexShader()) {
        renderPass.symbolRenderPass = {
          vertexShader: styleShader.builder.getSymbolVertexShader(),
          fragmentShader: styleShader.builder.getSymbolFragmentShader(),
          attributesDesc: [
            {
              name: Attributes.LOCAL_POSITION,
              size: 2,
              type: AttributeType.FLOAT,
            },
          ],
          instancedAttributesDesc: [
            {
              name: Attributes.POSITION,
              size: 2,
              type: AttributeType.FLOAT,
            },
            ...customAttributesDesc,
          ],
          instancePrimitiveVertexCount: 6,
        };
      }
      return renderPass;
    });

    this.hasFill_ = this.renderPasses_.some((pass) => pass.fillRenderPass);
    this.hasStroke_ = this.renderPasses_.some((pass) => pass.strokeRenderPass);
    this.hasSymbol_ = this.renderPasses_.some((pass) => pass.symbolRenderPass);

    // this will initialize render passes with the given helper
    this.setHelper(helper);
  }

  /**
   * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @return {Promise<WebGLBuffers|null>} A promise resolving to WebGL buffers; returns null if buffers are empty
   */
  async generateBuffers(geometryBatch, transform) {
    if (geometryBatch.isEmpty()) {
      return null;
    }
    const renderInstructions = this.generateRenderInstructions_(
      geometryBatch,
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
   * @return {Promise<WebGLArrayBufferSet>|null} Indices buffer and vertices buffer; null if nothing to render
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
       * @param {{data: import('./constants.js').WebGLWorkerGenerateBuffersMessage}} event Event.
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
        const indicesBuffer = new WebGLArrayBuffer(
          ELEMENT_ARRAY_BUFFER,
          DYNAMIC_DRAW,
        ).fromArrayBuffer(received.indicesBuffer);
        const vertexAttributesBuffer = new WebGLArrayBuffer(
          ARRAY_BUFFER,
          DYNAMIC_DRAW,
        ).fromArrayBuffer(received.vertexAttributesBuffer);
        const instanceAttributesBuffer = new WebGLArrayBuffer(
          ARRAY_BUFFER,
          DYNAMIC_DRAW,
        ).fromArrayBuffer(received.instanceAttributesBuffer);
        this.helper_.flushBufferData(indicesBuffer);
        this.helper_.flushBufferData(vertexAttributesBuffer);
        this.helper_.flushBufferData(instanceAttributesBuffer);

        resolve([
          indicesBuffer,
          vertexAttributesBuffer,
          instanceAttributesBuffer,
        ]);
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
    for (const renderPass of this.renderPasses_) {
      renderPass.fillRenderPass &&
        this.renderInternal_(
          buffers.polygonBuffers[0],
          buffers.polygonBuffers[1],
          buffers.polygonBuffers[2],
          renderPass.fillRenderPass,
          frameState,
          preRenderCallback,
        );
      renderPass.strokeRenderPass &&
        this.renderInternal_(
          buffers.lineStringBuffers[0],
          buffers.lineStringBuffers[1],
          buffers.lineStringBuffers[2],
          renderPass.strokeRenderPass,
          frameState,
          preRenderCallback,
        );
      renderPass.symbolRenderPass &&
        this.renderInternal_(
          buffers.pointBuffers[0],
          buffers.pointBuffers[1],
          buffers.pointBuffers[2],
          renderPass.symbolRenderPass,
          frameState,
          preRenderCallback,
        );
    }
  }

  /**
   * @param {WebGLArrayBuffer} indicesBuffer Indices buffer
   * @param {WebGLArrayBuffer} vertexAttributesBuffer Vertex attributes buffer
   * @param {WebGLArrayBuffer} instanceAttributesBuffer Instance attributes buffer
   * @param {SubRenderPass} subRenderPass Render pass (program, attributes, etc.) specific to one geometry type
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {function(): void} preRenderCallback This callback will be called right before drawing, and can be used to set uniforms
   * @private
   */
  renderInternal_(
    indicesBuffer,
    vertexAttributesBuffer,
    instanceAttributesBuffer,
    subRenderPass,
    frameState,
    preRenderCallback,
  ) {
    const renderCount = indicesBuffer.getSize();
    if (renderCount === 0) {
      return;
    }

    const usesInstancedRendering = subRenderPass.instancedAttributesDesc.length;

    this.helper_.useProgram(subRenderPass.program, frameState);
    this.helper_.bindBuffer(vertexAttributesBuffer);
    this.helper_.bindBuffer(indicesBuffer);
    this.helper_.enableAttributes(subRenderPass.attributesDesc);
    this.helper_.bindBuffer(instanceAttributesBuffer);
    this.helper_.enableAttributesInstanced(
      subRenderPass.instancedAttributesDesc,
    );

    preRenderCallback();

    if (usesInstancedRendering) {
      const instanceAttributesStride =
        subRenderPass.instancedAttributesDesc.reduce(
          (prev, curr) => prev + (curr.size || 1),
          0,
        );
      const instanceCount =
        instanceAttributesBuffer.getSize() / instanceAttributesStride;

      this.helper_.drawElementsInstanced(0, renderCount, instanceCount);
    } else {
      this.helper_.drawElements(0, renderCount);
    }
  }

  /**
   * @param {import('../../webgl/Helper.js').default} helper Helper
   * @param {WebGLBuffers} buffers WebGL Buffers to reload if any
   */
  setHelper(helper, buffers = null) {
    this.helper_ = helper;

    for (const renderPass of this.renderPasses_) {
      if (renderPass.fillRenderPass) {
        renderPass.fillRenderPass.program = this.helper_.getProgram(
          renderPass.fillRenderPass.fragmentShader,
          renderPass.fillRenderPass.vertexShader,
        );
      }
      if (renderPass.strokeRenderPass) {
        renderPass.strokeRenderPass.program = this.helper_.getProgram(
          renderPass.strokeRenderPass.fragmentShader,
          renderPass.strokeRenderPass.vertexShader,
        );
      }
      if (renderPass.symbolRenderPass) {
        renderPass.symbolRenderPass.program = this.helper_.getProgram(
          renderPass.symbolRenderPass.fragmentShader,
          renderPass.symbolRenderPass.vertexShader,
        );
      }
    }
    this.helper_.addUniforms(this.uniforms_);

    if (buffers) {
      if (buffers.polygonBuffers) {
        this.helper_.flushBufferData(buffers.polygonBuffers[0]);
        this.helper_.flushBufferData(buffers.polygonBuffers[1]);
        this.helper_.flushBufferData(buffers.polygonBuffers[2]);
      }
      if (buffers.lineStringBuffers) {
        this.helper_.flushBufferData(buffers.lineStringBuffers[0]);
        this.helper_.flushBufferData(buffers.lineStringBuffers[1]);
        this.helper_.flushBufferData(buffers.lineStringBuffers[2]);
      }
      if (buffers.pointBuffers) {
        this.helper_.flushBufferData(buffers.pointBuffers[0]);
        this.helper_.flushBufferData(buffers.pointBuffers[1]);
        this.helper_.flushBufferData(buffers.pointBuffers[2]);
      }
    }
  }
}

export default VectorStyleRenderer;

/**
 * Breaks down a vector style into an array of prebuilt shader builders with attributes and uniforms
 * @param {FlatStyleLike|StyleShaders|Array<StyleShaders>} style Vector style
 * @param {import('../../style/flat.js').StyleVariables} variables Style variables
 * @return {Array<StyleShaders>} Array of style shaders
 */
export function convertStyleToShaders(style, variables) {
  // possible cases:
  // - single shader
  // - multiple shaders
  // - single style
  // - multiple styles
  // - multiple rules
  const asArray = Array.isArray(style) ? style : [style];

  // if array of rules: break rules into separate styles, compute "else" filters
  if ('style' in asArray[0]) {
    /** @type {Array<StyleShaders>} */
    const shaders = [];
    const rules = /** @type {Array<FlatStyleRule>} */ (asArray);
    const previousFilters = [];
    for (const rule of rules) {
      /** @type {Array<FlatStyle>} */
      const ruleStyles = Array.isArray(rule.style) ? rule.style : [rule.style];
      /** @type {import("../../expr/expression.js").EncodedExpression} */
      let currentFilter = rule.filter;
      if (rule.else && previousFilters.length) {
        currentFilter = [
          'all',
          ...previousFilters.map((filter) => ['!', filter]),
        ];
        if (rule.filter) {
          currentFilter.push(rule.filter);
        }
        if (currentFilter.length < 3) {
          currentFilter = currentFilter[1];
        }
      }
      if (rule.filter) {
        previousFilters.push(rule.filter);
      }
      // parse each style and convert to shader
      const styleShaders = ruleStyles.map((style) =>
        parseLiteralStyle(style, variables, currentFilter),
      );
      shaders.push(...styleShaders);
    }
    return shaders;
  }

  // if array of shaders: return as is
  if ('builder' in asArray[0]) {
    return /** @type {Array<StyleShaders>} */ (asArray);
  }

  // array of flat styles: simply convert to shaders
  return /** @type {Array<FlatStyle>} */ (asArray).map((style) =>
    parseLiteralStyle(style, variables, null),
  );
}
