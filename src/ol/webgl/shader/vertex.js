goog.provide('ol.webgl.shader.Vertex');

goog.require('goog.webgl');
goog.require('ol.webgl.Shader');



/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
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
