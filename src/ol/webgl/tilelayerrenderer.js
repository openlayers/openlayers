goog.provide('ol.webgl.TileLayerRenderer');

goog.require('goog.asserts');
goog.require('goog.events.EventType');
goog.require('goog.webgl');
goog.require('ol.TileLayer');
goog.require('ol.webgl.LayerRenderer');



/**
 * @constructor
 * @extends {ol.webgl.LayerRenderer}
 * @param {ol.webgl.Map} map Map.
 * @param {ol.TileLayer} tileLayer Tile layer.
 */
ol.webgl.TileLayerRenderer = function(map, tileLayer) {

  goog.base(this, map, tileLayer);

  /**
   * @type {goog.math.Size}
   * @private
   */
  this.size_ = null;

  /**
   * @type {WebGLTexture}
   * @private
   */
  this.texture_ = null;

  /**
   * @type {WebGLRenderbuffer}
   * @private
   */
  this.renderbuffer_ = null;

  /**
   * @type {WebGLFramebuffer}
   * @private
   */
  this.framebuffer_ = null;

  /**
   * @type {goog.math.Size}
   * @private
   */
  this.framebufferSize_ = null;

};
goog.inherits(ol.webgl.TileLayerRenderer, ol.webgl.LayerRenderer);


/**
 * @private
 */
ol.webgl.TileLayerRenderer.prototype.bindFramebuffer_ = function() {

  var gl = this.getGL();

  goog.asserts.assert(!goog.isNull(this.size_));

  if (!goog.isNull(this.framebufferSize_) &&
      goog.math.Size.equals(this.framebufferSize_, this.size_)) {
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, this.framebuffer_);
  } else {

    var size = this.size_;

    var texture = gl.createTexture();
    gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
    gl.texImage2D(goog.webgl.TEXTURE_2D, 0, gl.RGBA, size.width, size.height,
        0, goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, null);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER,
        goog.webgl.NEAREST);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER,
        goog.webgl.NEAREST);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S,
        goog.webgl.REPEAT);
    gl.texParameteri(goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T,
        goog.webgl.REPEAT);

    var renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(
        gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size.width, size.height);

    var framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(goog.webgl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(goog.webgl.FRAMEBUFFER,
        goog.webgl.COLOR_ATTACHMENT0, goog.webgl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(goog.webgl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER, renderbuffer);

    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteRenderbuffer(this.renderbuffer_);
    gl.deleteTexture(this.texture_);

    this.texture_ = texture;
    this.renderbuffer_ = renderbuffer;
    this.framebuffer_ = framebuffer;

  }

};


/**
 * @protected
 */
ol.webgl.TileLayerRenderer.prototype.dispatchChangeEvent = function() {
  this.dispatchEvent(goog.events.EventType.CHANGE);
};


/**
 * @protected
 */
ol.webgl.TileLayerRenderer.prototype.disposeInternal = function() {
  var gl = this.getGL();
  if (!gl.isContextLost()) {
    gl.deleteFramebuffer(this.framebuffer_);
    gl.deleteRenderbuffer(this.renderbuffer_);
    gl.deleteTexture(this.texture_);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.handleLayerOpacityChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @inheritDoc
 */
ol.webgl.TileLayerRenderer.prototype.handleLayerVisibleChange = function() {
  this.dispatchChangeEvent();
};


/**
 * @param {goog.math.Size} size Size.
 * @private
 */
ol.webgl.TileLayerRenderer.prototype.setSize_ = function(size) {
  this.size_ = size;
};
