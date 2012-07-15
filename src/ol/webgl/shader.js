goog.provide('ol.webgl.Shader');

goog.require('goog.functions');



/**
 * @constructor
 * @param {string} source Source.
 */
ol.webgl.Shader = function(source) {

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

};


/**
 * @return {number} Type.
 */
ol.webgl.Shader.prototype.getType = goog.abstractMethod;


/**
 * @return {string} Source.
 */
ol.webgl.Shader.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Is animated?
 */
ol.webgl.Shader.prototype.isAnimated = goog.functions.FALSE;
