/**
 * @module ol/renderer/webgl/Layer
 */
import LayerProperty from '../../layer/Property.js';
import LayerRenderer from '../Layer.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import WebGLHelper from '../../webgl/Helper.js';
import {
  apply as applyTransform,
  compose as composeTransform,
  create as createTransform,
} from '../../transform.js';
import {containsCoordinate} from '../../extent.js';

/**
 * @enum {string}
 */
export const WebGLWorkerMessageType = {
  GENERATE_BUFFERS: 'GENERATE_BUFFERS',
};

/**
 * @typedef {Object} WebGLWorkerGenerateBuffersMessage
 * This message will trigger the generation of a vertex and an index buffer based on the given render instructions.
 * When the buffers are generated, the worked will send a message of the same type to the main thread, with
 * the generated buffers in it.
 * Note that any addition properties present in the message *will* be sent back to the main thread.
 * @property {WebGLWorkerMessageType} type Message type
 * @property {ArrayBuffer} renderInstructions Render instructions raw binary buffer.
 * @property {ArrayBuffer} [vertexBuffer] Vertices array raw binary buffer (sent by the worker).
 * @property {ArrayBuffer} [indexBuffer] Indices array raw binary buffer (sent by the worker).
 * @property {number} [customAttributesCount] Amount of custom attributes count in the render instructions.
 */

/**
 * @typedef {Object} PostProcessesOptions
 * @property {number} [scaleRatio] Scale ratio; if < 1, the post process will render to a texture smaller than
 * the main canvas that will then be sampled up (useful for saving resource on blur steps).
 * @property {string} [vertexShader] Vertex shader source
 * @property {string} [fragmentShader] Fragment shader source
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process step
 */

/**
 * @typedef {Object} Options
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * Base WebGL renderer class.
 * Holds all logic related to data manipulation & some common rendering logic
 * @template {import("../../layer/Layer.js").default} LayerType
 * @extends {LayerRenderer<LayerType>}
 */
class WebGLLayerRenderer extends LayerRenderer {
  /**
   * @param {LayerType} layer Layer.
   * @param {Options} [opt_options] Options.
   */
  constructor(layer, opt_options) {
    super(layer);

    const options = opt_options || {};

    /**
     * The transform for viewport CSS pixels to rendered pixels.  This transform is only
     * set before dispatching rendering events.
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.inversePixelTransform_ = createTransform();

    /**
     * @private
     * @type {CanvasRenderingContext2D}
     */
    this.pixelContext_ = null;

    /**
     * @private
     */
    this.postProcesses_ = options.postProcesses;

    /**
     * @private
     */
    this.uniforms_ = options.uniforms;

    /**
     * @type {WebGLHelper}
     * @protected
     */
    this.helper;

    layer.addChangeListener(LayerProperty.MAP, this.removeHelper.bind(this));

    this.dispatchPreComposeEvent = this.dispatchPreComposeEvent.bind(this);
    this.dispatchPostComposeEvent = this.dispatchPostComposeEvent.bind(this);
  }

  /**
   * @param {WebGLRenderingContext} context The WebGL rendering context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  dispatchPreComposeEvent(context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(RenderEventType.PRECOMPOSE)) {
      const event = new RenderEvent(
        RenderEventType.PRECOMPOSE,
        undefined,
        frameState,
        context
      );
      layer.dispatchEvent(event);
    }
  }

  /**
   * @param {WebGLRenderingContext} context The WebGL rendering context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  dispatchPostComposeEvent(context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(RenderEventType.POSTCOMPOSE)) {
      const event = new RenderEvent(
        RenderEventType.POSTCOMPOSE,
        undefined,
        frameState,
        context
      );
      layer.dispatchEvent(event);
    }
  }

  /**
   * Reset options (only handles uniforms).
   * @param {Options} options Options.
   */
  reset(options) {
    this.uniforms_ = options.uniforms;
    if (this.helper) {
      this.helper.setUniforms(this.uniforms_);
    }
  }

  /**
   * @protected
   */
  removeHelper() {
    if (this.helper) {
      this.helper.dispose();
      delete this.helper;
    }
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState) {
    if (this.getLayer().getRenderSource()) {
      let incrementGroup = true;
      let groupNumber = -1;
      let className;
      for (let i = 0, ii = frameState.layerStatesArray.length; i < ii; i++) {
        const layer = frameState.layerStatesArray[i].layer;
        const renderer = layer.getRenderer();
        if (!(renderer instanceof WebGLLayerRenderer)) {
          incrementGroup = true;
          continue;
        }
        const layerClassName = layer.getClassName();
        if (incrementGroup || layerClassName !== className) {
          groupNumber += 1;
          incrementGroup = false;
        }
        className = layerClassName;
        if (renderer === this) {
          break;
        }
      }

      const canvasCacheKey =
        'map/' + frameState.mapId + '/group/' + groupNumber;

      if (!this.helper || !this.helper.canvasCacheKeyMatches(canvasCacheKey)) {
        this.removeHelper();

        this.helper = new WebGLHelper({
          postProcesses: this.postProcesses_,
          uniforms: this.uniforms_,
          canvasCacheKey: canvasCacheKey,
        });

        if (className) {
          this.helper.getCanvas().className = className;
        }

        this.afterHelperCreated();
      }
    }

    return this.prepareFrameInternal(frameState);
  }

  /**
   * @protected
   */
  afterHelperCreated() {}

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   * @protected
   */
  prepareFrameInternal(frameState) {
    return true;
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    this.removeHelper();
    super.disposeInternal();
  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {WebGLRenderingContext} context The rendering context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @private
   */
  dispatchRenderEvent_(type, context, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      composeTransform(
        this.inversePixelTransform_,
        0,
        0,
        frameState.pixelRatio,
        -frameState.pixelRatio,
        0,
        0,
        -frameState.size[1]
      );

      const event = new RenderEvent(
        type,
        this.inversePixelTransform_,
        frameState,
        context
      );
      layer.dispatchEvent(event);
    }
  }

  /**
   * @param {WebGLRenderingContext} context The rendering context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  preRender(context, frameState) {
    this.dispatchRenderEvent_(RenderEventType.PRERENDER, context, frameState);
  }

  /**
   * @param {WebGLRenderingContext} context The rendering context.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  postRender(context, frameState) {
    this.dispatchRenderEvent_(RenderEventType.POSTRENDER, context, frameState);
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @param {import("../../PluggableMap.js").FrameState} frameState FrameState.
   * @param {number} hitTolerance Hit tolerance in pixels.
   * @return {Uint8ClampedArray|Uint8Array} The result.  If there is no data at the pixel
   *    location, null will be returned.  If there is data, but pixel values cannot be
   *    returned, and empty array will be returned.
   */
  getDataAtPixel(pixel, frameState, hitTolerance) {
    const renderPixel = applyTransform(
      [frameState.pixelRatio, 0, 0, frameState.pixelRatio, 0, 0],
      pixel.slice()
    );
    const gl = this.helper.getGL();
    if (!gl) {
      return null;
    }
    const layer = this.getLayer();
    const layerExtent = layer.getExtent();
    if (layerExtent) {
      const renderCoordinate = applyTransform(
        frameState.pixelToCoordinateTransform,
        pixel.slice()
      );

      /** get only data inside of the layer extent */
      if (!containsCoordinate(layerExtent, renderCoordinate)) {
        return null;
      }
    }

    const attributes = gl.getContextAttributes();
    if (!attributes || !attributes.preserveDrawingBuffer) {
      // we assume there is data at the given pixel (although there might not be)
      return new Uint8Array();
    }

    const x = Math.round(renderPixel[0]);
    const y = Math.round(renderPixel[1]);
    let pixelContext = this.pixelContext_;
    if (!pixelContext) {
      const pixelCanvas = document.createElement('canvas');
      pixelCanvas.width = 1;
      pixelCanvas.height = 1;
      pixelContext = pixelCanvas.getContext('2d');
      this.pixelContext_ = pixelContext;
    }
    pixelContext.clearRect(0, 0, 1, 1);
    let data;
    try {
      pixelContext.drawImage(gl.canvas, x, y, 1, 1, 0, 0, 1, 1);
      data = pixelContext.getImageData(0, 0, 1, 1).data;
    } catch (err) {
      return data;
    }

    if (data[3] === 0) {
      return null;
    }
    return data;
  }
}

const tmpArray_ = [];
const bufferPositions_ = {vertexPosition: 0, indexPosition: 0};

function writePointVertex(buffer, pos, x, y, index) {
  buffer[pos + 0] = x;
  buffer[pos + 1] = y;
  buffer[pos + 2] = index;
}

/**
 * An object holding positions both in an index and a vertex buffer.
 * @typedef {Object} BufferPositions
 * @property {number} vertexPosition Position in the vertex buffer
 * @property {number} indexPosition Position in the index buffer
 */

/**
 * Pushes a quad (two triangles) based on a point geometry
 * @param {Float32Array} instructions Array of render instructions for points.
 * @param {number} elementIndex Index from which render instructions will be read.
 * @param {Float32Array} vertexBuffer Buffer in the form of a typed array.
 * @param {Uint32Array} indexBuffer Buffer in the form of a typed array.
 * @param {number} customAttributesCount Amount of custom attributes for each element.
 * @param {BufferPositions} [bufferPositions] Buffer write positions; if not specified, positions will be set at 0.
 * @return {BufferPositions} New buffer positions where to write next
 * @property {number} vertexPosition New position in the vertex buffer where future writes should start.
 * @property {number} indexPosition New position in the index buffer where future writes should start.
 * @private
 */
export function writePointFeatureToBuffers(
  instructions,
  elementIndex,
  vertexBuffer,
  indexBuffer,
  customAttributesCount,
  bufferPositions
) {
  // This is for x, y and index
  const baseVertexAttrsCount = 3;
  const baseInstructionsCount = 2;
  const stride = baseVertexAttrsCount + customAttributesCount;

  const x = instructions[elementIndex + 0];
  const y = instructions[elementIndex + 1];

  // read custom numerical attributes on the feature
  const customAttrs = tmpArray_;
  customAttrs.length = customAttributesCount;
  for (let i = 0; i < customAttrs.length; i++) {
    customAttrs[i] = instructions[elementIndex + baseInstructionsCount + i];
  }

  let vPos = bufferPositions ? bufferPositions.vertexPosition : 0;
  let iPos = bufferPositions ? bufferPositions.indexPosition : 0;
  const baseIndex = vPos / stride;

  // push vertices for each of the four quad corners (first standard then custom attributes)
  writePointVertex(vertexBuffer, vPos, x, y, 0);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, 1);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, 2);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, 3);
  customAttrs.length &&
    vertexBuffer.set(customAttrs, vPos + baseVertexAttrsCount);
  vPos += stride;

  indexBuffer[iPos++] = baseIndex;
  indexBuffer[iPos++] = baseIndex + 1;
  indexBuffer[iPos++] = baseIndex + 3;
  indexBuffer[iPos++] = baseIndex + 1;
  indexBuffer[iPos++] = baseIndex + 2;
  indexBuffer[iPos++] = baseIndex + 3;

  bufferPositions_.vertexPosition = vPos;
  bufferPositions_.indexPosition = iPos;

  return bufferPositions_;
}

/**
 * Returns a texture of 1x1 pixel, white
 * @private
 * @return {ImageData} Image data.
 */
export function getBlankImageData() {
  const canvas = document.createElement('canvas');
  const image = canvas.getContext('2d').createImageData(1, 1);
  image.data[0] = 255;
  image.data[1] = 255;
  image.data[2] = 255;
  image.data[3] = 255;
  return image;
}

/**
 * Generates a color array based on a numerical id
 * Note: the range for each component is 0 to 1 with 256 steps
 * @param {number} id Id
 * @param {Array<number>} [opt_array] Reusable array
 * @return {Array<number>} Color array containing the encoded id
 */
export function colorEncodeId(id, opt_array) {
  const array = opt_array || [];
  const radix = 256;
  const divide = radix - 1;
  array[0] = Math.floor(id / radix / radix / radix) / divide;
  array[1] = (Math.floor(id / radix / radix) % radix) / divide;
  array[2] = (Math.floor(id / radix) % radix) / divide;
  array[3] = (id % radix) / divide;
  return array;
}

/**
 * Reads an id from a color-encoded array
 * Note: the expected range for each component is 0 to 1 with 256 steps.
 * @param {Array<number>} color Color array containing the encoded id
 * @return {number} Decoded id
 */
export function colorDecodeId(color) {
  let id = 0;
  const radix = 256;
  const mult = radix - 1;
  id += Math.round(color[0] * radix * radix * radix * mult);
  id += Math.round(color[1] * radix * radix * mult);
  id += Math.round(color[2] * radix * mult);
  id += Math.round(color[3] * mult);
  return id;
}

export default WebGLLayerRenderer;
