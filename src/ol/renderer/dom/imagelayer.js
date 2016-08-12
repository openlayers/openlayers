goog.provide('ol.renderer.dom.ImageLayer');

goog.require('ol');
goog.require('ol.View');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.renderer.dom.Layer');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.dom.Layer}
 * @param {ol.layer.Image} imageLayer Image layer.
 */
ol.renderer.dom.ImageLayer = function(imageLayer) {
  var target = document.createElement('DIV');
  target.style.position = 'absolute';

  ol.renderer.dom.Layer.call(this, imageLayer, target);

  /**
   * The last rendered image.
   * @private
   * @type {?ol.ImageBase}
   */
  this.image_ = null;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.transform_ = ol.transform.create();

};
ol.inherits(ol.renderer.dom.ImageLayer, ol.renderer.dom.Layer);


/**
 * @inheritDoc
 */
ol.renderer.dom.ImageLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, callback, thisArg) {
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
 * @inheritDoc
 */
ol.renderer.dom.ImageLayer.prototype.clearFrame = function() {
  ol.dom.removeChildren(this.target);
  this.image_ = null;
};


/**
 * @inheritDoc
 */
ol.renderer.dom.ImageLayer.prototype.prepareFrame = function(frameState, layerState) {

  var viewState = frameState.viewState;
  var viewCenter = viewState.center;
  var viewResolution = viewState.resolution;
  var viewRotation = viewState.rotation;

  var image = this.image_;
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
    var image_ = imageSource.getImage(renderedExtent, viewResolution,
        frameState.pixelRatio, projection);
    if (image_) {
      var loaded = this.loadImage(image_);
      if (loaded) {
        image = image_;
      }
    }
  }

  if (image) {
    var imageExtent = image.getExtent();
    var imageResolution = image.getResolution();
    var transform = ol.transform.create();
    ol.transform.compose(transform,
        frameState.size[0] / 2, frameState.size[1] / 2,
        imageResolution / viewResolution, imageResolution / viewResolution,
        viewRotation,
        (imageExtent[0] - viewCenter[0]) / imageResolution,
        (viewCenter[1] - imageExtent[3]) / imageResolution);

    if (image != this.image_) {
      var imageElement = image.getImage(this);
      // Bootstrap sets the style max-width: 100% for all images, which breaks
      // prevents the image from being displayed in FireFox.  Workaround by
      // overriding the max-width style.
      imageElement.style.maxWidth = 'none';
      imageElement.style.position = 'absolute';
      ol.dom.removeChildren(this.target);
      this.target.appendChild(imageElement);
      this.image_ = image;
    }
    this.setTransform_(transform);
    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
  }

  return true;
};


/**
 * @param {ol.Transform} transform Transform.
 * @private
 */
ol.renderer.dom.ImageLayer.prototype.setTransform_ = function(transform) {
  if (!ol.array.equals(transform, this.transform_)) {
    ol.dom.transformElement2D(this.target, transform, 6);
    ol.transform.setFromArray(this.transform_, transform);
  }
};
