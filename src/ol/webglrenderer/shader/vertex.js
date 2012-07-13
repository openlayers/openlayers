goog.provide('ol.webglrenderer.shader.Vertex');

goog.require('goog.asserts');
goog.require('ol.webglrenderer.Shader');



/**
 * @constructor
 * @extends {ol.webglrenderer.Shader}
 * @param {string} source Source.
 * @param {Array.<ol.webglrenderer.Uniform>=} opt_uniforms Uniforms.
 */
ol.webglrenderer.shader.Vertex = function(source, opt_uniforms) {
  goog.base(this, source, opt_uniforms);
};
goog.inherits(ol.webglrenderer.shader.Vertex, ol.webglrenderer.Shader);


/**
 * @protected
 * @return {WebGLShader} Shader.
 */
ol.webglrenderer.shader.Vertex.prototype.create = function() {
  var gl = this.getGL();
  return gl.createShader(gl.VERTEX_SHADER);
};
