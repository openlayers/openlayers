/**
 * @module ol/webgl/Buffer
 */
import {ARRAY_BUFFER, ELEMENT_ARRAY_BUFFER} from '../webgl.js';
import {DYNAMIC_DRAW, STATIC_DRAW, STREAM_DRAW} from '../webgl.js';
import {assert} from '../asserts.js';

/**
 * Used to describe the intended usage for the data: `STATIC_DRAW`, `STREAM_DRAW`
 * or `DYNAMIC_DRAW`.
 * @enum {number}
 */
export const BufferUsage = {
  STATIC_DRAW: STATIC_DRAW,
  STREAM_DRAW: STREAM_DRAW,
  DYNAMIC_DRAW: DYNAMIC_DRAW,
};

/**
 * @classdesc
 * Object used to store an array of data as well as usage information for that data.
 * Stores typed arrays internally, either Float32Array or Uint16/32Array depending on
 * the buffer type (ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER) and available extensions.
 *
 * To populate the array, you can either use:
 * * A size using `#ofSize(buffer)`
 * * An `ArrayBuffer` object using `#fromArrayBuffer(buffer)`
 * * A plain array using `#fromArray(array)`
 *
 * Note:
 * See the documentation of [WebGLRenderingContext.bufferData](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData)
 * for more info on buffer usage.
 * @api
 */
class WebGLArrayBuffer {
  /**
   * @param {number} type Buffer type, either ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER.
   * @param {number} [opt_usage] Intended usage, either `STATIC_DRAW`, `STREAM_DRAW` or `DYNAMIC_DRAW`.
   * Default is `DYNAMIC_DRAW`.
   */
  constructor(type, opt_usage) {
    /**
     * @private
     * @type {Float32Array|Uint32Array}
     */
    this.array = null;

    /**
     * @private
     * @type {number}
     */
    this.type = type;

    assert(type === ARRAY_BUFFER || type === ELEMENT_ARRAY_BUFFER, 62);

    /**
     * @private
     * @type {number}
     */
    this.usage = opt_usage !== undefined ? opt_usage : BufferUsage.STATIC_DRAW;
  }

  /**
   * Populates the buffer with an array of the given size (all values will be zeroes).
   * @param {number} size Array size
   */
  ofSize(size) {
    this.array = new (getArrayClassForType(this.type))(size);
  }

  /**
   * Populates the buffer with an array of the given size (all values will be zeroes).
   * @param {Array<number>} array Numerical array
   */
  fromArray(array) {
    const arrayClass = getArrayClassForType(this.type);
    this.array = arrayClass.from
      ? arrayClass.from(array)
      : new arrayClass(array);
  }

  /**
   * Populates the buffer with a raw binary array buffer.
   * @param {ArrayBuffer} buffer Raw binary buffer to populate the array with. Note that this buffer must have been
   * initialized for the same typed array class.
   */
  fromArrayBuffer(buffer) {
    this.array = new (getArrayClassForType(this.type))(buffer);
  }

  /**
   * @return {number} Buffer type.
   */
  getType() {
    return this.type;
  }

  /**
   * Will return null if the buffer was not initialized
   * @return {Float32Array|Uint32Array} Array.
   */
  getArray() {
    return this.array;
  }

  /**
   * @return {number} Usage.
   */
  getUsage() {
    return this.usage;
  }

  /**
   * Will return 0 if the buffer is not initialized
   * @return {number} Array size
   */
  getSize() {
    return this.array ? this.array.length : 0;
  }
}

/**
 * Returns a typed array constructor based on the given buffer type
 * @param {number} type Buffer type, either ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER.
 * @return {Float32ArrayConstructor|Uint32ArrayConstructor} The typed array class to use for this buffer.
 */
export function getArrayClassForType(type) {
  switch (type) {
    case ARRAY_BUFFER:
      return Float32Array;
    case ELEMENT_ARRAY_BUFFER:
      return Uint32Array;
    default:
      return Float32Array;
  }
}

export default WebGLArrayBuffer;
