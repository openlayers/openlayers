goog.provide('ol.source.XYZ');

goog.require('ol.TileUrlFunction');
goog.require('ol.source.TileImage');



/**
 * @classdesc
 * Layer source for tile data with URLs in a set XYZ format that are
 * defined in a URL template. By default, this follows the widely-used
 * Google grid where `x` 0 and `y` 0 are in the top left. Grids like
 * TMS where `x` 0 and `y` 0 are in the bottom left can be used by
 * using the `{-y}` placeholder in the URL template, so long as the
 * source does not have a custom tile grid. In this case,
 * {@link ol.source.TileImage} can be used with a `tileUrlFunction`
 * such as:
 *
 *  tileUrlFunction: function(coordinate) {
 *    return 'http://mapserver.com/' + coordinate[0] + '/' +
 *        coordinate[1] + '/' + coordinate[2] + '.png';
 *    }
 *
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.XYZOptions} options XYZ options.
 * @api stable
 */
ol.source.XYZ = function(options) {
  var projection = options.projection !== undefined ?
      options.projection : 'EPSG:3857';

  var tileGrid = options.tileGrid !== undefined ? options.tileGrid :
      ol.tilegrid.createXYZ({
        extent: ol.tilegrid.extentFromProjection(projection),
        maxZoom: options.maxZoom,
        tileSize: options.tileSize
      });

  /**
   * @private
   * @type {!Array.<string>|null}
   */
  this.urls_ = null;

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: ol.TileUrlFunction.nullTileUrlFunction,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

  if (options.tileUrlFunction !== undefined) {
    this.setTileUrlFunction(options.tileUrlFunction);
  } else if (options.urls !== undefined) {
    this.setUrls(options.urls);
  } else if (options.url !== undefined) {
    this.setUrl(options.url);
  }

};
goog.inherits(ol.source.XYZ, ol.source.TileImage);


/**
 * Return the URLs used for this XYZ source.
 * When a tileUrlFunction is used instead of url or urls,
 * null will be returned.
 * @return {!Array.<string>|null} URLs.
 * @api
 */
ol.source.XYZ.prototype.getUrls = function() {
  return this.urls_;
};


/**
 * Set the URL to use for requests.
 * @param {string} url URL.
 * @api stable
 */
ol.source.XYZ.prototype.setUrl = function(url) {
  this.setTileUrlFunction(ol.TileUrlFunction.createFromTemplates(
      ol.TileUrlFunction.expandUrl(url), this.tileGrid));
  this.urls_ = [url];
};


/**
 * Set the URLs to use for requests.
 * @param {Array.<string>} urls URLs.
 */
ol.source.XYZ.prototype.setUrls = function(urls) {
  this.setTileUrlFunction(
      ol.TileUrlFunction.createFromTemplates(urls, this.tileGrid));
  this.urls_ = urls;
};
