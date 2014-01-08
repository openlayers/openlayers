goog.provide('ol.source.ImageWMS');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.uri.utils');
goog.require('ol.Image');
goog.require('ol.extent');
goog.require('ol.source.Image');
goog.require('ol.source.wms');
goog.require('ol.source.wms.ServerType');



/**
 * @constructor
 * @extends {ol.source.Image}
 * @param {olx.source.ImageWMSOptions=} opt_options Options.
 * @todo stability experimental
 */
ol.source.ImageWMS = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    projection: options.projection,
    resolutions: options.resolutions
  });

  /**
   * @private
   * @type {string|undefined}
   */
  this.url_ = options.url;

  /**
   * @private
   * @type {Object}
   */
  this.params_ = options.params;

  /**
   * @private
   * @type {boolean}
   */
  this.v13_ = true;
  this.updateV13_();

  /**
   * @private
   * @type {ol.source.wms.ServerType|undefined}
   */
  this.serverType_ = options.serverType;

  /**
   * @private
   * @type {boolean}
   */
  this.hidpi_ = goog.isDef(options.hidpi) ? options.hidpi : true;

  /**
   * @private
   * @type {ol.Image}
   */
  this.image_ = null;

  /**
   * @private
   * @type {number}
   */
  this.ratio_ = goog.isDef(options.ratio) ? options.ratio : 1.5;

};
goog.inherits(ol.source.ImageWMS, ol.source.Image);


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 */
ol.source.ImageWMS.prototype.getParams = function() {
  return this.params_;
};


/**
 * @inheritDoc
 */
ol.source.ImageWMS.prototype.getImage =
    function(extent, resolution, pixelRatio, projection) {

  if (!goog.isDef(this.url_)) {
    return null;
  }

  resolution = this.findNearestResolution(resolution);

  if (pixelRatio != 1 && (!this.hidpi_ || !goog.isDef(this.serverType_))) {
    pixelRatio = 1;
  }

  var image = this.image_;
  if (!goog.isNull(image) &&
      image.getResolution() == resolution &&
      image.getPixelRatio() == pixelRatio &&
      ol.extent.containsExtent(image.getExtent(), extent)) {
    return image;
  }

  var params = {
    'SERVICE': 'WMS',
    'VERSION': ol.source.wms.DEFAULT_VERSION,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  goog.object.extend(params, this.params_);

  params[this.v13_ ? 'CRS' : 'SRS'] = projection.getCode();

  if (!('STYLES' in this.params_)) {
    goog.object.set(params, 'STYLES', new String(''));
  }

  if (pixelRatio != 1) {
    switch (this.serverType_) {
      case ol.source.wms.ServerType.GEOSERVER:
        var dpi = (90 * pixelRatio + 0.5) | 0;
        goog.object.set(params, 'FORMAT_OPTIONS', 'dpi:' + dpi);
        break;
      case ol.source.wms.ServerType.MAPSERVER:
        goog.object.set(params, 'MAP_RESOLUTION', 90 * pixelRatio);
        break;
      case ol.source.wms.ServerType.QGIS:
        goog.object.set(params, 'DPI', 90 * pixelRatio);
        break;
      default:
        goog.asserts.fail();
        break;
    }
  }

  extent = extent.slice();
  var centerX = (extent[0] + extent[2]) / 2;
  var centerY = (extent[1] + extent[3]) / 2;
  if (this.ratio_ != 1) {
    var halfWidth = this.ratio_ * (extent[2] - extent[0]) / 2;
    var halfHeight = this.ratio_ * (extent[3] - extent[1]) / 2;
    extent[0] = centerX - halfWidth;
    extent[1] = centerY - halfHeight;
    extent[2] = centerX + halfWidth;
    extent[3] = centerY + halfHeight;
  }

  var imageResolution = resolution / pixelRatio;

  // Compute an integer width and height.
  var width = Math.ceil((extent[2] - extent[0]) / imageResolution);
  goog.object.set(params, 'WIDTH', width);
  var height = Math.ceil((extent[3] - extent[1]) / imageResolution);
  goog.object.set(params, 'HEIGHT', height);

  // Modify the extent to match the integer width and height.
  extent[0] = centerX - imageResolution * width / 2;
  extent[2] = centerX + imageResolution * width / 2;
  extent[1] = centerY - imageResolution * height / 2;
  extent[3] = centerY + imageResolution * height / 2;

  var axisOrientation = projection.getAxisOrientation();
  var bbox;
  if (this.v13_ && axisOrientation.substr(0, 2) == 'ne') {
    bbox = [extent[1], extent[0], extent[3], extent[2]];
  } else {
    bbox = extent;
  }
  goog.object.set(params, 'BBOX', bbox.join(','));

  var url = goog.uri.utils.appendParamsFromMap(this.url_, params);

  this.image_ = new ol.Image(extent, resolution, pixelRatio, url,
      this.crossOrigin, this.getAttributions());
  return this.image_;

};


/**
 * @param {string|undefined} url URL.
 */
ol.source.ImageWMS.prototype.setUrl = function(url) {
  if (url != this.url_) {
    this.url_ = url;
    this.image_ = null;
    this.dispatchChangeEvent();
  }
};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 */
ol.source.ImageWMS.prototype.updateParams = function(params) {
  goog.object.extend(this.params_, params);
  this.updateV13_();
  this.image_ = null;
  this.dispatchChangeEvent();
};


/**
 * @private
 */
ol.source.ImageWMS.prototype.updateV13_ = function() {
  var version =
      goog.object.get(this.params_, 'VERSION', ol.source.wms.DEFAULT_VERSION);
  this.v13_ = goog.string.compareVersions(version, '1.3') >= 0;
};
