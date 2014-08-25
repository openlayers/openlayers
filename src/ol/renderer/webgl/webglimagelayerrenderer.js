goog.provide('ol.renderer.webgl.ImageLayer');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');
goog.require('ol.ViewHint');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.renderer.webgl.Layer');
goog.require('ol.source.Image');



/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Image} imageLayer Tile layer.
 */
ol.renderer.webgl.ImageLayer = function(mapRenderer, imageLayer) {

  goog.base(this, mapRenderer, imageLayer);

  /**
   * The last rendered image.
   * @private
   * @type {?ol.ImageBase}
   */
  this.image_ = null;

};
goog.inherits(ol.renderer.webgl.ImageLayer, ol.renderer.webgl.Layer);


/**
 * @param {ol.ImageBase} image Image.
 * @private
 * @return {WebGLTexture} Texture.
 */
ol.renderer.webgl.ImageLayer.prototype.createTexture_ = function(image) {

  // We meet the conditions to work with non-power of two textures.
  // http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
  // http://learningwebgl.com/blog/?p=2101

  var imageElement = image.getImageElement();
  var gl = this.getWebGLMapRenderer().getGL();

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
ol.renderer.webgl.ImageLayer.prototype.forEachFeatureAtPixel =
    function(coordinate, frameState, callback, thisArg) {
  var layer = this.getLayer();
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.Image);
  var extent = frameState.extent;
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var skippedFeatureUids = frameState.skippedFeatureUids;
  return source.forEachFeatureAtPixel(
      extent, resolution, rotation, coordinate, skippedFeatureUids,

      /**
       * @param {ol.Feature} feature Feature.
       * @return {?} Callback result.
       */
      function(feature) {
        return callback.call(thisArg, feature, layer);
      });
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.prepareFrame =
    function(frameState, layerState) {

  var gl = this.getWebGLMapRenderer().getGL();

  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewResolution = viewState.resolution;
  var viewRotation = viewState.rotation;

  var image = this.image_;
  var texture = this.texture;
  var imageLayer = this.getLayer();
  goog.asserts.assertInstanceof(imageLayer, ol.layer.Image);
  var imageSource = imageLayer.getSource();
  goog.asserts.assertInstanceof(imageSource, ol.source.Image);

  var hints = frameState.viewHints;

  var renderedExtent = frameState.extent;
  if (goog.isDef(layerState.extent)) {
    renderedExtent = ol.extent.getIntersection(
        renderedExtent, layerState.extent);
  }
  if (!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING] &&
      !ol.extent.isEmpty(renderedExtent)) {
    var image_ = imageSource.getImage(renderedExtent, viewResolution,
        frameState.pixelRatio, viewState.projection);
    if (!goog.isNull(image_)) {
      var imageState = image_.getState();
      if (imageState == ol.ImageState.IDLE) {
        goog.events.listenOnce(image_, goog.events.EventType.CHANGE,
            this.handleImageChange, false, this);
        image_.load();
      } else if (imageState == ol.ImageState.LOADED) {
        image = image_;
        texture = this.createTexture_(image_);
        if (!goog.isNull(this.texture)) {
          frameState.postRenderFunctions.push(
              goog.partial(
                  /**
                   * @param {WebGLRenderingContext} gl GL.
                   * @param {WebGLTexture} texture Texture.
                   */
                  function(gl, texture) {
                    if (!gl.isContextLost()) {
                      gl.deleteTexture(texture);
                    }
                  }, gl, this.texture));
        }
      }
    }
  }

  if (!goog.isNull(image)) {
    goog.asserts.assert(!goog.isNull(texture));

    var canvas = this.getWebGLMapRenderer().getContext().getCanvas();

    this.updateProjectionMatrix_(canvas.width, canvas.height,
        viewCenter, viewResolution, viewRotation, image.getExtent());

    // Translate and scale to flip the Y coord.
    var texCoordMatrix = this.texCoordMatrix;
    goog.vec.Mat4.makeIdentity(texCoordMatrix);
    goog.vec.Mat4.scale(texCoordMatrix, 1, -1, 1);
    goog.vec.Mat4.translate(texCoordMatrix, 0, -1, 0);

    this.image_ = image;
    this.texture = texture;

    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
  }

  return true;
};


/**
 * @param {number} canvasWidth Canvas width.
 * @param {number} canvasHeight Canvas height.
 * @param {ol.Coordinate} viewCenter View center.
 * @param {number} viewResolution View resolution.
 * @param {number} viewRotation View rotation.
 * @param {ol.Extent} imageExtent Image extent.
 * @private
 */
ol.renderer.webgl.ImageLayer.prototype.updateProjectionMatrix_ =
    function(canvasWidth, canvasHeight, viewCenter,
        viewResolution, viewRotation, imageExtent) {

  var canvasExtentWidth = canvasWidth * viewResolution;
  var canvasExtentHeight = canvasHeight * viewResolution;

  var projectionMatrix = this.projectionMatrix;
  goog.vec.Mat4.makeIdentity(projectionMatrix);
  goog.vec.Mat4.scale(projectionMatrix,
      2 / canvasExtentWidth, 2 / canvasExtentHeight, 1);
  goog.vec.Mat4.rotateZ(projectionMatrix, -viewRotation);
  goog.vec.Mat4.translate(projectionMatrix,
      imageExtent[0] - viewCenter[0],
      imageExtent[1] - viewCenter[1],
      0);
  goog.vec.Mat4.scale(projectionMatrix,
      (imageExtent[2] - imageExtent[0]) / 2,
      (imageExtent[3] - imageExtent[1]) / 2,
      1);
  goog.vec.Mat4.translate(projectionMatrix, 1, 1, 0);

};
