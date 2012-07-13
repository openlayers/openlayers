goog.provide('ol.webglrenderer.Uniform');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.webglrenderer.GLObject');



/**
 * @constructor
 * @extends {ol.webglrenderer.GLObject}
 * @param {string} name Name.
 */
ol.webglrenderer.Uniform = function(name) {

  goog.base(this);

  /**
   * @private
   * @type {WebGLProgram}
   */
  this.program_ = null;

  /**
   * @private
   * @type {string}
   */
  this.name_ = name;

  /**
   * @private
   * @type {WebGLUniformLocation}
   */
  this.location_ = null;

};
goog.inherits(ol.webglrenderer.Uniform, ol.webglrenderer.GLObject);


/**
 * @return {string} Name.
 */
ol.webglrenderer.Uniform.prototype.getName = function() {
  return this.name_;
};


/**
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webglrenderer.Uniform.prototype.setGL = function(gl) {
  this.location_ = null;
  goog.base(this, 'setGL', gl);
};


/**
 * @param {number} value Value.
 */
ol.webglrenderer.Uniform.prototype.set1f = function(value) {
  var gl = this.getGL();
  if (!goog.isNull(this.location_)) {
    gl.uniform1f(this.location_, value);
  }
};


/**
 * @param {number} value Value.
 */
ol.webglrenderer.Uniform.prototype.set1i = function(value) {
  var gl = this.getGL();
  if (!goog.isNull(this.location_)) {
    gl.uniform1i(this.location_, value);
  }
};


/**
 * @param {boolean} transpose Transpose.
 * @param {goog.vec.Mat4.Mat4Like} value Value.
 */
ol.webglrenderer.Uniform.prototype.setMatrix4fv = function(transpose, value) {
  var gl = this.getGL();
  if (!goog.isNull(this.location_)) {
    gl.uniformMatrix4fv(this.location_, transpose, value);
  }
};


/**
 * @param {WebGLProgram} program Program.
 */
ol.webglrenderer.Uniform.prototype.setProgram = function(program) {
  if (goog.isNull(program)) {
    this.location_ = null;
  } else {
    var gl = this.getGL();
    this.location_ = gl.getUniformLocation(program, this.name_);
  }
};
