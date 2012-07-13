goog.provide('ol.webglrenderer.shader.Fragment');

goog.require('goog.asserts');
goog.require('ol.webglrenderer.Shader');



/**
 * @constructor
 * @extends {ol.webglrenderer.Shader}
 * @param {string} source Source.
 * @param {Array.<ol.webglrenderer.Uniform>=} opt_uniforms Uniforms.
 */
ol.webglrenderer.shader.Fragment = function(source, opt_uniforms) {
  goog.base(this, source, opt_uniforms);
};
goog.inherits(ol.webglrenderer.shader.Fragment, ol.webglrenderer.Shader);


/**
 * @protected
 * @return {WebGLShader} Shader.
 */
ol.webglrenderer.shader.Fragment.prototype.create = function() {
  var gl = this.getGL();
  return gl.createShader(gl.FRAGMENT_SHADER);
};
