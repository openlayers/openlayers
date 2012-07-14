goog.provide('ol.webgl.Shader');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('ol.webgl.GLObject');
goog.require('ol.webgl.Uniform');



/**
 * @constructor
 * @extends {ol.webgl.GLObject}
 * @param {string} source Source.
 * @param {Array.<ol.webgl.Uniform>=} opt_uniforms Uniforms.
 */
ol.webgl.Shader = function(source, opt_uniforms) {

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
   * @type {Array.<ol.webgl.Uniform>}
   */
  this.uniforms_ = opt_uniforms || [];

};
goog.inherits(ol.webgl.Shader, ol.webgl.GLObject);


/**
 */
ol.webgl.Shader.prototype.compile = function() {
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
ol.webgl.Shader.prototype.create = goog.abstractMethod;


/**
 * @return {WebGLShader} Shader.
 */
ol.webgl.Shader.prototype.get = function() {
  return this.shader_;
};


/**
 * @return {boolean} Is animated?
 */
ol.webgl.Shader.prototype.isAnimated = function() {
  return false;
};


/**
 * @inheritDoc
 */
ol.webgl.Shader.prototype.setGL = function(gl) {
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
ol.webgl.Shader.prototype.setProgram = function(program) {
  goog.array.forEach(this.uniforms_, function(uniform) {
    uniform.setProgram(program);
  });
};


/**
 */
ol.webgl.Shader.prototype.setUniforms = function() {
};
