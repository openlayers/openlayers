goog.provide('ol.webgl.Buffer');

goog.require('ol.webgl');


/**
 * @constructor
 * @param {Array.<number>=} opt_arr Array.
 * @param {number=} opt_usage Usage.
 * @struct
 */
ol.webgl.Buffer = function(opt_arr, opt_usage) {

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
    opt_usage : ol.webgl.Buffer.Usage_.STATIC_DRAW;

};


/**
 * @return {Array.<number>} Array.
 */
ol.webgl.Buffer.prototype.getArray = function() {
  return this.arr_;
};


/**
 * @return {number} Usage.
 */
ol.webgl.Buffer.prototype.getUsage = function() {
  return this.usage_;
};


/**
 * @enum {number}
 * @private
 */
ol.webgl.Buffer.Usage_ = {
  STATIC_DRAW: ol.webgl.STATIC_DRAW,
  STREAM_DRAW: ol.webgl.STREAM_DRAW,
  DYNAMIC_DRAW: ol.webgl.DYNAMIC_DRAW
};
