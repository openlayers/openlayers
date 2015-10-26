goog.provide('ol.source.Image');
goog.provide('ol.source.ImageEvent');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('ol.Attribution');
goog.require('ol.ImageState');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.reproj.Image');
goog.require('ol.source.Source');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            extent: (null|ol.Extent|undefined),
 *            logo: (string|olx.LogoOptions|undefined),
 *            projection: ol.proj.ProjectionLike,
 *            resolutions: (Array.<number>|undefined),
 *            state: (ol.source.State|undefined)}}
 */
ol.source.ImageOptions;



/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing a single image.
 *
 * @constructor
 * @extends {ol.source.Source}
 * @param {ol.source.ImageOptions} options Single image source options.
 * @api
 */
ol.source.Image = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    extent: options.extent,
    logo: options.logo,
    projection: options.projection,
    state: options.state
  });

  /**
   * @private
   * @type {Array.<number>}
   */
  this.resolutions_ = options.resolutions !== undefined ?
      options.resolutions : null;
  goog.asserts.assert(!this.resolutions_ ||
      goog.array.isSorted(this.resolutions_,
          function(a, b) {
            return b - a;
          }, true), 'resolutions must be null or sorted in descending order');


  /**
   * @private
   * @type {ol.reproj.Image}
   */
  this.reprojectedImage_ = null;


  /**
   * @private
   * @type {number}
   */
  this.reprojectedRevision_ = 0;

};
goog.inherits(ol.source.Image, ol.source.Source);


/**
 * @return {Array.<number>} Resolutions.
 */
ol.source.Image.prototype.getResolutions = function() {
  return this.resolutions_;
};


/**
 * @protected
 * @param {number} resolution Resolution.
 * @return {number} Resolution.
 */
ol.source.Image.prototype.findNearestResolution =
    function(resolution) {
  if (this.resolutions_) {
    var idx = ol.array.linearFindNearest(this.resolutions_, resolution, 0);
    resolution = this.resolutions_[idx];
  }
  return resolution;
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.ImageBase} Single image.
 */
ol.source.Image.prototype.getImage =
    function(extent, resolution, pixelRatio, projection) {
  var sourceProjection = this.getProjection();
  if (!ol.ENABLE_RASTER_REPROJECTION ||
      !sourceProjection ||
      !projection ||
      ol.proj.equivalent(sourceProjection, projection)) {
    if (sourceProjection) {
      projection = sourceProjection;
    }
    return this.getImageInternal(extent, resolution, pixelRatio, projection);
  } else {
    if (this.reprojectedImage_) {
      if (this.reprojectedRevision_ == this.getRevision() &&
          ol.proj.equivalent(
              this.reprojectedImage_.getProjection(), projection) &&
          this.reprojectedImage_.getResolution() == resolution &&
          this.reprojectedImage_.getPixelRatio() == pixelRatio &&
          ol.extent.equals(this.reprojectedImage_.getExtent(), extent)) {
        return this.reprojectedImage_;
      }
      this.reprojectedImage_.dispose();
      this.reprojectedImage_ = null;
    }

    this.reprojectedImage_ = new ol.reproj.Image(
        sourceProjection, projection, extent, resolution, pixelRatio,
        goog.bind(function(extent, resolution, pixelRatio) {
          return this.getImageInternal(extent, resolution,
              pixelRatio, sourceProjection);
        }, this));
    this.reprojectedRevision_ = this.getRevision();

    return this.reprojectedImage_;
  }
};


/**
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.ImageBase} Single image.
 * @protected
 */
ol.source.Image.prototype.getImageInternal = goog.abstractMethod;


/**
 * Handle image change events.
 * @param {goog.events.Event} event Event.
 * @protected
 */
ol.source.Image.prototype.handleImageChange = function(event) {
  var image = /** @type {ol.Image} */ (event.target);
  switch (image.getState()) {
    case ol.ImageState.LOADING:
      this.dispatchEvent(
          new ol.source.ImageEvent(ol.source.ImageEventType.IMAGELOADSTART,
              image));
      break;
    case ol.ImageState.LOADED:
      this.dispatchEvent(
          new ol.source.ImageEvent(ol.source.ImageEventType.IMAGELOADEND,
              image));
      break;
    case ol.ImageState.ERROR:
      this.dispatchEvent(
          new ol.source.ImageEvent(ol.source.ImageEventType.IMAGELOADERROR,
              image));
      break;
  }
};


/**
 * Default image load function for image sources that use ol.Image image
 * instances.
 * @param {ol.Image} image Image.
 * @param {string} src Source.
 */
ol.source.Image.defaultImageLoadFunction = function(image, src) {
  image.getImage().src = src;
};



/**
 * @classdesc
 * Events emitted by {@link ol.source.Image} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {goog.events.Event}
 * @implements {oli.source.ImageEvent}
 * @param {string} type Type.
 * @param {ol.Image} image The image.
 */
ol.source.ImageEvent = function(type, image) {

  goog.base(this, type);

  /**
   * The image related to the event.
   * @type {ol.Image}
   * @api
   */
  this.image = image;

};
goog.inherits(ol.source.ImageEvent, goog.events.Event);


/**
 * @enum {string}
 */
ol.source.ImageEventType = {

  /**
   * Triggered when an image starts loading.
   * @event ol.source.ImageEvent#imageloadstart
   * @api
   */
  IMAGELOADSTART: 'imageloadstart',

  /**
   * Triggered when an image finishes loading.
   * @event ol.source.ImageEvent#imageloadend
   * @api
   */
  IMAGELOADEND: 'imageloadend',

  /**
   * Triggered if image loading results in an error.
   * @event ol.source.ImageEvent#imageloaderror
   * @api
   */
  IMAGELOADERROR: 'imageloaderror'

};
