goog.provide('ol.source.ImageStatic');

goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('ol.Image');
goog.require('ol.ImageState');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.Image');
goog.require('ol.source.State');



/**
 * @classdesc
 * An image source for 'static', that is, non-georeferenced, images.
 * See examples/static-image for example.
 *
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageStaticOptions} options Options.
 * @api stable
 */
ol.source.ImageStatic = function(options) {

  var attributions = goog.isDef(options.attributions) ?
      options.attributions : null;

  var imageExtent = options.imageExtent;

  var state, resolution, resolutions;
  if (goog.isDef(options.imageSize)) {
    state = ol.source.State.READY;
    resolution = ol.extent.getHeight(imageExtent) / options.imageSize[1];
    resolutions = [resolution];
  } else {
    state = ol.source.State.LOADING;
  }

  var crossOrigin = goog.isDef(options.crossOrigin) ?
      options.crossOrigin : null;

  goog.base(this, {
    attributions: attributions,
    logo: options.logo,
    projection: ol.proj.get(options.projection),
    resolutions: resolutions,
    state: state
  });

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = new ol.Image(imageExtent, resolution, 1, attributions,
      options.url, crossOrigin);

  if (state !== ol.source.State.READY) {
    goog.events.listen(this.image_, goog.events.EventType.CHANGE,
        this.handleImageChange_, false, this);
    this.image_.load();
  }

};
goog.inherits(ol.source.ImageStatic, ol.source.Image);


/**
 * @inheritDoc
 */
ol.source.ImageStatic.prototype.getImage =
    function(extent, resolution, pixelRatio, projection) {
  if (ol.extent.intersects(extent, this.image_.getExtent())) {
    return this.image_;
  }
  return null;
};


/**
 * Handle image change events.
 * @private
 */
ol.source.ImageStatic.prototype.handleImageChange_ = function() {
  var imageState = this.image_.getState();
  if (imageState === ol.ImageState.LOADED) {
    this.setState(ol.source.State.READY);
  } else if (imageState === ol.ImageState.ERROR) {
    this.setState(ol.source.State.ERROR);
  }
};
