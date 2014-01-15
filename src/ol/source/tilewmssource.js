// FIXME add minZoom support
// FIXME add date line wrap (tile coord transform)

goog.provide('ol.source.TileWMS');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math');
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.uri.utils');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.source.TileImage');
goog.require('ol.source.wms');
goog.require('ol.source.wms.ServerType');



/**
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.TileWMSOptions=} opt_options Tile WMS options.
 * @todo stability experimental
 */
ol.source.TileWMS = function(opt_options) {

  var options = goog.isDef(opt_options) ? opt_options : {};

  var params = goog.isDef(options.params) ? options.params : {};

  var transparent = goog.object.get(params, 'TRANSPARENT', true);

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: options.extent,
    logo: options.logo,
    opaque: !transparent,
    projection: options.projection,
    tileGrid: options.tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tileUrlFunction: goog.bind(this.tileUrlFunction_, this)
  });

  var urls = options.urls;
  if (!goog.isDef(urls) && goog.isDef(options.url)) {
    urls = ol.TileUrlFunction.expandUrl(options.url);
  }

  /**
   * @private
   * @type {Array.<string>|undefined}
   */
  this.urls_ = urls;

  /**
   * @private
   * @type {number}
   */
  this.gutter_ = goog.isDef(options.gutter) ? options.gutter : 0;

  /**
   * @private
   * @type {Object}
   */
  this.params_ = params;

  /**
   * @private
   * @type {boolean}
   */
  this.v13_ = true;

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
   * @type {string}
   */
  this.coordKeyPrefix_ = '';
  this.resetCoordKeyPrefix_();

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = ol.extent.createEmpty();

  this.updateV13_();

};
goog.inherits(ol.source.TileWMS, ol.source.TileImage);


/**
 * @inheritDoc
 */
ol.source.TileWMS.prototype.getGutter = function() {
  return this.gutter_;
};


/**
 * @inheritDoc
 */
ol.source.TileWMS.prototype.getKeyZXY = function(z, x, y) {
  return this.coordKeyPrefix_ + goog.base(this, 'getKeyZXY', z, x, y);
};


/**
 * Get the user-provided params, i.e. those passed to the constructor through
 * the "params" option, and possibly updated using the updateParams method.
 * @return {Object} Params.
 * @todo stability experimental
 */
ol.source.TileWMS.prototype.getParams = function() {
  return this.params_;
};


/**
 * @param {number} z Z.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {number} Size.
 */
ol.source.TileWMS.prototype.getTilePixelSize =
    function(z, pixelRatio, projection) {
  var tileSize = goog.base(this, 'getTilePixelSize', z, pixelRatio, projection);
  if (pixelRatio == 1 || !this.hidpi_ || !goog.isDef(this.serverType_)) {
    return tileSize;
  } else {
    return (tileSize * pixelRatio + 0.5) | 0;
  }
};


/**
 * @private
 */
ol.source.TileWMS.prototype.resetCoordKeyPrefix_ = function() {
  var i = 0;
  var res = [];
  for (var key in this.params_) {
    res[i++] = key + '-' + this.params_[key];
  }
  this.coordKeyPrefix_ = res.join('/');
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @private
 * @return {string|undefined} Tile URL.
 */
ol.source.TileWMS.prototype.tileUrlFunction_ =
    function(tileCoord, pixelRatio, projection) {

  var urls = this.urls_;
  if (!goog.isDef(urls) || goog.array.isEmpty(urls)) {
    return undefined;
  }

  var tileGrid = this.getTileGrid();
  if (goog.isNull(tileGrid)) {
    tileGrid = this.getTileGridForProjection(projection);
  }

  if (tileGrid.getResolutions().length <= tileCoord.z) {
    return undefined;
  }

  var tileExtent = tileGrid.getTileCoordExtent(tileCoord);

  var params = {
    'SERVICE': 'WMS',
    'VERSION': ol.source.wms.DEFAULT_VERSION,
    'REQUEST': 'GetMap',
    'FORMAT': 'image/png',
    'TRANSPARENT': true
  };
  goog.object.extend(params, this.params_);

  var tileResolution = tileGrid.getResolution(tileCoord.z);
  if (pixelRatio != 1 && (!this.hidpi_ || !goog.isDef(this.serverType_))) {
    pixelRatio = 1;
  }
  var tileSize = tileGrid.getTileSize(tileCoord.z);
  var gutter = this.gutter_;
  if (gutter !== 0) {
    tileSize += 2 * gutter;
    tileExtent =
        ol.extent.buffer(tileExtent, tileResolution * gutter, this.tmpExtent_);
  }
  if (pixelRatio != 1) {
    tileSize = (tileSize * pixelRatio + 0.5) | 0;
  }
  goog.object.set(params, 'WIDTH', tileSize);
  goog.object.set(params, 'HEIGHT', tileSize);

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

  var axisOrientation = projection.getAxisOrientation();
  var bbox;
  if (this.v13_ && axisOrientation.substr(0, 2) == 'ne') {
    bbox = this.tmpExtent_;
    bbox[0] = tileExtent[1];
    bbox[1] = tileExtent[0];
    bbox[2] = tileExtent[3];
    bbox[3] = tileExtent[2];
  } else {
    bbox = tileExtent;
  }
  goog.object.set(params, 'BBOX', bbox.join(','));

  var url;
  if (urls.length == 1) {
    url = urls[0];
  } else {
    var index = goog.math.modulo(tileCoord.hash(), this.urls_.length);
    url = urls[index];
  }
  return goog.uri.utils.appendParamsFromMap(url, params);

};


/**
 * Update the user-provided params.
 * @param {Object} params Params.
 * @todo stability experimental
 */
ol.source.TileWMS.prototype.updateParams = function(params) {
  goog.object.extend(this.params_, params);
  this.resetCoordKeyPrefix_();
  this.updateV13_();
  this.dispatchChangeEvent();
};


/**
 * @private
 */
ol.source.TileWMS.prototype.updateV13_ = function() {
  var version =
      goog.object.get(this.params_, 'VERSION', ol.source.wms.DEFAULT_VERSION);
  this.v13_ = goog.string.compareVersions(version, '1.3') >= 0;
};
