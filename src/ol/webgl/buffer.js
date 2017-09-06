import _ol_webgl_ from '../webgl';

/**
 * @constructor
 * @param {Array.<number>=} opt_arr Array.
 * @param {number=} opt_usage Usage.
 * @struct
 */
var _ol_webgl_Buffer_ = function(opt_arr, opt_usage) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.arr_ = opt_arr !== undefined ? opt_arr : [];

  /**
   * @private
   * @type {number}
   */
  this.usage_ = opt_usage !== undefined ?
    opt_usage : _ol_webgl_Buffer_.Usage_.STATIC_DRAW;

};


/**
 * @return {Array.<number>} Array.
 */
_ol_webgl_Buffer_.prototype.getArray = function() {
  return this.arr_;
};


/**
 * @return {number} Usage.
 */
_ol_webgl_Buffer_.prototype.getUsage = function() {
  return this.usage_;
};


/**
 * @enum {number}
 * @private
 */
_ol_webgl_Buffer_.Usage_ = {
  STATIC_DRAW: _ol_webgl_.STATIC_DRAW,
  STREAM_DRAW: _ol_webgl_.STREAM_DRAW,
  DYNAMIC_DRAW: _ol_webgl_.DYNAMIC_DRAW
};
export default _ol_webgl_Buffer_;
