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
   * @type {ol.Transform}
   */
  this.coordinateToCanvasPixelTransform_ = ol.transform.create();

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
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.layer.Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.canvas.ImageLayer.prototype.forEachLayerAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  if (!this.getImage()) {
    return undefined;
  }

  if (this.getLayer().getSource() instanceof ol.source.ImageVector) {
    // for ImageVector sources use the original hit-detection logic,
    // so that for example also transparent polygons are detected
    var hasFeature = this.forEachFeatureAtCoordinate(
        coordinate, frameState, ol.functions.TRUE, this);

    if (hasFeature) {
      return callback.call(thisArg, this.getLayer(), null);
    } else {
      return undefined;
    }
  } else {
    var pixelOnCanvas = ol.transform.apply(
        this.coordinateToCanvasPixelTransform_, coordinate.slice());

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
 * @return {HTMLCanvasElement|HTMLVideoElement|Image} Canvas.
 */
ol.renderer.canvas.ImageLayer.prototype.getImage = function() {
  return !this.image_ ? null : this.image_.getImage();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.ImageLayer.prototype.prepareFrame = function(frameState, layerState) {

  var pixelRatio = frameState.pixelRatio;
  var size = frameState.size;
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
        ol.DEBUG && console.assert(ol.proj.equivalent(projection, sourceProjection),
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
    var transform = this.imageTransform_;
    ol.transform.compose(transform,
        pixelRatio * frameState.size[0] / 2, pixelRatio * frameState.size[1] / 2,
        scale, scale,
        0,
        imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
        imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution);
    ol.transform.compose(this.coordinateToCanvasPixelTransform_,
        pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
        pixelRatio / viewResolution, -pixelRatio / viewResolution,
        0,
        -viewCenter[0], -viewCenter[1]);
    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
  }

  return !!this.image_;
};


/**
 * @inheritDoc.
 */
ol.renderer.canvas.ImageLayer.prototype.composeFrame = function(frameState, layerState, context) {

  this.preCompose(context, frameState);

  var image = this.getImage();
  if (image) {

    // clipped rendering if layer extent is set
    var extent = layerState.extent;
    var clipped = extent !== undefined;
    if (clipped) {
      this.clip(context, frameState, /** @type {ol.Extent} */ (extent));
    }

    var imageTransform = this.imageTransform_;
    // for performance reasons, context.save / context.restore is not used
    // to save and restore the transformation matrix and the opacity.
    // see http://jsperf.com/context-save-restore-versus-variable
    var alpha = context.globalAlpha;
    context.globalAlpha = layerState.opacity;

    // for performance reasons, context.setTransform is only used
    // when the view is rotated. see http://jsperf.com/canvas-transform
    var dx = imageTransform[4];
    var dy = imageTransform[5];
    var dw = image.width * imageTransform[0];
    var dh = image.height * imageTransform[3];
    context.drawImage(image, 0, 0, +image.width, +image.height,
        Math.round(dx), Math.round(dy), Math.round(dw), Math.round(dh));
    context.globalAlpha = alpha;

    if (clipped) {
      context.restore();
    }
  }

  this.postCompose(context, frameState, layerState);
};
