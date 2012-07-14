goog.provide('ol.webgl.Framebuffer');

goog.require('goog.asserts');
goog.require('goog.webgl');
goog.require('ol.webgl.GLObject');



/**
 * @constructor
 * @extends {ol.webgl.GLObject}
 * @param {number} size Size.
 */
ol.webgl.Framebuffer = function(size) {

  goog.base(this);

  /**
   * @private
   * @type {WebGLFramebuffer}
   */
  this.framebuffer_ = null;

  /**
   * @private
   * @type {WebGLTexture}
   */
  this.texture_ = null;

  /**
   * @private
   * @type {number}
   */
  this.size_ = size;

};
goog.inherits(ol.webgl.Framebuffer, ol.webgl.GLObject);


/**
 */
ol.webgl.Framebuffer.prototype.bind = function() {
  var gl = this.getGL();
  var framebuffer = this.get();
  gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, framebuffer);
};


/**
 * @param {number} size Size.
 * @private
 * @return {WebGLTexture} Texture.
 */
ol.webgl.Framebuffer.prototype.createTexture_ = function(size) {
  var gl = this.getGL();
  var texture = gl.createTexture();
  gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, size, size, 0,
      goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, null);
  gl.texParameteri(
      goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.LINEAR);
  gl.texParameteri(
      goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.LINEAR);
  return texture;
};


/**
 * @return {WebGLFramebuffer} Framebuffer.
 */
ol.webgl.Framebuffer.prototype.get = function() {
  goog.asserts.assert(!goog.isNull(this.framebuffer_));
  return this.framebuffer_;
};


/**
 * @param {WebGLRenderingContext} gl GL.
 */
ol.webgl.Framebuffer.prototype.setGL = function(gl) {
  if (!goog.isNull(this.gl)) {
    if (!goog.isNull(this.framebuffer_)) {
      this.gl.deleteFramebuffer(this.framebuffer_);
      this.framebuffer_ = null;
    }
    if (!goog.isNull(this.texture_)) {
      this.gl.deleteTexture(this.texture_);
      this.texture_ = null;
    }
  }
  goog.base(this, 'setGL', gl);
  if (!goog.isNull(gl)) {
    this.texture_ = this.createTexture_(this.size_);
    this.framebuffer_ = gl.createFramebuffer();
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
        goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, this.texture_, 0);
  }
};


/**
 * @param {number} size Size.
 */
ol.webgl.Framebuffer.prototype.setSize = function(size) {
  var gl = this.getGL();
  goog.asserts.assert(!(size & (size - 1)));
  if (this.size_ != size && !goog.isNull(gl)) {
    var texture = this.createTexture_(size);
    goog.asserts.assert(!goog.isNull(this.framebuffer_));
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
        goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, texture, 0);
    goog.asserts.assert(!goog.isNull(this.texture_));
    gl.deleteTexture(this.texture_);
    this.texture = texture;
  }
};
