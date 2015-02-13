goog.provide('ol.source.GWC');

goog.require('ol.Attribution');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.extent.Corner');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid.TileGrid');



/**
 * @classdesc
 * Layer source for tile data directly from GeoWebCache cache directory.
 *
 * See http://geowebcache.org for further information.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.GWCOptions} options GWC options.
 * @api stable
 */
ol.source.GWC = function(options) {
  var projection = goog.isDef(options.projection) ?
      options.projection : 'EPSG:3857';

  var tileGrid;
  if (goog.isDef(options.tileGrid)) {
    tileGrid = options.tileGrid;
  } else {
    var extent = ol.tilegrid.extentFromProjection(projection);
    tileGrid = new ol.tilegrid.TileGrid({
      extent: extent,
      maxZoom: options.maxZoom,
      tileSize: options.tileSize,
      resolutions: ol.tilegrid.resolutionsFromExtent(
          extent, options.maxZoom, options.tileSize),
      origin: ol.extent.getCorner(extent, ol.extent.Corner.BOTTOM_LEFT)
    });
  }

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: projection,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: this.tileUrlFunction
  });

  /**
   * @private
   * @type {string}
   */
  this.url_ = options.url;

  /**
   * @private
   * @type {string}
   */
  this.layer_ = options.layer;

  /**
   * @private
   * @type {string}
   */
  this.gridset_ = options.gridset;

  /**
   * @private
   * @type {string|undefined}
   */
  this.extension_ = goog.isDef(options.extension) ?
      options.extension : 'png';

  /**
   * Create a zero padded string optionally with a radix for casting numbers.
   *
   * @param {number} num The number to be zero padded.
   * @param {number} len The length of the string to be returned.
   * @param {number=} opt_radix An integer between 2 and 36 specifying the
   *     base to use for representing numeric values.
   * @private
   * @return {string} zero padded string
   */
  this.zeroPad_ = function(num, len, opt_radix) {
    var str = num.toString(opt_radix || 10);
    while (str.length < len) {
      str = '0' + str;
    }
    return str;
  };

  /**
   * @private
   * @type {ol.TileCoordTransformType}
   */
  this.tileCoordTransform_ = tileGrid.createTileCoordTransform({
    wrapX: options.wrapX
  });

  this.setTileUrlFunction(goog.bind(this.tileUrlFunction, this));
};
goog.inherits(ol.source.GWC, ol.source.TileImage);


/**
 * @param {ol.TileCoord} tileCoord Tile Coordinate.
 * @param {number} pixelRatio Pixel ratio.
 * @param {ol.proj.Projection} projection Projection.
 * @return {string|undefined} Tile URL.
 */
ol.source.GWC.prototype.tileUrlFunction =
    function(tileCoord, pixelRatio, projection) {
  var z = tileCoord[0];
  var x = tileCoord[1];
  var y = tileCoord[2];

  var shift = z / 2 | 0;
  var half = Math.pow(2, shift + 1);
  var digits = 1;
  if (half > 10) {
    digits = ((Math.log(half) / Math.LN10).toFixed(14) | 0) + 1;
  }
  var halfX = x / half | 0;
  var halfY = y / half | 0;

  var zs = this.zeroPad_(tileCoord[0], 2, 10);
  var xs = this.zeroPad_(halfX, digits) + '_' + this.zeroPad_(halfY, digits);
  var ys = this.zeroPad_(x, 2 * digits) + '_' + this.zeroPad_(y, 2 * digits);

  return this.url_ + '/' + this.layer_ + '/' + this.gridset_ + '_' +
      zs + '/' + xs + '/' + ys + '.' + this.extension_;
};


/**
 * @inheritDoc
 * @api
 */
ol.source.GWC.prototype.setTileUrlFunction = function(tileUrlFunction) {
  goog.base(this, 'setTileUrlFunction',
      ol.TileUrlFunction.withTileCoordTransform(
          this.tileCoordTransform_, tileUrlFunction));
};
