/**
 * @module ol/renderer/webgl/Layer
 */
import LayerRenderer from '../Layer.js';
import RenderEvent from '../../render/Event.js';
import RenderEventType from '../../render/EventType.js';
import WebGLHelper from '../../webgl/Helper.js';

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
 * @property {string} [className='ol-layer'] A CSS class name to set to the canvas element.
 * @property {Object<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * Base WebGL renderer class.
 * Holds all logic related to data manipulation & some common rendering logic
 * @template {import("../../layer/Layer.js").default} LayerType
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
     * @type {WebGLHelper}
     * @protected
     */
    this.helper = new WebGLHelper({
      postProcesses: options.postProcesses,
      uniforms: options.uniforms,
    });

    if (options.className !== undefined) {
      this.helper.getCanvas().className = options.className;
    }
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    this.helper.dispose();
    delete this.helper;

    super.disposeInternal();
  }

  /**
   * @param {import("../../render/EventType.js").default} type Event type.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @private
   */
  dispatchRenderEvent_(type, frameState) {
    const layer = this.getLayer();
    if (layer.hasListener(type)) {
      // RenderEvent does not get a context or an inversePixelTransform, because WebGL allows much less direct editing than Canvas2d does.
      const event = new RenderEvent(type, null, frameState, null);
      layer.dispatchEvent(event);
    }
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  preRender(frameState) {
    this.dispatchRenderEvent_(RenderEventType.PRERENDER, frameState);
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @protected
   */
  postRender(frameState) {
    this.dispatchRenderEvent_(RenderEventType.POSTRENDER, frameState);
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
