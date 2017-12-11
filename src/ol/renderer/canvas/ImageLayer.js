goog.provide('ol.renderer.canvas.ImageLayer');

goog.require('ol');
goog.require('ol.ImageCanvas');
goog.require('ol.LayerType');
goog.require('ol.ViewHint');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.layer.VectorRenderType');
goog.require('ol.obj');
goog.require('ol.plugins');
goog.require('ol.renderer.Type');
goog.require('ol.renderer.canvas.IntermediateCanvas');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.canvas.IntermediateCanvas}
 * @param {ol.layer.Image} imageLayer Single image layer.
 * @api
 */
ol.renderer.canvas.ImageLayer = function(imageLayer) {

  ol.renderer.canvas.IntermediateCanvas.call(this, imageLayer);

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
   * @type {!Array.<string>}
   */
  this.skippedFeatures_ = [];

  /**
   * @private
   * @type {ol.renderer.canvas.VectorLayer}
   */
  this.vectorRenderer_ = null;

};
ol.inherits(ol.renderer.canvas.ImageLayer, ol.renderer.canvas.IntermediateCanvas);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
ol.renderer.canvas.ImageLayer['handles'] = function(type, layer) {
  return type === ol.renderer.Type.CANVAS && (layer.getType() === ol.LayerType.IMAGE ||
      layer.getType() === ol.LayerType.VECTOR &&
      /** @type {ol.layer.Vector} */ (layer).getRenderMode() === ol.layer.VectorRenderType.IMAGE);
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.canvas.ImageLayer} The layer renderer.
 */
ol.renderer.canvas.ImageLayer['create'] = function(mapRenderer, layer) {
  var renderer = new ol.renderer.canvas.ImageLayer(/** @type {ol.layer.Image} */ (layer));
  if (layer.getType() === ol.LayerType.VECTOR) {
    var candidates = ol.plugins.getLayerRendererPlugins();
    for (var i = 0, ii = candidates.length; i < ii; ++i) {
      var candidate = /** @type {Object.<string, Function>} */ (candidates[i]);
      if (candidate !== ol.renderer.canvas.ImageLayer && candidate['handles'](ol.renderer.Type.CANVAS, layer)) {
        renderer.setVectorRenderer(candidate['create'](mapRenderer, layer));
      }
    }
  }
  return renderer;
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

  if (!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING] &&
      !ol.extent.isEmpty(renderedExtent)) {
    var projection = viewState.projection;
    if (!ol.ENABLE_RASTER_REPROJECTION) {
      var sourceProjection = imageSource.getProjection();
      if (sourceProjection) {
        projection = sourceProjection;
      }
    }
    var vectorRenderer = this.vectorRenderer_;
    if (vectorRenderer) {
      var context = vectorRenderer.context;
      var imageFrameState = /** @type {olx.FrameState} */ (ol.obj.assign({}, frameState, {
        size: [
          ol.extent.getWidth(renderedExtent) / viewResolution,
          ol.extent.getHeight(renderedExtent) / viewResolution
        ],
        viewState: /** @type {olx.ViewState} */ (ol.obj.assign({}, frameState.viewState, {
          rotation: 0
        }))
      }));
      var skippedFeatures = Object.keys(imageFrameState.skippedFeatureUids).sort();
      if (vectorRenderer.prepareFrame(imageFrameState, layerState) &&
          (vectorRenderer.replayGroupChanged ||
          !ol.array.equals(skippedFeatures, this.skippedFeatures_))) {
        context.canvas.width = imageFrameState.size[0] * pixelRatio;
        context.canvas.height = imageFrameState.size[1] * pixelRatio;
        vectorRenderer.composeFrame(imageFrameState, layerState, context);
        this.image_ = new ol.ImageCanvas(renderedExtent, viewResolution, pixelRatio, context.canvas);
        this.skippedFeatures_ = skippedFeatures;
      }
    } else {
      image = imageSource.getImage(
          renderedExtent, viewResolution, pixelRatio, projection);
      if (image) {
        var loaded = this.loadImage(image);
        if (loaded) {
          this.image_ = image;
        }
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
    var transform = ol.transform.compose(this.imageTransform_,
        pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
        scale, scale,
        0,
        imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
        imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution);
    ol.transform.compose(this.coordinateToCanvasPixelTransform,
        pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
        pixelRatio / viewResolution, -pixelRatio / viewResolution,
        0,
        -viewCenter[0], -viewCenter[1]);

    this.updateLogos(frameState, imageSource);
    this.renderedResolution = imageResolution * pixelRatio / imagePixelRatio;
  }

  return !!this.image_;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.ImageLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  if (this.vectorRenderer_) {
    return this.vectorRenderer_.forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg);
  } else {
    return ol.renderer.canvas.IntermediateCanvas.prototype.forEachFeatureAtCoordinate.call(this, coordinate, frameState, hitTolerance, callback, thisArg);
  }
};


/**
 * @param {ol.renderer.canvas.VectorLayer} renderer Vector renderer.
 */
ol.renderer.canvas.ImageLayer.prototype.setVectorRenderer = function(renderer) {
  this.vectorRenderer_ = renderer;
};
