/**
 * @module ol/webgl/Buffer
 */
import {
  ARRAY_BUFFER,
  DYNAMIC_DRAW,
  ELEMENT_ARRAY_BUFFER,
  STATIC_DRAW,
  STREAM_DRAW,
} from '../webgl.js';
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
 */
class WebGLArrayBuffer {
  /**
   * @param {number} type Buffer type, either ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER.
   * @param {number} [usage] Intended usage, either `STATIC_DRAW`, `STREAM_DRAW` or `DYNAMIC_DRAW`.
   * Default is `DYNAMIC_DRAW`.
   */
  constructor(type, usage) {
    /**
     * @private
     * @type {Float32Array|Uint32Array|null}
     */
    this.array_ = null;

    /**
     * @private
     * @type {number}
     */
    this.type_ = type;

    assert(
      type === ARRAY_BUFFER || type === ELEMENT_ARRAY_BUFFER,
      'A `WebGLArrayBuffer` must either be of type `ELEMENT_ARRAY_BUFFER` or `ARRAY_BUFFER`',
    );

    /**
     * @private
     * @type {number}
     */
    this.usage_ = usage !== undefined ? usage : BufferUsage.STATIC_DRAW;
  }

  /**
   * Populates the buffer with an array of the given size (all values will be zeroes).
   * @param {number} size Array size
   * @return {WebGLArrayBuffer} This
   */
  ofSize(size) {
    this.array_ = new (getArrayClassForType(this.type_))(size);
    return this;
  }

  /**
   * Populates the buffer with an array of the given size.
   * @param {Array<number>} array Numerical array
   * @return {WebGLArrayBuffer} This
   */
  fromArray(array) {
    this.array_ = getArrayClassForType(this.type_).from(array);
    return this;
  }

  /**
   * Populates the buffer with a raw binary array buffer.
   * @param {ArrayBuffer} buffer Raw binary buffer to populate the array with. Note that this buffer must have been
   * initialized for the same typed array class.
   * @return {WebGLArrayBuffer} This
   */
  fromArrayBuffer(buffer) {
    this.array_ = new (getArrayClassForType(this.type_))(buffer);
    return this;
  }

  /**
   * @return {number} Buffer type.
   */
  getType() {
    return this.type_;
  }

  /**
   * Will return null if the buffer was not initialized
   * @return {Float32Array|Uint32Array|null} Array.
   */
  getArray() {
    return this.array_;
  }

  /**
   * @return {number} Usage.
   */
  getUsage() {
    return this.usage_;
  }

  /**
   * Will return 0 if the buffer is not initialized
   * @return {number} Array size
   */
  getSize() {
    return this.array_ ? this.array_.length : 0;
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
