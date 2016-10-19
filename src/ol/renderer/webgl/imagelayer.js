goog.provide('ol.renderer.webgl.ImageLayer');

goog.require('ol');
goog.require('ol.View');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.functions');
goog.require('ol.proj');
goog.require('ol.renderer.webgl.Layer');
goog.require('ol.source.ImageVector');
goog.require('ol.transform');
goog.require('ol.webgl');
goog.require('ol.webgl.Context');


/**
 * @constructor
 * @extends {ol.renderer.webgl.Layer}
 * @param {ol.renderer.webgl.Map} mapRenderer Map renderer.
 * @param {ol.layer.Image} imageLayer Tile layer.
 */
ol.renderer.webgl.ImageLayer = function(mapRenderer, imageLayer) {

  ol.renderer.webgl.Layer.call(this, mapRenderer, imageLayer);

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
   * @type {?ol.Transform}
   */
  this.hitTransformationMatrix_ = null;

};
ol.inherits(ol.renderer.webgl.ImageLayer, ol.renderer.webgl.Layer);


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
      gl, imageElement, ol.webgl.CLAMP_TO_EDGE, ol.webgl.CLAMP_TO_EDGE);
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  var layer = this.getLayer();
  var source = layer.getSource();
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var skippedFeatureUids = frameState.skippedFeatureUids;
  return source.forEachFeatureAtCoordinate(
      coordinate, resolution, rotation, hitTolerance, skippedFeatureUids,

      /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @return {?} Callback result.
       */
      function(feature) {
        return callback.call(thisArg, feature, layer);
      });
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.prepareFrame = function(frameState, layerState, context) {

  var gl = this.mapRenderer.getGL();

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewResolution = viewState.resolution;
  var viewRotation = viewState.rotation;

  var image = this.image_;
  var texture = this.texture;
  var imageLayer = /** @type {ol.layer.Image} */ (this.getLayer());
  var imageSource = imageLayer.getSource();

  var hints = frameState.viewHints;

  var renderedExtent = frameState.extent;
  if (layerState.extent !== undefined) {
    renderedExtent = ol.extent.getIntersection(
        renderedExtent, layerState.extent);
  }
  if (!hints[ol.View.Hint.ANIMATING] && !hints[ol.View.Hint.INTERACTING] &&
      !ol.extent.isEmpty(renderedExtent)) {
    var projection = viewState.projection;
    if (!ol.ENABLE_RASTER_REPROJECTION) {
      var sourceProjection = imageSource.getProjection();
      if (sourceProjection) {
        ol.DEBUG && console.assert(ol.proj.equivalent(projection, sourceProjection),
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
          /**
           * @param {WebGLRenderingContext} gl GL.
           * @param {WebGLTexture} texture Texture.
           */
          var postRenderFunction = function(gl, texture) {
            if (!gl.isContextLost()) {
              gl.deleteTexture(texture);
            }
          }.bind(null, gl, this.texture);
          frameState.postRenderFunctions.push(
            /** @type {ol.PostRenderFunction} */ (postRenderFunction)
          );
        }
      }
    }
  }

  if (image) {
    ol.DEBUG && console.assert(texture, 'texture is truthy');

    var canvas = this.mapRenderer.getContext().getCanvas();

    this.updateProjectionMatrix_(canvas.width, canvas.height,
        pixelRatio, viewCenter, viewResolution, viewRotation,
        image.getExtent());
    this.hitTransformationMatrix_ = null;

    // Translate and scale to flip the Y coord.
    var texCoordMatrix = this.texCoordMatrix;
    ol.transform.reset(texCoordMatrix);
    ol.transform.scale(texCoordMatrix, 1, -1);
    ol.transform.translate(texCoordMatrix, 0, -1);

    this.image_ = image;
    this.texture = texture;

    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
  }

  return !!image;
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
ol.renderer.webgl.ImageLayer.prototype.updateProjectionMatrix_ = function(canvasWidth, canvasHeight, pixelRatio,
        viewCenter, viewResolution, viewRotation, imageExtent) {

  var canvasExtentWidth = canvasWidth * viewResolution;
  var canvasExtentHeight = canvasHeight * viewResolution;

  var projectionMatrix = this.projectionMatrix;
  ol.transform.reset(projectionMatrix);
  ol.transform.scale(projectionMatrix,
      pixelRatio * 2 / canvasExtentWidth,
      pixelRatio * 2 / canvasExtentHeight);
  ol.transform.rotate(projectionMatrix, -viewRotation);
  ol.transform.translate(projectionMatrix,
      imageExtent[0] - viewCenter[0],
      imageExtent[1] - viewCenter[1]);
  ol.transform.scale(projectionMatrix,
      (imageExtent[2] - imageExtent[0]) / 2,
      (imageExtent[3] - imageExtent[1]) / 2);
  ol.transform.translate(projectionMatrix, 1, 1);

};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.hasFeatureAtCoordinate = function(coordinate, frameState) {
  var hasFeature = this.forEachFeatureAtCoordinate(
      coordinate, frameState, 0, ol.functions.TRUE, this);
  return hasFeature !== undefined;
};


/**
 * @inheritDoc
 */
ol.renderer.webgl.ImageLayer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {
  if (!this.image_ || !this.image_.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource() instanceof ol.source.ImageVector) {
    // for ImageVector sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    var coordinate = ol.transform.apply(
        frameState.pixelToCoordinateTransform, pixel.slice());
    var hasFeature = this.forEachFeatureAtCoordinate(
        coordinate, frameState, 0, ol.functions.TRUE, this);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer(), null);
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

    var pixelOnFrameBuffer = ol.transform.apply(
        this.hitTransformationMatrix_, pixel.slice());

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
      return callback.call(thisArg, this.getLayer(),  imageData);
    } else {
      return undefined;
    }
  }
};


/**
 * The transformation matrix to get the pixel on the image for a
 * pixel on the map.
 * @param {ol.Size} mapSize The map size.
 * @param {ol.Size} imageSize The image size.
 * @return {ol.Transform} The transformation matrix.
 * @private
 */
ol.renderer.webgl.ImageLayer.prototype.getHitTransformationMatrix_ = function(mapSize, imageSize) {
  // the first matrix takes a map pixel, flips the y-axis and scales to
  // a range between -1 ... 1
  var mapCoordTransform = ol.transform.create();
  ol.transform.translate(mapCoordTransform, -1, -1);
  ol.transform.scale(mapCoordTransform, 2 / mapSize[0], 2 / mapSize[1]);
  ol.transform.translate(mapCoordTransform, 0, mapSize[1]);
  ol.transform.scale(mapCoordTransform, 1, -1);

  // the second matrix is the inverse of the projection matrix used in the
  // shader for drawing
  var projectionMatrixInv = ol.transform.invert(this.projectionMatrix.slice());

  // the third matrix scales to the image dimensions and flips the y-axis again
  var transform = ol.transform.create();
  ol.transform.translate(transform, 0, imageSize[1]);
  ol.transform.scale(transform, 1, -1);
  ol.transform.scale(transform, imageSize[0] / 2, imageSize[1] / 2);
  ol.transform.translate(transform, 1, 1);

  ol.transform.multiply(transform, projectionMatrixInv);
  ol.transform.multiply(transform, mapCoordTransform);

  return transform;
};
