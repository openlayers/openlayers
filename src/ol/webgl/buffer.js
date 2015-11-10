goog.provide('ol.webgl.Buffer');

goog.require('goog.webgl');
goog.require('ol');


/**
 * @enum {number}
 */
ol.webgl.BufferUsage = {
  STATIC_DRAW: goog.webgl.STATIC_DRAW,
  STREAM_DRAW: goog.webgl.STREAM_DRAW,
  DYNAMIC_DRAW: goog.webgl.DYNAMIC_DRAW
};



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
      opt_usage : ol.webgl.BufferUsage.STATIC_DRAW;

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
