/**
 * @module ol/renderer/webgl/Layer
 */
import LayerRenderer from '../Layer.js';
import WebGLHelper from '../../webgl/Helper.js';


/**
 * @enum {string}
 */
export const WebGLWorkerMessageType = {
  GENERATE_BUFFERS: 'GENERATE_BUFFERS'
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
 * @property {Object.<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process step
 */

/**
 * @typedef {Object} Options
 * @property {Object.<string,import("../../webgl/Helper").UniformValue>} [uniforms] Uniform definitions for the post process steps
 * @property {Array<PostProcessesOptions>} [postProcesses] Post-processes definitions
 */

/**
 * @classdesc
 * Base WebGL renderer class.
 * Holds all logic related to data manipulation & some common rendering logic
 */
class WebGLLayerRenderer extends LayerRenderer {

  /**
   * @param {import("../../layer/Layer.js").default} layer Layer.
   * @param {Options=} [opt_options] Options.
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
      uniforms: options.uniforms
    });
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
  }

  /**
   * Will return the last shader compilation errors. If no error happened, will return null;
   * @return {string|null} Errors, or null if last compilation was successful
   * @api
   */
  getShaderCompileErrors() {
    return this.helper.getShaderCompileErrors();
  }

}


/**
 * @param {Float32Array} instructions Instructons array in which to write.
 * @param {number} elementIndex Index from which render instructions will be written.
 * @param {number} x Point center X coordinate
 * @param {number} y Point center Y coordinate
 * @param {number} u0 Left texture coordinate
 * @param {number} v0 Bottom texture coordinate
 * @param {number} u1 Right texture coordinate
 * @param {number} v1 Top texture coordinate
 * @param {number} size Radius of the point
 * @param {number} opacity Opacity
 * @param {boolean} rotateWithView If true, the point will stay aligned with the view
 * @param {Array<number>} color Array holding red, green, blue, alpha values
 * @return {number} Index from which the next element should be written
 * @private
 */
export function writePointFeatureInstructions(instructions, elementIndex, x, y, u0, v0, u1, v1, size, opacity, rotateWithView, color) {
  let i = elementIndex;
  instructions[i++] = x;
  instructions[i++] = y;
  instructions[i++] = u0;
  instructions[i++] = v0;
  instructions[i++] = u1;
  instructions[i++] = v1;
  instructions[i++] = size;
  instructions[i++] = opacity;
  instructions[i++] = rotateWithView ? 1 : 0;
  instructions[i++] = color[0];
  instructions[i++] = color[1];
  instructions[i++] = color[2];
  instructions[i++] = color[3];
  return i;
}

const tmpArray_ = [];
const bufferPositions_ = {vertexPosition: 0, indexPosition: 0};

export const POINT_INSTRUCTIONS_COUNT = 13;
export const POINT_VERTEX_STRIDE = 12;

function writePointVertex(buffer, pos, x, y, offsetX, offsetY, u, v, opacity, rotateWithView, red, green, blue, alpha) {
  buffer[pos + 0] = x;
  buffer[pos + 1] = y;
  buffer[pos + 2] = offsetX;
  buffer[pos + 3] = offsetY;
  buffer[pos + 4] = u;
  buffer[pos + 5] = v;
  buffer[pos + 6] = opacity;
  buffer[pos + 7] = rotateWithView;
  buffer[pos + 8] = red;
  buffer[pos + 9] = green;
  buffer[pos + 10] = blue;
  buffer[pos + 11] = alpha;
}

function writeCustomAttrs(buffer, pos, customAttrs) {
  if (customAttrs.length) {
    buffer.set(customAttrs, pos);
  }
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
 * @param {BufferPositions} [bufferPositions] Buffer write positions; if not specified, positions will be set at 0.
 * @param {number} [count] Amount of render instructions that will be read. Default value is POINT_INSTRUCTIONS_COUNT
 * but a higher value can be provided; all values beyond the default count will be put in the vertices buffer as
 * is, thus allowing specifying custom attributes. Please note: this value should not vary inside the same buffer or
 * rendering will break.
 * @return {BufferPositions} New buffer positions where to write next
 * @property {number} vertexPosition New position in the vertex buffer where future writes should start.
 * @property {number} indexPosition New position in the index buffer where future writes should start.
 * @private
 */
export function writePointFeatureToBuffers(instructions, elementIndex, vertexBuffer, indexBuffer, bufferPositions, count) {
  const count_ = count > POINT_INSTRUCTIONS_COUNT ? count : POINT_INSTRUCTIONS_COUNT;

  const x = instructions[elementIndex + 0];
  const y = instructions[elementIndex + 1];
  const u0 = instructions[elementIndex + 2];
  const v0 = instructions[elementIndex + 3];
  const u1 = instructions[elementIndex + 4];
  const v1 = instructions[elementIndex + 5];
  const size = instructions[elementIndex + 6];
  const opacity = instructions[elementIndex + 7];
  const rotateWithView = instructions[elementIndex + 8];
  const red = instructions[elementIndex + 9];
  const green = instructions[elementIndex + 10];
  const blue = instructions[elementIndex + 11];
  const alpha = instructions[elementIndex + 12];

  // the default vertex buffer stride is 12, plus additional custom values if any
  const baseStride = POINT_VERTEX_STRIDE;
  const stride = baseStride + count_ - POINT_INSTRUCTIONS_COUNT;

  // read custom numerical attributes on the feature
  const customAttrs = tmpArray_;
  customAttrs.length = count_ - POINT_INSTRUCTIONS_COUNT;
  for (let i = 0; i < customAttrs.length; i++) {
    customAttrs[i] = instructions[elementIndex + POINT_INSTRUCTIONS_COUNT + i];
  }

  let vPos = bufferPositions ? bufferPositions.vertexPosition : 0;
  let iPos = bufferPositions ? bufferPositions.indexPosition : 0;
  const baseIndex = vPos / stride;

  // push vertices for each of the four quad corners (first standard then custom attributes)
  writePointVertex(vertexBuffer, vPos, x, y, -size / 2, -size / 2, u0, v0, opacity, rotateWithView, red, green, blue, alpha);
  writeCustomAttrs(vertexBuffer, vPos + baseStride, customAttrs);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, +size / 2, -size / 2, u1, v0, opacity, rotateWithView, red, green, blue, alpha);
  writeCustomAttrs(vertexBuffer, vPos + baseStride, customAttrs);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, +size / 2, +size / 2, u1, v1, opacity, rotateWithView, red, green, blue, alpha);
  writeCustomAttrs(vertexBuffer, vPos + baseStride, customAttrs);
  vPos += stride;

  writePointVertex(vertexBuffer, vPos, x, y, -size / 2, +size / 2, u0, v1, opacity, rotateWithView, red, green, blue, alpha);
  writeCustomAttrs(vertexBuffer, vPos + baseStride, customAttrs);
  vPos += stride;

  indexBuffer[iPos++] = baseIndex; indexBuffer[iPos++] = baseIndex + 1; indexBuffer[iPos++] = baseIndex + 3;
  indexBuffer[iPos++] = baseIndex + 1; indexBuffer[iPos++] = baseIndex + 2; indexBuffer[iPos++] = baseIndex + 3;

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
  image.data[0] = image.data[1] = image.data[2] = image.data[3] = 255;
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
