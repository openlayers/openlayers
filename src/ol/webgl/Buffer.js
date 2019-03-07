/**
 * @module ol/webgl/Buffer
 */
import {STATIC_DRAW, STREAM_DRAW, DYNAMIC_DRAW} from '../webgl.js';

/**
 * @enum {number}
 */
const BufferUsage = {
  STATIC_DRAW: STATIC_DRAW,
  STREAM_DRAW: STREAM_DRAW,
  DYNAMIC_DRAW: DYNAMIC_DRAW
};


class WebGLArrayBuffer {

  /**
   * @param {Array<number>=} opt_arr Array.
   * @param {number=} opt_usage Usage.
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
