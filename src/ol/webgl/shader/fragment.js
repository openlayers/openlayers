goog.provide('ol.webgl.shader.Fragment');

goog.require('goog.webgl');
goog.require('ol.webgl.Shader');



/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
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
