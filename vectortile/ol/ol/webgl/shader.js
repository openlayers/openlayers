goog.provide('ol.webgl.Fragment');
goog.provide('ol.webgl.Shader');
goog.provide('ol.webgl.Vertex');
goog.provide('ol.webgl.shader');

goog.require('goog.functions');
goog.require('goog.webgl');
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
 * @struct
 */
ol.webgl.shader.Fragment = function(source) {
  goog.base(this, source);
};
goog.inherits(ol.webgl.shader.Fragment, ol.webgl.Shader);


/**
 * @inheritDoc
 */
ol.webgl.shader.Fragment.prototype.getType = function() {
  return goog.webgl.FRAGMENT_SHADER;
};



/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
 * @struct
 */
ol.webgl.shader.Vertex = function(source) {
  goog.base(this, source);
};
goog.inherits(ol.webgl.shader.Vertex, ol.webgl.Shader);


/**
 * @inheritDoc
 */
ol.webgl.shader.Vertex.prototype.getType = function() {
  return goog.webgl.VERTEX_SHADER;
};
