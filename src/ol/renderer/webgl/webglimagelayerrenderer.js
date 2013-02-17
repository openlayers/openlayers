goog.provide('ol.renderer.webgl.ImageLayer');

goog.require('goog.vec.Mat4');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.Image');
goog.require('ol.ImageState');
goog.require('ol.ViewHint');
goog.require('ol.layer.ImageLayer');
goog.require('ol.renderer.webgl.Layer');



/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.ImageLayer} imageLayer Tile layer.
 */
ol.renderer.webgl.ImageLayer = function(mapRenderer, imageLayer) {

  goog.base(this, mapRenderer, imageLayer);

  /**
   * The last rendered image.
   * @private
   * @type {?ol.Image}
   */
  this.image_ = null;

  /**
   * The last rendered texture.
   * @private
   * @type {WebGLTexture}
   */
  this.texture_ = null;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.texCoordMatrix_ = goog.vec.Mat4.createNumberIdentity();

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.vertexCoordMatrix_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.renderer.webgl.ImageLayer, ol.renderer.webgl.Layer);


/**
 * @private
 * @param {ol.Image} image Image.
 * @return {WebGLTexture} Texture.
 */
ol.renderer.webgl.ImageLayer.prototype.createTexture_ = function(image) {

  // We meet the conditions to work with non-power of two textures.
  // http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
  // http://learningwebgl.com/blog/?p=2101

  var imageElement = image.getImageElement(this);
  var gl = this.getMapRenderer().getGL();

  var texture = gl.createTexture();

  gl.bindTexture(goog.webgl.TEXTURE_2D, texture);
  gl.texImage2D(goog.webgl.TEXTURE_2D, 0, goog.webgl.RGBA,
      goog.webgl.RGBA, goog.webgl.UNSIGNED_BYTE, imageElement);

  gl.texParameteri(
      goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_S,
      goog.webgl.CLAMP_TO_EDGE);
  gl.texParameteri(
      goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_WRAP_T,
      goog.webgl.CLAMP_TO_EDGE);
  gl.texParameteri(
      goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MIN_FILTER, goog.webgl.LINEAR);
  gl.texParameteri(
      goog.webgl.TEXTURE_2D, goog.webgl.TEXTURE_MAG_FILTER, goog.webgl.LINEAR);

  return texture;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.disposeInternal = function() {
  var mapRenderer = this.getMapRenderer();
  var gl = mapRenderer.getGL();
  if (!gl.isContextLost()) {
    gl.deleteTexture(this.texture_);
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.getTexCoordMatrix = function() {
  return this.texCoordMatrix_;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.getTexture = function() {
  return this.texture_;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.getVertexCoordMatrix = function() {
  return this.vertexCoordMatrix_;
};


/**
 * @return {ol.layer.ImageLayer} Tile layer.
 */
ol.renderer.webgl.ImageLayer.prototype.getImageLayer = function() {
  return /** @type {ol.layer.ImageLayer} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.handleWebGLContextLost = function() {
  this.texture_ = null;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.renderFrame =
    function(frameState, layerState) {

  var gl = this.getMapRenderer().getGL();

  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;

  var image = this.image_;
  var texture = this.texture_;
  var imageLayer = this.getImageLayer();
  var imageSource = imageLayer.getImageSource();

  var hints = frameState.viewHints;

  if (!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.PANNING]) {
    var image_ = imageSource.getImage(frameState.extent, viewResolution);
    if (!goog.isNull(image_)) {
      var imageState = image_.getState();
      if (imageState == ol.ImageState.IDLE) {
        goog.events.listenOnce(image_, goog.events.EventType.CHANGE,
            this.handleImageChange, false, this);
        image_.load();
      } else if (imageState == ol.ImageState.LOADED) {
        image = image_;
        texture = this.createTexture_(image_);
        if (!goog.isNull(this.texture_)) {
          frameState.postRenderFunctions.push(
              goog.partial(function(gl, texture) {
                if (!gl.isContextLost()) {
                  gl.deleteTexture(texture);
                }
              }, gl, this.texture_));
        }
      }
    }
  }

  if (!goog.isNull(image)) {
    goog.asserts.assert(!goog.isNull(texture));

    var canvas = this.getMapRenderer().getCanvas();

    this.updateVertexCoordMatrix_(canvas.width, canvas.height,
        viewCenter, viewResolution, viewRotation, image.getExtent());

    // Translate and scale to flip the Y coord.
    var texCoordMatrix = this.texCoordMatrix_;
    goog.vec.Mat4.makeIdentity(texCoordMatrix);
    goog.vec.Mat4.scale(texCoordMatrix, 1, -1, 1);
    goog.vec.Mat4.translate(texCoordMatrix, 0, -1, 0);

    this.image_ = image;
    this.texture_ = texture;
  }
};


/**
 * @private
 * @param {number} canvasWidth Canvas width.
 * @param {number} canvasHeight Canvas height.
 * @param {ol.Coordinate} viewCenter View center.
 * @param {number} viewResolution View resolution.
 * @param {number} viewRotation View rotation.
 * @param {ol.Extent} imageExtent Image extent.
 */
ol.renderer.webgl.ImageLayer.prototype.updateVertexCoordMatrix_ =
    function(canvasWidth, canvasHeight, viewCenter,
        viewResolution, viewRotation, imageExtent) {

  var canvasExtentWidth = canvasWidth * viewResolution;
  var canvasExtentHeight = canvasHeight * viewResolution;

  var vertexCoordMatrix = this.vertexCoordMatrix_;
  goog.vec.Mat4.makeIdentity(vertexCoordMatrix);
  goog.vec.Mat4.scale(vertexCoordMatrix,
      2 / canvasExtentWidth, 2 / canvasExtentHeight, 1);
  goog.vec.Mat4.rotateZ(vertexCoordMatrix, -viewRotation);
  goog.vec.Mat4.translate(vertexCoordMatrix,
      imageExtent.minX - viewCenter.x,
      imageExtent.minY - viewCenter.y,
      0);
  goog.vec.Mat4.scale(vertexCoordMatrix,
      imageExtent.getWidth() / 2, imageExtent.getHeight() / 2, 1);
  goog.vec.Mat4.translate(vertexCoordMatrix, 1, 1, 0);

};
