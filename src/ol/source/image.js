import _ol_ from '../index';
import _ol_ImageState_ from '../imagestate';
import _ol_array_ from '../array';
import _ol_events_Event_ from '../events/event';
import _ol_extent_ from '../extent';
import _ol_proj_ from '../proj';
import _ol_reproj_Image_ from '../reproj/image';
import _ol_source_Source_ from '../source/source';

/**
 * @classdesc
 * Abstract base class; normally only used for creating subclasses and not
 * instantiated in apps.
 * Base class for sources providing a single image.
 *
 * @constructor
 * @abstract
 * @extends {ol.source.Source}
 * @param {ol.SourceImageOptions} options Single image source options.
 * @api
 */
var _ol_source_Image_ = function(options) {
  _ol_source_Source_.call(this, {
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

_ol_.inherits(_ol_source_Image_, _ol_source_Source_);


/**
 * @return {Array.<number>} Resolutions.
 * @override
 */
_ol_source_Image_.prototype.getResolutions = function() {
  return this.resolutions_;
};


/**
 * @protected
 * @param {number} resolution Resolution.
 * @return {number} Resolution.
 */
_ol_source_Image_.prototype.findNearestResolution = function(resolution) {
  if (this.resolutions_) {
    var idx = _ol_array_.linearFindNearest(this.resolutions_, resolution, 0);
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
_ol_source_Image_.prototype.getImage = function(extent, resolution, pixelRatio, projection) {
  var sourceProjection = this.getProjection();
  if (!_ol_.ENABLE_RASTER_REPROJECTION ||
      !sourceProjection ||
      !projection ||
      _ol_proj_.equivalent(sourceProjection, projection)) {
    if (sourceProjection) {
      projection = sourceProjection;
    }
    return this.getImageInternal(extent, resolution, pixelRatio, projection);
  } else {
    if (this.reprojectedImage_) {
      if (this.reprojectedRevision_ == this.getRevision() &&
          _ol_proj_.equivalent(
              this.reprojectedImage_.getProjection(), projection) &&
          this.reprojectedImage_.getResolution() == resolution &&
          _ol_extent_.equals(this.reprojectedImage_.getExtent(), extent)) {
        return this.reprojectedImage_;
      }
      this.reprojectedImage_.dispose();
      this.reprojectedImage_ = null;
    }

    this.reprojectedImage_ = new _ol_reproj_Image_(
        sourceProjection, projection, extent, resolution, pixelRatio,
        function(extent, resolution, pixelRatio) {
          return this.getImageInternal(extent, resolution,
              pixelRatio, sourceProjection);
        }.bind(this));
    this.reprojectedRevision_ = this.getRevision();

    return this.reprojectedImage_;
  }
};


/**
 * @abstract
 * @param {ol.Extent} extent Extent.
 * @param {number} resolution Resolution.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {ol.ImageBase} Single image.
 * @protected
 */
_ol_source_Image_.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {};


/**
 * Handle image change events.
 * @param {ol.events.Event} event Event.
 * @protected
 */
_ol_source_Image_.prototype.handleImageChange = function(event) {
  var image = /** @type {ol.Image} */ (event.target);
  switch (image.getState()) {
    case _ol_ImageState_.LOADING:
      this.dispatchEvent(
          new _ol_source_Image_.Event(_ol_source_Image_.EventType_.IMAGELOADSTART,
              image));
      break;
    case _ol_ImageState_.LOADED:
      this.dispatchEvent(
          new _ol_source_Image_.Event(_ol_source_Image_.EventType_.IMAGELOADEND,
              image));
      break;
    case _ol_ImageState_.ERROR:
      this.dispatchEvent(
          new _ol_source_Image_.Event(_ol_source_Image_.EventType_.IMAGELOADERROR,
              image));
      break;
    default:
      // pass
  }
};


/**
 * Default image load function for image sources that use ol.Image image
 * instances.
 * @param {ol.Image} image Image.
 * @param {string} src Source.
 */
_ol_source_Image_.defaultImageLoadFunction = function(image, src) {
  image.getImage().src = src;
};


/**
 * @classdesc
 * Events emitted by {@link ol.source.Image} instances are instances of this
 * type.
 *
 * @constructor
 * @extends {ol.events.Event}
 * @implements {oli.source.ImageEvent}
 * @param {string} type Type.
 * @param {ol.Image} image The image.
 */
_ol_source_Image_.Event = function(type, image) {

  _ol_events_Event_.call(this, type);

  /**
   * The image related to the event.
   * @type {ol.Image}
   * @api
   */
  this.image = image;

};
_ol_.inherits(_ol_source_Image_.Event, _ol_events_Event_);


/**
 * @enum {string}
 * @private
 */
_ol_source_Image_.EventType_ = {

  /**
   * Triggered when an image starts loading.
   * @event ol.source.Image.Event#imageloadstart
   * @api
   */
  IMAGELOADSTART: 'imageloadstart',

  /**
   * Triggered when an image finishes loading.
   * @event ol.source.Image.Event#imageloadend
   * @api
   */
  IMAGELOADEND: 'imageloadend',

  /**
   * Triggered if image loading results in an error.
   * @event ol.source.Image.Event#imageloaderror
   * @api
   */
  IMAGELOADERROR: 'imageloaderror'

};
export default _ol_source_Image_;
