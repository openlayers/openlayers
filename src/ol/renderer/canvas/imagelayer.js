goog.provide('ol.renderer.canvas.ImageLayer');

goog.require('ol');
goog.require('ol.View');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.functions');
goog.require('ol.proj');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.source.ImageVector');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Image} imageLayer Single image layer.
 */
ol.renderer.canvas.ImageLayer = function(imageLayer) {

  ol.renderer.canvas.Layer.call(this, imageLayer);

  /**
   * @private
   * @type {?ol.ImageBase}
   */
  this.image_ = null;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.imageTransform_ = ol.transform.create();

  /**
   * @private
   * @type {?ol.Transform}
   */
  this.imageTransformInv_ = null;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.hitCanvasContext_ = null;

};
ol.inherits(ol.renderer.canvas.ImageLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.ImageLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  var layer = this.getLayer();
  var source = layer.getSource();
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var skippedFeatureUids = frameState.skippedFeatureUids;
  return source.forEachFeatureAtCoordinate(
      coordinate, resolution, rotation, skippedFeatureUids,
      /**
       * @param {ol.Feature|ol.render.Feature} feature Feature.
       * @return {?} Callback result.
       */
      function(feature) {
        return callback.call(thisArg, feature, layer);
      });
};


/**
 * @param {ol.Pixel} pixel Pixel.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.layer.Layer, ol.Color): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.canvas.ImageLayer.prototype.forEachLayerAtPixel = function(pixel, frameState, callback, thisArg) {
  if (!this.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource() instanceof ol.source.ImageVector) {
    // for ImageVector sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    var coordinate = ol.transform.apply(
        frameState.pixelToCoordinateTransform, pixel.slice());
    var hasFeature = this.forEachFeatureAtCoordinate(
        coordinate, frameState, ol.functions.TRUE, this);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer(), null);
    } else {
      return undefined;
    }
  } else {
    // for all other image sources directly check the image
    if (!this.imageTransformInv_) {
      this.imageTransformInv_ = ol.transform.invert(this.imageTransform_.slice());
    }

    var pixelOnCanvas =
        this.getPixelOnCanvas(pixel, this.imageTransformInv_);

    if (!this.hitCanvasContext_) {
      this.hitCanvasContext_ = ol.dom.createCanvasContext2D(1, 1);
    }

    this.hitCanvasContext_.clearRect(0, 0, 1, 1);
    this.hitCanvasContext_.drawImage(
        this.getImage(), pixelOnCanvas[0], pixelOnCanvas[1], 1, 1, 0, 0, 1, 1);

    var imageData = this.hitCanvasContext_.getImageData(0, 0, 1, 1).data;
    if (imageData[3] > 0) {
      return callback.call(thisArg, this.getLayer(),  imageData);
    } else {
      return undefined;
    }
  }
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.ImageLayer.prototype.getImage = function() {
  return !this.image_ ? null : this.image_.getImage();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.ImageLayer.prototype.getImageTransform = function() {
  return this.imageTransform_;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.ImageLayer.prototype.prepareFrame = function(frameState, layerState) {

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewResolution = viewState.resolution;

  var image;
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
        goog.DEBUG && console.assert(ol.proj.equivalent(projection, sourceProjection),
            'projection and sourceProjection are equivalent');
        projection = sourceProjection;
      }
    }
    image = imageSource.getImage(
        renderedExtent, viewResolution, pixelRatio, projection);
    if (image) {
      var loaded = this.loadImage(image);
      if (loaded) {
        this.image_ = image;
      }
    }
  }

  if (this.image_) {
    image = this.image_;
    var imageExtent = image.getExtent();
    var imageResolution = image.getResolution();
    var imagePixelRatio = image.getPixelRatio();
    var scale = pixelRatio * imageResolution /
        (viewResolution * imagePixelRatio);
    var transform = ol.transform.reset(this.imageTransform_);
    ol.transform.translate(transform,
        pixelRatio * frameState.size[0] / 2,
        pixelRatio * frameState.size[1] / 2);
    ol.transform.scale(transform, scale, scale);
    ol.transform.translate(transform,
        imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
        imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution);
    this.imageTransformInv_ = null;
    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
  }

  return !!this.image_;
};
