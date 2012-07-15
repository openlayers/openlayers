goog.provide('ol.webgl.Texture');

goog.require('goog.asserts');
goog.require('ol.webgl.GLObject');



/**
 * @constructor
 * @extends {ol.webgl.GLObject}
 */
ol.webgl.Texture = function() {

  goog.base(this);

  /**
   * @private
   * @type {WebGLTexture}
   */
  this.texture_ = null;

  /**
   * @private
   * @type {Image}
   */
  this.image_ = image;

};
goog.inherits(ol.webgl.Texture, ol.webgl.GLObject);


/**
 */
ol.webgl.Texture.prototype.bind = function() {
  var gl = this.getGL();
  if (goog.isNull(this.texture_)) {
    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA, goog.webgl.RGBA,
        goog.webgl.UNSIGNED_BYTE, this.image_);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER,
        goog.webgl.NEAREST);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER,
        goog.webgl.NEAREST);
    this.texture_ = texture;
  } else {
    gl.bindTexture(goog.webgl.TEXTURE_2D, this.texture_);
  }
};


/**
 * @inheritDoc
 */
ol.webgl.Texture.prototype.setGL = function(gl) {
  if (!goog.isNull(this.gl)) {
    if (!goog.isNull(this.texture_)) {
      this.gl.deleteTexture(this.texture_);
      this.texture_ = null;
    }
  }
  goog.base(this, 'setGL', gl);
};
