goog.provide('ol.structs.Buffer');

goog.require('goog.array');
goog.require('goog.webgl');
goog.require('ol');


/**
 * @enum {number}
 */
ol.structs.BufferUsage = {
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
ol.structs.Buffer = function(opt_arr, opt_usage) {

  /**
   * @private
   * @type {Array.<number>}
   */
  this.arr_ = goog.isDef(opt_arr) ? opt_arr : [];

  /**
   * @private
   * @type {number}
   */
  this.usage_ = goog.isDef(opt_usage) ?
      opt_usage : ol.structs.BufferUsage.STATIC_DRAW;

};


/**
 * @return {Array.<number>} Array.
 */
ol.structs.Buffer.prototype.getArray = function() {
  return this.arr_;
};


/**
 * @return {number} Usage.
 */
ol.structs.Buffer.prototype.getUsage = function() {
  return this.usage_;
};
