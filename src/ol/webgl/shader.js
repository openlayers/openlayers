goog.provide('ol.webgl.Shader');

goog.require('ol.functions');
goog.require('ol.webgl');


/**
 * @constructor
 * @param {string} source Source.
 * @struct
 */
ol.webgl.Shader = function(source) {

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

};


/**
 * @abstract
 * @return {number} Type.
 */
ol.webgl.Shader.prototype.getType = function() {};


/**
 * @return {string} Source.
 */
ol.webgl.Shader.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Is animated?
 */
ol.webgl.Shader.prototype.isAnimated = ol.functions.FALSE;
