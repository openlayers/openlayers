goog.provide('ol.renderer.canvas.ImageLayer');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.vec.Mat4');
goog.require('ol.ImageBase');
goog.require('ol.ImageState');
goog.require('ol.ViewHint');
goog.require('ol.layer.Image');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.source.Image');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Image} imageLayer Single image layer.
 */
ol.renderer.canvas.ImageLayer = function(mapRenderer, imageLayer) {

  goog.base(this, mapRenderer, imageLayer);

  /**
   * @private
   * @type {?ol.ImageBase}
   */
  this.image_ = null;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.imageTransform_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.renderer.canvas.ImageLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.ImageLayer.prototype.forEachFeatureAtPixel =
    function(coordinate, frameState, callback, thisArg) {
  var layer = this.getLayer();
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.Image);
  var extent = frameState.extent;
  var resolution = frameState.view2DState.resolution;
  var rotation = frameState.view2DState.rotation;
  return source.forEachFeatureAtPixel(extent, resolution, rotation, coordinate,
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
ol.renderer.canvas.ImageLayer.prototype.getImage = function() {
  return goog.isNull(this.image_) ?
      null : this.image_.getImageElement();
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
ol.renderer.canvas.ImageLayer.prototype.prepareFrame =
    function(frameState, layerState) {

  var pixelRatio = frameState.pixelRatio;
  var view2DState = frameState.view2DState;
  var viewCenter = view2DState.center;
  var viewResolution = view2DState.resolution;
  var viewRotation = view2DState.rotation;

  var image;
  var imageLayer = this.getLayer();
  goog.asserts.assertInstanceof(imageLayer, ol.layer.Image);
  var imageSource = imageLayer.getSource();
  goog.asserts.assertInstanceof(imageSource, ol.source.Image);

  var hints = frameState.viewHints;

  if (!hints[ol.ViewHint.ANIMATING] && !hints[ol.ViewHint.INTERACTING]) {
    image = imageSource.getImage(
        frameState.extent, viewResolution, pixelRatio, view2DState.projection);
    if (!goog.isNull(image)) {
      var imageState = image.getState();
      if (imageState == ol.ImageState.IDLE) {
        goog.events.listenOnce(image, goog.events.EventType.CHANGE,
            this.handleImageChange, false, this);
        image.load();
      } else if (imageState == ol.ImageState.LOADED) {
        this.image_ = image;
      }
    }
  }

  if (!goog.isNull(this.image_)) {
    image = this.image_;
    var imageExtent = image.getExtent();
    var imageResolution = image.getResolution();
    var imagePixelRatio = image.getPixelRatio();
    var scale = pixelRatio * imageResolution /
        (viewResolution * imagePixelRatio);
    ol.vec.Mat4.makeTransform2D(this.imageTransform_,
        pixelRatio * frameState.size[0] / 2,
        pixelRatio * frameState.size[1] / 2,
        scale, scale,
        viewRotation,
        imagePixelRatio * (imageExtent[0] - viewCenter[0]) / imageResolution,
        imagePixelRatio * (viewCenter[1] - imageExtent[3]) / imageResolution);
    this.updateAttributions(frameState.attributions, image.getAttributions());
    this.updateLogos(frameState, imageSource);
  }

};
