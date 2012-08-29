goog.provide('ol3.webgl.shader.Fragment');
goog.provide('ol3.webgl.shader.Vertex');

goog.require('goog.functions');
goog.require('goog.webgl');



/**
 * @constructor
 * @param {string} source Source.
 */
ol3.webgl.Shader = function(source) {

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

};


/**
 * @return {number} Type.
 */
ol3.webgl.Shader.prototype.getType = goog.abstractMethod;


/**
 * @return {string} Source.
 */
ol3.webgl.Shader.prototype.getSource = function() {
  return this.source_;
};


/**
 * @return {boolean} Is animated?
 */
ol3.webgl.Shader.prototype.isAnimated = goog.functions.FALSE;



/**
 * @constructor
 * @extends {ol3.webgl.Shader}
 * @param {string} source Source.
 */
ol3.webgl.shader.Fragment = function(source) {
  goog.base(this, source);
};
goog.inherits(ol3.webgl.shader.Fragment, ol3.webgl.Shader);


/**
 * @inheritDoc
 */
ol3.webgl.shader.Fragment.prototype.getType = function() {
  return goog.webgl.FRAGMENT_SHADER;
};



/**
 * @constructor
 * @extends {ol3.webgl.Shader}
 * @param {string} source Source.
 */
ol3.webgl.shader.Vertex = function(source) {
  goog.base(this, source);
};
goog.inherits(ol3.webgl.shader.Vertex, ol3.webgl.Shader);


/**
 * @inheritDoc
 */
ol3.webgl.shader.Vertex.prototype.getType = function() {
  return goog.webgl.VERTEX_SHADER;
};
