// FIXME move colorMatrix_ elsewhere?

goog.provide('ol.renderer.webgl.Layer');

goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('ol.FrameState');
goog.require('ol.layer.Layer');
goog.require('ol.renderer.Layer');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Layer} layer Layer.
 */
ol.renderer.webgl.Layer = function(mapRenderer, layer) {

  goog.base(this, mapRenderer, layer);

  /**
   * @protected
   * @type {WebGLTexture}
   */
  this.texture = null;

  /**
   * @protected
   * @type {WebGLFramebuffer}
   */
  this.framebuffer = null;

  /**
   * @protected
   * @type {number|undefined}
   */
  this.framebufferDimension = undefined;

  /**
   * @protected
   * @type {!goog.vec.Mat4.Number}
   */
  this.texCoordMatrix = goog.vec.Mat4.createNumber();

  /**
   * @protected
   * @type {!goog.vec.Mat4.Number}
   */
  this.projectionMatrix = goog.vec.Mat4.createNumberIdentity();

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.colorMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {number|undefined}
   */
  this.brightness_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.brightnessMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {number|undefined}
   */
  this.contrast_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.contrastMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {number|undefined}
   */
  this.hue_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.hueMatrix_ = goog.vec.Mat4.createFloat32();

  /**
   * @private
   * @type {number|undefined}
   */
  this.saturation_ = undefined;

  /**
   * @private
   * @type {!goog.vec.Mat4.Float32}
   */
  this.saturationMatrix_ = goog.vec.Mat4.createFloat32();

};
goog.inherits(ol.renderer.webgl.Layer, ol.renderer.Layer);


/**
 * @param {ol.FrameState} frameState Frame state.
 * @param {number} framebufferDimension Framebuffer dimension.
 * @protected
 */
ol.renderer.webgl.Layer.prototype.bindFramebuffer =
    function(frameState, framebufferDimension) {

  var mapRenderer = this.getWebGLMapRenderer();
  var gl = mapRenderer.getGL();

  if (!goog.isDef(this.framebufferDimension) ||
      this.framebufferDimension != framebufferDimension) {

    frameState.postRenderFunctions.push(
        goog.partial(function(gl, framebuffer, texture) {
          if (!gl.isContextLost()) {
            gl.deleteFramebuffer(framebuffer);
            gl.deleteTexture(texture);
          }
        }, gl, this.framebuffer, this.texture));

    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA,
        framebufferDimension, framebufferDimension, 0, goog.webgl.RGBA,
        goog.webgl.UNSIGNED_BYTE, null);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER,
        goog.webgl.LINEAR);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER,
        goog.webgl.LINEAR);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
        goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, texture, 0);

    this.texture = texture;
    this.framebuffer = framebuffer;
    this.framebufferDimension = framebufferDimension;

  } else {
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer);
  }

};


/**
 * @param {number} brightness Brightness.
 * @param {number} contrast Contrast.
 * @param {number} hue Hue.
 * @param {number} saturation Saturation.
 * @return {!goog.vec.Mat4.Float32} Color matrix.
 */
ol.renderer.webgl.Layer.prototype.getColorMatrix = function(
    brightness, contrast, hue, saturation) {
  var colorMatrixDirty = false;
  if (brightness !== this.brightness_) {
    ol.vec.Mat4.makeBrightness(this.brightnessMatrix_, brightness);
    this.brightness_ = brightness;
    colorMatrixDirty = true;
  }
  if (contrast !== this.contrast_) {
    ol.vec.Mat4.makeContrast(this.contrastMatrix_, contrast);
    this.contrast_ = contrast;
    colorMatrixDirty = true;
  }
  if (hue !== this.hue_) {
    ol.vec.Mat4.makeHue(this.hueMatrix_, hue);
    this.hue_ = hue;
    colorMatrixDirty = true;
  }
  if (saturation !== this.saturation_) {
    ol.vec.Mat4.makeSaturation(this.saturationMatrix_, saturation);
    this.saturation_ = saturation;
    colorMatrixDirty = true;
  }
  if (colorMatrixDirty) {
    this.updateColorMatrix_();
  }
  return this.colorMatrix_;
};


/**
 * @protected
 * @return {ol.renderer.webgl.Map} MapRenderer.
 */
ol.renderer.webgl.Layer.prototype.getWebGLMapRenderer = function() {
  return /** @type {ol.renderer.webgl.Map} */ (this.getMapRenderer());
};


/**
 * @return {!goog.vec.Mat4.Number} Matrix.
 */
ol.renderer.webgl.Layer.prototype.getTexCoordMatrix = function() {
  return this.texCoordMatrix;
};


/**
 * @return {WebGLTexture} Texture.
 */
ol.renderer.webgl.Layer.prototype.getTexture = function() {
  return this.texture;
};


/**
 * @return {!goog.vec.Mat4.Number} Matrix.
 */
ol.renderer.webgl.Layer.prototype.getProjectionMatrix = function() {
  return this.projectionMatrix;
};


/**
 * Handle webglcontextlost.
 */
ol.renderer.webgl.Layer.prototype.handleWebGLContextLost = function() {
  this.texture = null;
  this.framebuffer = null;
  this.framebufferDimension = undefined;
};


/**
 * @private
 */
ol.renderer.webgl.Layer.prototype.updateColorMatrix_ = function() {
  var colorMatrix = this.colorMatrix_;
  goog.vec.Mat4.makeIdentity(colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.contrastMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.brightnessMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.saturationMatrix_, colorMatrix);
  goog.vec.Mat4.multMat(colorMatrix, this.hueMatrix_, colorMatrix);
};
