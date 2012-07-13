goog.provide('ol.webglrenderer.Shader');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('ol.webglrenderer.GLObject');
goog.require('ol.webglrenderer.Uniform');



/**
 * @constructor
 * @extends {ol.webglrenderer.GLObject}
 * @param {string} source Source.
 * @param {Array.<ol.webglrenderer.Uniform>=} opt_uniforms Uniforms.
 */
ol.webglrenderer.Shader = function(source, opt_uniforms) {

  goog.base(this);

  /**
   * @private
   * @type {WebGLShader}
   */
  this.shader_ = null;

  /**
   * @private
   * @type {string}
   */
  this.source_ = source;

  /**
   * @private
   * @type {Array.<ol.webglrenderer.Uniform>}
   */
  this.uniforms_ = opt_uniforms || [];

};
goog.inherits(ol.webglrenderer.Shader, ol.webglrenderer.GLObject);


/**
 */
ol.webglrenderer.Shader.prototype.compile = function() {
  var gl = this.getGL();
  this.shader_ = this.create();
  gl.shaderSource(this.shader_, this.source_);
  gl.compileShader(this.shader_);
  if (!gl.getShaderParameter(this.shader_, goog.webgl.COMPILE_STATUS)) {
    window.console.log(gl.getShaderInfoLog(this.shader_));
    goog.asserts.assert(
        gl.getShaderParameter(this.shader_, goog.webgl.COMPILE_STATUS));
  }
};


/**
 * @protected
 * @return {WebGLShader} Shader.
 */
ol.webglrenderer.Shader.prototype.create = goog.abstractMethod;


/**
 * @return {WebGLShader} Shader.
 */
ol.webglrenderer.Shader.prototype.get = function() {
  return this.shader_;
};


/**
 * @return {boolean} Is animated?
 */
ol.webglrenderer.Shader.prototype.isAnimated = function() {
  return false;
};


/**
 * @inheritDoc
 */
ol.webglrenderer.Shader.prototype.setGL = function(gl) {
  if (!goog.isNull(this.gl)) {
    goog.array.forEach(this.uniforms_, function(uniform) {
      uniform.setGL(null);
    });
    if (!goog.isNull(this.shader_)) {
      this.gl.deleteShader(this.shader_);
      this.shader_ = null;
    }
  }
  goog.base(this, 'setGL', gl);
  if (!goog.isNull(gl)) {
    this.compile();
    goog.array.forEach(this.uniforms_, function(uniform) {
      uniform.setGL(gl);
    });
  }
};


/**
 * @param {WebGLProgram} program Program.
 */
ol.webglrenderer.Shader.prototype.setProgram = function(program) {
  goog.array.forEach(this.uniforms_, function(uniform) {
    uniform.setProgram(program);
  });
};


/**
 */
ol.webglrenderer.Shader.prototype.setUniforms = function() {
};
