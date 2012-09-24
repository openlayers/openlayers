goog.provide('ol.renderer.webgl.FragmentShader');
goog.provide('ol.renderer.webgl.VertexShader');

goog.require('goog.functions');
goog.require('goog.webgl');



/**
 * @constructor
 * @param {string} source Source.
 */
ol.renderer.webgl.Shader = function(source) {

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

};


/**
 * @return {number} Type.
 */
ol.renderer.webgl.Shader.prototype.getType = goog.abstractMethod;


/**
 * @return {string} Source.
 */
ol.renderer.webgl.Shader.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Is animated?
 */
ol.renderer.webgl.Shader.prototype.isAnimated = goog.functions.FALSE;



/**
 * @constructor
 * @extends {ol.renderer.webgl.Shader}
 * @param {string} source Source.
 */
ol.renderer.webgl.FragmentShader = function(source) {
  goog.base(this, source);
};
goog.inherits(ol.renderer.webgl.FragmentShader, ol.renderer.webgl.Shader);


/**
 * @inheritDoc
 */
ol.renderer.webgl.FragmentShader.prototype.getType = function() {
  return goog.webgl.FRAGMENT_SHADER;
};



/**
 * @constructor
 * @extends {ol.renderer.webgl.Shader}
 * @param {string} source Source.
 */
ol.renderer.webgl.VertexShader = function(source) {
  goog.base(this, source);
};
goog.inherits(ol.renderer.webgl.VertexShader, ol.renderer.webgl.Shader);


/**
 * @inheritDoc
 */
ol.renderer.webgl.VertexShader.prototype.getType = function() {
  return goog.webgl.VERTEX_SHADER;
};
