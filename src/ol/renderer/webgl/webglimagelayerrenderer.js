goog.provide('ol.renderer.webgl.ImageLayer');

goog.require('goog.asserts');
goog.require('goog.functions');
goog.require('goog.vec.Mat4');
goog.require('goog.webgl');
goog.require('ol.Coordinate');
goog.require('ol.Extent');
goog.require('ol.ImageBase');
goog.require('ol.ViewHint');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.Image');
goog.require('ol.proj');
goog.require('ol.renderer.webgl.Layer');
goog.require('ol.source.ImageVector');
goog.require('ol.vec.Mat4');
goog.require('ol.webgl.Context');



/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
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

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitCanvasContext_ = null;

  /**
   * @private
   * @type {?goog.vec.Mat4.Number}
   */
  this.hitTransformationMatrix_ = null;

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

  var imageElement = image.getImage();
  var gl = this.mapRenderer.getGL();

  return ol.webgl.Context.createTexture(
      gl, imageElement, goog.webgl.CLAMP_TO_EDGE, goog.webgl.CLAMP_TO_EDGE);
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.forEachFeatureAtCoordinate =
    function(coordinate, frameState, callback, thisArg) {
  var layer = this.getLayer();
  var source = layer.getSource();
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var skippedFeatureUids = frameState.skippedFeatureUids;
  return source.forEachFeatureAtCoordinate(
      coordinate, resolution, rotation, skippedFeatureUids,

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
    function(frameState, layerState, context) {

  var gl = this.mapRenderer.getGL();

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewResolution = viewState.resolution;
  var viewRotation = viewState.rotation;

  var image = this.image_;
  var texture = this.texture;
  var imageLayer = this.getLayer();
  goog.asserts.assertInstanceof(imageLayer, ol.layer.Image,
      'layer is an instance of ol.layer.Image');
  var imageSource = imageLayer.getSource();

  var hints = frameState.viewHints;

  var renderedExtent = frameState.extent;
  if (layerState.extent !== undefined) {
    renderedExtent = ol.extent.getIntersection(
        renderedExtent, layerState.extent);
  }
  if (!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING] &&
      !ol.extent.isEmpty(renderedExtent)) {
    var projection = viewState.projection;
    if (!ol.ENABLE_RASTER_REPROJECTION) {
      var sourceProjection = imageSource.getProjection();
      if (sourceProjection) {
        goog.asserts.assert(ol.proj.equivalent(projection, sourceProjection),
            'projection and sourceProjection are equivalent');
        projection = sourceProjection;
      }
    }
    var image_ = imageSource.getImage(renderedExtent, viewResolution,
        pixelRatio, projection);
    if (image_) {
      var loaded = this.loadImage(image_);
      if (loaded) {
        image = image_;
        texture = this.createTexture_(image_);
        if (this.texture) {
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

  if (image) {
    goog.asserts.assert(texture, 'texture is truthy');

    var canvas = this.mapRenderer.getContext().getCanvas();

    this.updateProjectionMatrix_(canvas.width, canvas.height,
        pixelRatio, viewCenter, viewResolution, viewRotation,
        image.getExtent());
    this.hitTransformationMatrix_ = null;

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
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.Coordinate} viewCenter View center.
 * @param {number} viewResolution View resolution.
 * @param {number} viewRotation View rotation.
 * @param {ol.Extent} imageExtent Image extent.
 * @private
 */
ol.renderer.webgl.ImageLayer.prototype.updateProjectionMatrix_ =
    function(canvasWidth, canvasHeight, pixelRatio,
        viewCenter, viewResolution, viewRotation, imageExtent) {

  var canvasExtentWidth = canvasWidth * viewResolution;
  var canvasExtentHeight = canvasHeight * viewResolution;

  var projectionMatrix = this.projectionMatrix;
  goog.vec.Mat4.makeIdentity(projectionMatrix);
  goog.vec.Mat4.scale(projectionMatrix,
      pixelRatio * 2 / canvasExtentWidth,
      pixelRatio * 2 / canvasExtentHeight, 1);
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


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.hasFeatureAtCoordinate =
    function(coordinate, frameState) {
  var hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, goog.functions.TRUE, this);
  return hasFeature !== undefined;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.forEachLayerAtPixel =
    function(pixel, frameState, callback, thisArg) {
  if (!this.image_ || !this.image_.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource() instanceof ol.source.ImageVector) {
    // for ImageVector sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    var coordinate = pixel.slice();
    ol.vec.Mat4.multVec2(
        frameState.pixelToCoordinateMatrix, coordinate, coordinate);
    var hasFeature = this.forEachFeatureAtCoordinate(
        coordinate, frameState, goog.functions.TRUE, this);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer());
    } else {
      return undefined;
    }
  } else {
    var imageSize =
        [this.image_.getImage().width, this.image_.getImage().height];

    if (!this.hitTransformationMatrix_) {
      this.hitTransformationMatrix_ = this.getHitTransformationMatrix_(
          frameState.size, imageSize);
    }

    var pixelOnFrameBuffer = [0, 0];
    ol.vec.Mat4.multVec2(
        this.hitTransformationMatrix_, pixel, pixelOnFrameBuffer);

    if (pixelOnFrameBuffer[0] < 0 || pixelOnFrameBuffer[0] > imageSize[0] ||
        pixelOnFrameBuffer[1] < 0 || pixelOnFrameBuffer[1] > imageSize[1]) {
      // outside the image, no need to check
      return undefined;
    }

    if (!this.hitCanvasContext_) {
      this.hitCanvasContext_ = ol.dom.createCanvasContext2D(1, 1);
    }

    this.hitCanvasContext_.clearRect(0, 0, 1, 1);
    this.hitCanvasContext_.drawImage(this.image_.getImage(),
        pixelOnFrameBuffer[0], pixelOnFrameBuffer[1], 1, 1, 0, 0, 1, 1);

    var imageData = this.hitCanvasContext_.getImageData(0, 0, 1, 1).data;
    if (imageData[3] > 0) {
      return callback.call(thisArg, this.getLayer());
    } else {
      return undefined;
    }
  }
};


/**
 * The transformation matrix to get the pixel on the image for a
 * pixel on the map.
 * @param {ol.Size} mapSize
 * @param {ol.Size} imageSize
 * @return {goog.vec.Mat4.Number}
 * @private
 */
ol.renderer.webgl.ImageLayer.prototype.getHitTransformationMatrix_ =
    function(mapSize, imageSize) {
  // the first matrix takes a map pixel, flips the y-axis and scales to
  // a range between -1 ... 1
  var mapCoordMatrix = goog.vec.Mat4.createNumber();
  goog.vec.Mat4.makeIdentity(mapCoordMatrix);
  goog.vec.Mat4.translate(mapCoordMatrix, -1, -1, 0);
  goog.vec.Mat4.scale(mapCoordMatrix, 2 / mapSize[0], 2 / mapSize[1], 1);
  goog.vec.Mat4.translate(mapCoordMatrix, 0, mapSize[1], 0);
  goog.vec.Mat4.scale(mapCoordMatrix, 1, -1, 1);

  // the second matrix is the inverse of the projection matrix used in the
  // shader for drawing
  var projectionMatrixInv = goog.vec.Mat4.createNumber();
  goog.vec.Mat4.invert(this.projectionMatrix, projectionMatrixInv);

  // the third matrix scales to the image dimensions and flips the y-axis again
  var imageCoordMatrix = goog.vec.Mat4.createNumber();
  goog.vec.Mat4.makeIdentity(imageCoordMatrix);
  goog.vec.Mat4.translate(imageCoordMatrix, 0, imageSize[1], 0);
  goog.vec.Mat4.scale(imageCoordMatrix, 1, -1, 1);
  goog.vec.Mat4.scale(imageCoordMatrix, imageSize[0] / 2, imageSize[1] / 2, 1);
  goog.vec.Mat4.translate(imageCoordMatrix, 1, 1, 0);

  var transformMatrix = goog.vec.Mat4.createNumber();
  goog.vec.Mat4.multMat(
      imageCoordMatrix, projectionMatrixInv, transformMatrix);
  goog.vec.Mat4.multMat(
      transformMatrix, mapCoordMatrix, transformMatrix);

  return transformMatrix;
};
