goog.provide('ol.webgl.shader.Vertex');

goog.require('ol.webgl.Shader');



/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
 * @param {Array.<ol.webgl.Uniform>=} opt_uniforms Uniforms.
 */
ol.webgl.shader.Vertex = function(source, opt_uniforms) {
  goog.base(this, source, opt_uniforms);
};
goog.inherits(ol.webgl.shader.Vertex, ol.webgl.Shader);


/**
 * @protected
 * @return {WebGLShader} Shader.
 */
ol.webgl.shader.Vertex.prototype.create = function() {
  var gl = this.getGL();
  return gl.createShader(gl.VERTEX_SHADER);
};
