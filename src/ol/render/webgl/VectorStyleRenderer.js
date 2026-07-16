/**
 * @module ol/render/webgl/VectorStyleRenderer
 */
import Disposable from '../../Disposable.js';
import {createCanvasContext2D} from '../../dom.js';
import {
  create as createTransform,
  makeInverse as makeInverseTransform,
} from '../../transform.js';
import {ARRAY_BUFFER, DYNAMIC_DRAW, ELEMENT_ARRAY_BUFFER} from '../../webgl.js';
import WebGLArrayBuffer from '../../webgl/Buffer.js';
import {AttributeType} from '../../webgl/Helper.js';
import LabelsArray from '../../webgl/LabelsArray.js';
import {create as createTextOverlayWorker} from '../../worker/textOverlay.js';
import {create as createWebGLWorker} from '../../worker/webgl.js';
import {
  TextOverlayWorkerMessageType,
  WebGLWorkerMessageType,
} from './constants.js';
import {colorEncodeIdAndPack} from './encodeUtil.js';
import {
  generateLineStringRenderInstructions,
  generatePointRenderInstructions,
  generatePolygonRenderInstructions,
  getCustomAttributesSize,
} from './renderinstructions.js';
import {serializeFrameState} from './serialize.js';
import {parseLiteralStyle} from './style.js';
import {hasTextStyle} from './textUtil.js';

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
 *
 * @param {Worker} worker Worker to send the message to
 * @param {Object} message Message
 * @param {Array<Transferable>} [transferables] Transferables
 * @return {Promise<Object>} Response received by the worker
 */
function messageWorker(worker, message, transferables) {
  const messageId = workerMessageCounter++;

  if (transferables) {
    worker.postMessage({...message, id: messageId}, transferables);
  } else {
    worker.postMessage({...message, id: messageId});
  }

  return new Promise((resolve) => {
    const handleMessage = (event) => {
      const received = event.data;

      // this is not the response to our request: skip
      if (received.id !== messageId) {
        return;
      }

      // we've received our response: stop listening
      worker.removeEventListener('message', handleMessage);

      resolve(received);
    };

    worker.addEventListener('message', handleMessage);
  });
}

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
 * @property {function(this:import("./MixedGeometryBatch.js").GeometryBatchItem, import("../../Feature.js").FeatureLike):number|Array<number>} callback This callback computes the numerical value of the
 * attribute for a given feature.
 */

/**
 * @typedef {Object<string, AttributeDefinition>} AttributeDefinitions
 * @typedef {Object<string, import("../../webgl/Helper.js").UniformValue>} UniformDefinitions
 */

/**
 * @typedef {Array<WebGLArrayBuffer>} WebGLArrayBufferSet Buffers organized like so: [indicesBuffer, vertexAttributesBuffer, instanceAttributesBuffer]
 */

/**
 * @typedef {Object} WebGLBuffers
 * Anything set to null means there's nothing to render for that category.
 * @property {WebGLArrayBufferSet|null} polygonBuffers Array containing indices and vertices buffers for polygons
 * @property {WebGLArrayBufferSet|null} lineStringBuffers Array containing indices and vertices buffers for line strings
 * @property {WebGLArrayBufferSet|null} pointBuffers Array containing indices and vertices buffers for points
 * @property {string|null} textInstructionsKey Key corresponding to a text instructions set
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
class VectorStyleRenderer extends Disposable {
  /**
   * @param {FlatStyleLike|StyleShaders|Array<StyleShaders>} styles Vector styles expressed as flat styles, flat style rules or style shaders
   * @param {import('../../style/flat.js').StyleVariables} variables Style variables
   * @param {import('../../webgl/Helper.js').default} helper Helper
   * @param {boolean} [enableHitDetection] Whether to enable the hit detection (needs compatible shader)
   */
  constructor(styles, variables, helper, enableHitDetection) {
    super();

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
     * Flat style like; if shaders are given as input, will use the `sourceRule` property of the shaders
     * `null` if no Flat style equivalent is available (e.g. custom-made shaders); in that case no text rendering will happen
     * @type {FlatStyleLike|null}
     */
    this.flatStyle = toFlatStyleLike(styles);

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
    this.hasText_ = this.flatStyle && hasTextStyle(this.flatStyle);

    if (this.hasText_) {
      /**
       * @private
       */
      this.textOverlayCanvas_ = /** @type {HTMLCanvasElement} */ (
        createCanvasContext2D().canvas
      );

      /**
       * @private
       */
      this.textOverlayContext_ = this.textOverlayCanvas_.getContext('2d');

      /**
       * @type {import("../../Map.js").FrameState}
       * @private
       */
      this.textOverlayRenderFrameState_ = null;

      /**
       * @type {Worker}
       * @private
       */
      this.textOverlayWorker_ = createTextOverlayWorker();

      /** @type {Set<string>} */
      this.textOverlayRenderList_ = new Set();
    }

    // this will initialize render passes with the given helper
    this.setHelper(helper);
  }

  /**
   * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @param {number} resolution View resolution; used for text render instructions if any
   * @return {Promise<WebGLBuffers>} A promise resolving to WebGL buffers; buffer sets are set to `null` if nothing to render
   */
  async generateBuffers(geometryBatch, transform, resolution) {
    // also return the inverse of the transform that was applied when generating buffers
    const invertVerticesTransform = makeInverseTransform(
      createTransform(),
      transform,
    );

    if (geometryBatch.isEmpty()) {
      return {
        polygonBuffers: null,
        lineStringBuffers: null,
        pointBuffers: null,
        invertVerticesTransform: invertVerticesTransform,
        textInstructionsKey: null,
      };
    }
    const labelsArray = new LabelsArray();
    const renderInstructions = this.generateRenderInstructions_(
      geometryBatch,
      labelsArray,
      transform,
    );
    const [
      textInstructionsKey,
      polygonBuffers,
      lineStringBuffers,
      pointBuffers,
    ] = await Promise.all([
      this.hasText_
        ? this.generateTextInstructions_(
            renderInstructions,
            labelsArray,
            transform,
            resolution,
          )
        : null,
      this.hasFill_
        ? this.generateBuffersForType_(
            renderInstructions.polygonInstructions,
            'Polygon',
            transform,
          )
        : null,
      this.hasStroke_
        ? this.generateBuffersForType_(
            renderInstructions.lineStringInstructions,
            'LineString',
            transform,
          )
        : null,
      this.hasSymbol_
        ? this.generateBuffersForType_(
            renderInstructions.pointInstructions,
            'Point',
            transform,
          )
        : null,
    ]);
    return {
      polygonBuffers: polygonBuffers,
      lineStringBuffers: lineStringBuffers,
      pointBuffers: pointBuffers,
      invertVerticesTransform: invertVerticesTransform,
      textInstructionsKey,
    };
  }

  /**
   * @param {import('./MixedGeometryBatch.js').default} geometryBatch Geometry batch
   * @param {LabelsArray} labelsArray Labels array
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @return {RenderInstructions} Render instructions
   * @private
   */
  generateRenderInstructions_(geometryBatch, labelsArray, transform) {
    const polygonInstructions =
      this.hasFill_ || this.hasText_ // if we do text rendering we need render instructions for all geometry types
        ? generatePolygonRenderInstructions(
            geometryBatch.polygonBatch,
            new Float32Array(0),
            labelsArray,
            this.customAttributes_,
            transform,
          )
        : null;
    const lineStringInstructions =
      this.hasStroke_ || this.hasText_
        ? generateLineStringRenderInstructions(
            geometryBatch.lineStringBatch,
            new Float32Array(0),
            labelsArray,
            this.customAttributes_,
            transform,
          )
        : null;
    const pointInstructions =
      this.hasSymbol_ || this.hasText_
        ? generatePointRenderInstructions(
            geometryBatch.pointBatch,
            new Float32Array(0),
            labelsArray,
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
      type: messageType,
      renderInstructions: renderInstructions.buffer,
      renderInstructionsTransform: transform,
      customAttributesSize: getCustomAttributesSize(this.customAttributes_),
    };

    return messageWorker(getWebGLWorker(), message, [
      renderInstructions.buffer,
    ]).then((data) => {
      // the helper has disposed in the meantime; the promise will not be resolved
      if (!this.helper_.getGL()) {
        return;
      }

      const received =
        /** @type {import('./constants.js').WebGLWorkerGenerateBuffersMessage} */ (
          data
        );

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

      return [indicesBuffer, vertexAttributesBuffer, instanceAttributesBuffer];
    });
  }

  /**
   * @param {RenderInstructions} renderInstructions Render instructions
   * @param {import('../../webgl/LabelsArray.js').default} labelsArray Labels array
   * @param {import("../../transform.js").Transform} transform Transform to apply to coordinates
   * @param {number} resolution View resolution to be used as a basis when computing text overflow
   * @return {Promise<string>|null} Resolves to a key corresponding to the text draw instructions; null if no text to render
   * @private
   */
  generateTextInstructions_(
    renderInstructions,
    labelsArray,
    transform,
    resolution,
  ) {
    const transferables = [labelsArray.getArray().buffer];
    let polygonRenderInstructions = null;
    let lineStringRenderInstructions = null;
    let pointRenderInstructions = null;
    if (renderInstructions.polygonInstructions) {
      polygonRenderInstructions = new Float32Array(
        renderInstructions.polygonInstructions,
      ).buffer;
      transferables.push(polygonRenderInstructions);
    }
    if (renderInstructions.lineStringInstructions) {
      lineStringRenderInstructions = new Float32Array(
        renderInstructions.lineStringInstructions,
      ).buffer;
      transferables.push(lineStringRenderInstructions);
    }
    if (renderInstructions.pointInstructions) {
      pointRenderInstructions = new Float32Array(
        renderInstructions.pointInstructions,
      ).buffer;
      transferables.push(pointRenderInstructions);
    }
    const customAttributesSizes = Object.keys(this.customAttributes_).reduce(
      (prev, curr) => ({
        ...prev,
        [curr]: this.customAttributes_[curr].size || 1,
      }),
      {},
    );

    // load render instructions in text overlay worker
    /** @type {import('./constants.js').TextOverlayWorkerMessage} */
    const message = {
      type: TextOverlayWorkerMessageType.BUILD_INSTRUCTIONS,
      polygonRenderInstructions,
      lineStringRenderInstructions,
      pointRenderInstructions,
      labelsArray: labelsArray.getArray(),
      style: this.flatStyle,
      customAttributesSizes,
      renderInstructionsTransform: transform,
      resolution,
    };

    return messageWorker(this.textOverlayWorker_, message, transferables).then(
      (data) => {
        const received =
          /** @type {import('./constants.js').TextOverlayWorkerMessage} */ (
            data
          );

        // we're getting a key from the worker: these will be used later on to ask for render or disposal
        return received.instructionsSetKey;
      },
    );
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
        buffers.polygonBuffers &&
        this.renderInternal_(
          buffers.polygonBuffers[0],
          buffers.polygonBuffers[1],
          buffers.polygonBuffers[2],
          renderPass.fillRenderPass,
          frameState,
          preRenderCallback,
        );
      renderPass.strokeRenderPass &&
        buffers.lineStringBuffers &&
        this.renderInternal_(
          buffers.lineStringBuffers[0],
          buffers.lineStringBuffers[1],
          buffers.lineStringBuffers[2],
          renderPass.strokeRenderPass,
          frameState,
          preRenderCallback,
        );
      renderPass.symbolRenderPass &&
        buffers.pointBuffers &&
        this.renderInternal_(
          buffers.pointBuffers[0],
          buffers.pointBuffers[1],
          buffers.pointBuffers[2],
          renderPass.symbolRenderPass,
          frameState,
          preRenderCallback,
        );
    }
    if (buffers.textInstructionsKey) {
      this.renderText_(buffers);
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
   * @param {WebGLBuffers} buffers WebGL Buffers to draw
   * @private
   */
  renderText_(buffers) {
    this.textOverlayRenderList_.add(buffers.textInstructionsKey);
  }

  /**
   * Render the geometries in the given buffers.
   * @param {import("../../Map.js").FrameState} frameState Frame state
   * @return {Promise<void>} A promise resolving after the post rendering step is over
   */
  finalizeTextRender(frameState) {
    if (!this.hasText_) {
      return Promise.resolve();
    }

    const message = {
      type: TextOverlayWorkerMessageType.RENDER,
      frameState: serializeFrameState(frameState),
      batchesToRender: this.textOverlayRenderList_,
    };

    return messageWorker(this.textOverlayWorker_, message).then((data) => {
      const received =
        /** @type {import('./constants.js').TextOverlayWorkerMessage} */ (data);

      // if no render data returned, do not process it
      if (received.imageData) {
        this.textOverlayRenderFrameState_ = received.frameState;

        // the rendered image data is copied to the canvas and then given back to the worker
        const imageData = received.imageData;
        if (
          imageData.width !== this.textOverlayCanvas_.width ||
          imageData.height !== this.textOverlayCanvas_.height
        ) {
          this.textOverlayCanvas_.width = imageData.width;
          this.textOverlayCanvas_.height = imageData.height;
        } else {
          this.textOverlayContext_.clearRect(
            0,
            0,
            this.textOverlayCanvas_.width,
            this.textOverlayCanvas_.height,
          );
        }
        this.textOverlayContext_.drawImage(imageData, 0, 0);
        imageData.close();
      }

      this.textOverlayRenderList_.clear();
    });
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

  getTextOverlayCanvas() {
    return this.textOverlayCanvas_;
  }

  getTextOverlayFrameState() {
    return this.textOverlayRenderFrameState_;
  }

  /**
   * Dispose of text instructions in worker.
   * @param {string} key Key corresponding to the instructions set to dispose
   */
  disposeTextInstructions(key) {
    this.textOverlayWorker_?.postMessage({
      type: TextOverlayWorkerMessageType.DISPOSE_INSTRUCTIONS,
      instructionsSetKey: key,
    });
  }

  /**
   * Clean up.
   * @override
   */
  disposeInternal() {
    this.textOverlayWorker_?.terminate();
    super.disposeInternal();
  }
}

export default VectorStyleRenderer;

/**
 * @param {FlatStyleLike|StyleShaders|Array<StyleShaders>} styleOrShaders Either a flat style or shaders
 * @return {FlatStyleLike|null} Will return null if the original flat style could not be found
 */
export function toFlatStyleLike(styleOrShaders) {
  if (Array.isArray(styleOrShaders)) {
    // if it's an array of shaders but at least one has no source rule, we can't return a flat style like
    if (styleOrShaders.some((s) => 'builder' in s && !('sourceRule' in s))) {
      return null;
    }
    if (styleOrShaders.some((s) => 'builder' in s)) {
      return styleOrShaders.map((style) => style.sourceRule);
    }
    return /** @type {FlatStyleLike} */ (styleOrShaders);
  }
  if ('builder' in styleOrShaders) {
    if (!('sourceRule' in styleOrShaders)) {
      return null;
    }
    return [styleOrShaders.sourceRule];
  }
  return styleOrShaders;
}

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
      const styleShaders = ruleStyles.map((style) => ({
        ...parseLiteralStyle(style, variables, currentFilter),
        sourceRule: rule,
      }));
      shaders.push(...styleShaders);
    }
    return shaders;
  }

  // if array of shaders: return as is
  if ('builder' in asArray[0]) {
    return /** @type {Array<StyleShaders>} */ (asArray);
  }

  // array of flat styles: simply convert to shaders
  return /** @type {Array<FlatStyle>} */ (asArray).map((style) => ({
    ...parseLiteralStyle(style, variables, null),
    sourceRule: {style},
  }));
}
