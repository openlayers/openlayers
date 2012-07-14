goog.provide('ol.webgl.shader.Fragment');

goog.require('ol.webgl.Shader');



/**
 * @constructor
 * @extends {ol.webgl.Shader}
 * @param {string} source Source.
 * @param {Array.<ol.webgl.Uniform>=} opt_uniforms Uniforms.
 */
ol.webgl.shader.Fragment = function(source, opt_uniforms) {
  goog.base(this, source, opt_uniforms);
};
goog.inherits(ol.webgl.shader.Fragment, ol.webgl.Shader);


/**
 * @protected
 * @return {WebGLShader} Shader.
 */
ol.webgl.shader.Fragment.prototype.create = function() {
  var gl = this.getGL();
  return gl.createShader(gl.FRAGMENT_SHADER);
};
