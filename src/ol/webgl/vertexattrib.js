goog.provide('ol.webgl.VertexAttrib');

goog.require('goog.asserts');
goog.require('ol.webgl.GLObject');



/**
 * @constructor
 * @extends {ol.webgl.GLObject}
 * @param {string} name Name.
 */
ol.webgl.VertexAttrib = function(name) {

  goog.base(this);

  /**
   * @private
   * @type {string}
   */
  this.name_ = name;

  /**
   * @private
   * @type {number}
   */
  this.location_ = -1;

};
goog.inherits(ol.webgl.VertexAttrib, ol.webgl.GLObject);


/**
 */
ol.webgl.VertexAttrib.prototype.enableArray = function() {
  var gl = this.getGL();
  goog.asserts.assert(this.location_ != -1);
  gl.enableVertexAttribArray(this.location_);
};


/**
 * @param {number} size Size.
 * @param {number} type Type.
 * @param {boolean} normalize Normalized.
 * @param {number} stride Stride.
 * @param {number} offset Offset.
 */
ol.webgl.VertexAttrib.prototype.pointer =
    function(size, type, normalize, stride, offset) {
  var gl = this.getGL();
  goog.asserts.assert(this.location_ != -1);
  gl.vertexAttribPointer(
      this.location_, size, type, normalize, stride, offset);
};


/**
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webgl.VertexAttrib.prototype.setGL = function(gl) {
  this.location_ = -1;
  goog.base(this, 'setGL', gl);
};


/**
 * @param {WebGLProgram} program Program.
 */
ol.webgl.VertexAttrib.prototype.setProgram = function(program) {
  if (goog.isNull(program)) {
    this.location_ = -1;
  } else {
    var gl = this.getGL();
    this.location_ = gl.getAttribLocation(program, this.name_);
    goog.asserts.assert(!goog.isNull(this.location_));
  }
};
