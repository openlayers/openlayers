/**
 * @module ol/webgl/Buffer
 */
import _ol_webgl_ from '../webgl.js';

/**
 * @enum {number}
 */
const BufferUsage = {
  STATIC_DRAW: _ol_webgl_.STATIC_DRAW,
  STREAM_DRAW: _ol_webgl_.STREAM_DRAW,
  DYNAMIC_DRAW: _ol_webgl_.DYNAMIC_DRAW
};

/**
 * @constructor
 * @param {Array.<number>=} opt_arr Array.
 * @param {number=} opt_usage Usage.
 * @struct
 */
const WebGLBuffer = function(opt_arr, opt_usage) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.arr_ = opt_arr !== undefined ? opt_arr : [];

  /**
   * @private
   * @type {number}
   */
  this.usage_ = opt_usage !== undefined ? opt_usage : BufferUsage.STATIC_DRAW;

};


/**
 * @return {Array.<number>} Array.
 */
WebGLBuffer.prototype.getArray = function() {
  return this.arr_;
};


/**
 * @return {number} Usage.
 */
WebGLBuffer.prototype.getUsage = function() {
  return this.usage_;
};

export default WebGLBuffer;
