goog.provide('ol.source.XYZ');

goog.require('ol');
goog.require('ol.source.TileImage');
goog.require('ol.tilegrid');


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
 * @param {olx.source.XYZOptions=} opt_options XYZ options.
 * @api
 */
ol.source.XYZ = function(opt_options) {
  var options = opt_options || {};
  var projection = options.projection !== undefined ?
    options.projection : 'EPSG:3857';

  var tileGrid = options.tileGrid !== undefined ? options.tileGrid :
    ol.tilegrid.createXYZ({
      extent: ol.tilegrid.extentFromProjection(projection),
      maxZoom: options.maxZoom,
      minZoom: options.minZoom,
      tileSize: options.tileSize
    });

  ol.source.TileImage.call(this, {
    attributions: options.attributions,
    cacheSize: options.cacheSize,
    crossOrigin: options.crossOrigin,
    logo: options.logo,
    opaque: options.opaque,
    projection: projection,
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    tileGrid: tileGrid,
    tileLoadFunction: options.tileLoadFunction,
    tilePixelRatio: options.tilePixelRatio,
    tileUrlFunction: options.tileUrlFunction,
    url: options.url,
    urls: options.urls,
    wrapX: options.wrapX !== undefined ? options.wrapX : true,
    transition: options.transition
  });

};
ol.inherits(ol.source.XYZ, ol.source.TileImage);
