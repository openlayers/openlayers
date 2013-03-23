goog.provide('ol.webgl.FragmentShader');
goog.provide('ol.webgl.VertexShader');

goog.require('goog.functions');
goog.require('goog.webgl');



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



/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
 */
ol.webgl.FragmentShader = function(source) {
  goog.base(this, source);
};
goog.inherits(ol.webgl.FragmentShader, ol.webgl.Shader);


/**
 * @inheritDoc
 */
ol.webgl.FragmentShader.prototype.getType = function() {
  return goog.webgl.FRAGMENT_SHADER;
};



/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
 */
ol.webgl.VertexShader = function(source) {
  goog.base(this, source);
};
goog.inherits(ol.webgl.VertexShader, ol.webgl.Shader);


/**
 * @inheritDoc
 */
ol.webgl.VertexShader.prototype.getType = function() {
  return goog.webgl.VERTEX_SHADER;
};
