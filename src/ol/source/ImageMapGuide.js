/**
 * @module ol/source/ImageMapGuide
 */
import {inherits} from '../index.js';
import _ol_Image_ from '../Image.js';
import _ol_events_ from '../events.js';
import EventType from '../events/EventType.js';
import {containsExtent, getCenter, getHeight, getWidth, scaleFromCenter} from '../extent.js';
import _ol_obj_ from '../obj.js';
import ImageSource from '../source/Image.js';
import _ol_uri_ from '../uri.js';

/**
 * @classdesc
 * Source for images from Mapguide servers
 *
 * @constructor
 * @fires ol.source.Image.Event
 * @extends {ol.source.Image}
 * @param {olx.source.ImageMapGuideOptions} options Options.
 * @api
 */
var ImageMapGuide = function(options) {

  ImageSource.call(this, {
    projection: options.projection,
    resolutions: options.resolutions
  });

  /**
   * @private
   * @type {?string}
   */
  this.crossOrigin_ =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

  /**
   * @private
   * @type {number}
   */
  this.displayDpi_ = options.displayDpi !== undefined ?
    options.displayDpi : 96;

  /**
   * @private
   * @type {!Object}
   */
  this.params_ = options.params || {};

  /**
   * @private
   * @type {string|undefined}
   */
  this.url_ = options.url;

  /**
   * @private
   * @type {ol.ImageLoadFunctionType}
   */
  this.imageLoadFunction_ = options.imageLoadFunction !== undefined ?
    options.imageLoadFunction : ImageSource.defaultImageLoadFunction;

  /**
   * @private
   * @type {boolean}
   */
  this.hidpi_ = options.hidpi !== undefined ? options.hidpi : true;

  /**
   * @private
   * @type {number}
   */
  this.metersPerUnit_ = options.metersPerUnit !== undefined ?
    options.metersPerUnit : 1;

  /**
   * @private
   * @type {number}
   */
  this.ratio_ = options.ratio !== undefined ? options.ratio : 1;

  /**
   * @private
   * @type {boolean}
   */
  this.useOverlay_ = options.useOverlay !== undefined ?
    options.useOverlay : false;

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_ = 0;

};

inherits(ImageMapGuide, ImageSource);


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @api
 */
ImageMapGuide.prototype.getParams = function() {
  return this.params_;
};


/**
 * @inheritDoc
 */
ImageMapGuide.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  resolution = this.findNearestResolution(resolution);
  pixelRatio = this.hidpi_ ? pixelRatio : 1;

  var image = this.image_;
  if (image &&
      this.renderedRevision_ == this.getRevision() &&
      image.getResolution() == resolution &&
      image.getPixelRatio() == pixelRatio &&
      containsExtent(image.getExtent(), extent)) {
    return image;
  }

  if (this.ratio_ != 1) {
    extent = extent.slice();
    scaleFromCenter(extent, this.ratio_);
  }
  var width = getWidth(extent) / resolution;
  var height = getHeight(extent) / resolution;
  var size = [width * pixelRatio, height * pixelRatio];

  if (this.url_ !== undefined) {
    var imageUrl = this.getUrl(this.url_, this.params_, extent, size,
        projection);
    image = new _ol_Image_(extent, resolution, pixelRatio,
        imageUrl, this.crossOrigin_,
        this.imageLoadFunction_);
    _ol_events_.listen(image, EventType.CHANGE,
        this.handleImageChange, this);
  } else {
    image = null;
  }
  this.image_ = image;
  this.renderedRevision_ = this.getRevision();

  return image;
};


/**
 * Return the image load function of the source.
 * @return {ol.ImageLoadFunctionType} The image load function.
 * @api
 */
ImageMapGuide.prototype.getImageLoadFunction = function() {
  return this.imageLoadFunction_;
};


/**
 * @param {ol.Extent} extent The map extents.
 * @param {ol.Size} size The viewport size.
 * @param {number} metersPerUnit The meters-per-unit value.
 * @param {number} dpi The display resolution.
 * @return {number} The computed map scale.
 */
ImageMapGuide.getScale = function(extent, size, metersPerUnit, dpi) {
  var mcsW = getWidth(extent);
  var mcsH = getHeight(extent);
  var devW = size[0];
  var devH = size[1];
  var mpp = 0.0254 / dpi;
  if (devH * mcsW > devW * mcsH) {
    return mcsW * metersPerUnit / (devW * mpp); // width limited
  } else {
    return mcsH * metersPerUnit / (devH * mpp); // height limited
  }
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @api
 */
ImageMapGuide.prototype.updateParams = function(params) {
  _ol_obj_.assign(this.params_, params);
  this.changed();
};


/**
 * @param {string} baseUrl The mapagent url.
 * @param {Object.<string, string|number>} params Request parameters.
 * @param {ol.Extent} extent Extent.
 * @param {ol.Size} size Size.
 * @param {ol.proj.Projection} projection Projection.
 * @return {string} The mapagent map image request URL.
 */
ImageMapGuide.prototype.getUrl = function(baseUrl, params, extent, size, projection) {
  var scale = ImageMapGuide.getScale(extent, size,
      this.metersPerUnit_, this.displayDpi_);
  var center = getCenter(extent);
  var baseParams = {
    'OPERATION': this.useOverlay_ ? 'GETDYNAMICMAPOVERLAYIMAGE' : 'GETMAPIMAGE',
    'VERSION': '2.0.0',
    'LOCALE': 'en',
    'CLIENTAGENT': 'ol.source.ImageMapGuide source',
    'CLIP': '1',
    'SETDISPLAYDPI': this.displayDpi_,
    'SETDISPLAYWIDTH': Math.round(size[0]),
    'SETDISPLAYHEIGHT': Math.round(size[1]),
    'SETVIEWSCALE': scale,
    'SETVIEWCENTERX': center[0],
    'SETVIEWCENTERY': center[1]
  };
  _ol_obj_.assign(baseParams, params);
  return _ol_uri_.appendParams(baseUrl, baseParams);
};


/**
 * Set the image load function of the MapGuide source.
 * @param {ol.ImageLoadFunctionType} imageLoadFunction Image load function.
 * @api
 */
ImageMapGuide.prototype.setImageLoadFunction = function(
    imageLoadFunction) {
  this.image_ = null;
  this.imageLoadFunction_ = imageLoadFunction;
  this.changed();
};
export default ImageMapGuide;
