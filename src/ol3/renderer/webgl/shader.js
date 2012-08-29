goog.provide('ol3.renderer.webgl.FragmentShader');
goog.provide('ol3.renderer.webgl.VertexShader');

goog.require('goog.functions');
goog.require('goog.webgl');



/**
 * @constructor
 * @param {string} source Source.
 */
ol3.renderer.webgl.Shader = function(source) {

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

};


/**
 * @return {number} Type.
 */
ol3.renderer.webgl.Shader.prototype.getType = goog.abstractMethod;


/**
 * @return {string} Source.
 */
ol3.renderer.webgl.Shader.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Is animated?
 */
ol3.renderer.webgl.Shader.prototype.isAnimated = goog.functions.FALSE;



/**
 * @constructor
 * @extends {ol3.renderer.webgl.Shader}
 * @param {string} source Source.
 */
ol3.renderer.webgl.FragmentShader = function(source) {
  goog.base(this, source);
};
goog.inherits(ol3.renderer.webgl.FragmentShader, ol3.renderer.webgl.Shader);


/**
 * @inheritDoc
 */
ol3.renderer.webgl.FragmentShader.prototype.getType = function() {
  return goog.webgl.FRAGMENT_SHADER;
};



/**
 * @constructor
 * @extends {ol3.renderer.webgl.Shader}
 * @param {string} source Source.
 */
ol3.renderer.webgl.VertexShader = function(source) {
  goog.base(this, source);
};
goog.inherits(ol3.renderer.webgl.VertexShader, ol3.renderer.webgl.Shader);


/**
 * @inheritDoc
 */
ol3.renderer.webgl.VertexShader.prototype.getType = function() {
  return goog.webgl.VERTEX_SHADER;
};
