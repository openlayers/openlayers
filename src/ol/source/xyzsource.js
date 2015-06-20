goog.provide('ol.source.XYZ');

goog.require('ol.Attribution');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.TileImage');



/**
 * @classdesc
 * Layer source for tile data with URLs in a set XYZ format.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.XYZOptions} options XYZ options.
 * @api stable
 */
ol.source.XYZ = function(options) {
  var projection = goog.isDef(options.projection) ?
      options.projection : 'EPSG:3857';

  var tileGrid = goog.isDef(options.tileGrid) ? options.tileGrid :
      ol.tilegrid.createXYZ({
        extent: ol.tilegrid.extentFromProjection(projection),
        maxZoom: options.maxZoom,
        tileSize: options.tileSize
      });

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    projection: projection,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: ol.TileUrlFunction.nullTileUrlFunction,
    wrapX: goog.isDef(options.wrapX) ? options.wrapX : true
  });

  if (goog.isDef(options.tileUrlFunction)) {
    this.setTileUrlFunction(options.tileUrlFunction);
  } else if (goog.isDef(options.urls)) {
    this.setUrls(options.urls);
  } else if (goog.isDef(options.url)) {
    this.setUrl(options.url);
  }

};
goog.inherits(ol.source.XYZ, ol.source.TileImage);


/**
 * Set the URL to use for requests.
 * @param {string} url URL.
 * @api stable
 */
ol.source.XYZ.prototype.setUrl = function(url) {
  this.setTileUrlFunction(ol.TileUrlFunction.createFromTemplates(
      ol.TileUrlFunction.expandUrl(url)));
};


/**
 * Set the URLs to use for requests.
 * @param {Array.<string>} urls URLs.
 */
ol.source.XYZ.prototype.setUrls = function(urls) {
  this.setTileUrlFunction(ol.TileUrlFunction.createFromTemplates(urls));
};
