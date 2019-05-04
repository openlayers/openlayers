/**
 * @module ol/webgl/Buffer
 */
import {STATIC_DRAW, STREAM_DRAW, DYNAMIC_DRAW} from '../webgl.js';

/**
 * Used to describe the intended usage for the data: `STATIC_DRAW`, `STREAM_DRAW`
 * or `DYNAMIC_DRAW`.
 * @enum {number}
 */
export const BufferUsage = {
  STATIC_DRAW: STATIC_DRAW,
  STREAM_DRAW: STREAM_DRAW,
  DYNAMIC_DRAW: DYNAMIC_DRAW
};

/**
 * @classdesc
 * Object used to store an array of data as well as usage information for that data.
 * See the documentation of [WebGLRenderingContext.bufferData](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bufferData) for more info.
 * @api
 */
class WebGLArrayBuffer {

  /**
   * @param {Array<number>=} opt_arr Array.
   * @param {number=} opt_usage Usage, either `STATIC_DRAW`, `STREAM_DRAW` or `DYNAMIC_DRAW`. Default is `DYNAMIC_DRAW`.
   */
  constructor(opt_arr, opt_usage) {

    /**
     * @private
     * @type {Array<number>}
     */
    this.arr_ = opt_arr !== undefined ? opt_arr : [];

    /**
     * @private
     * @type {number}
     */
    this.usage_ = opt_usage !== undefined ? opt_usage : BufferUsage.STATIC_DRAW;

  }

  /**
   * @return {Array<number>} Array.
   */
  getArray() {
    return this.arr_;
  }

  /**
   * @return {number} Usage.
   */
  getUsage() {
    return this.usage_;
  }
}

export default WebGLArrayBuffer;
