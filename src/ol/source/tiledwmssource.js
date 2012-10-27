// FIXME add minZoom support

goog.provide('ol.source.TiledWMS');
goog.provide('ol.source.TiledWMSOptions');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('ol.Attribution');
goog.require('ol.Projection');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.source.TileSource');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{attributions: (Array.<ol.Attribution>|undefined),
 *            params: Object,
 *            version: (string|undefined),
 *            crossOrigin: (null|string|undefined),
 *            extent: (ol.Extent|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined),
 *            maxZoom: (number|undefined),
 *            projection: (ol.Projection|undefined),
 *            url: (string|undefined),
 *            urls: (Array.<string>|undefined)}}
 */
ol.source.TiledWMSOptions;



/**
 * @constructor
 * @extends {ol.source.TileSource}
 * @param {ol.source.TiledWMSOptions} tiledWMSOptions options.
 */
ol.source.TiledWMS = function(tiledWMSOptions) {
  var projection = goog.isDef(tiledWMSOptions.projection) ?
      tiledWMSOptions.projection : ol.Projection.getFromCode('EPSG:3857');
  var projectionExtent = projection.getExtent();

  var extent = goog.isDef(tiledWMSOptions.extent) ?
      tiledWMSOptions.extent : projectionExtent;

  var version = goog.isDef(tiledWMSOptions.version) ?
      tiledWMSOptions.version : '1.3';

  var tileGrid = tiledWMSOptions.tileGrid;
  if (!goog.isDef(tileGrid)) {
    // FIXME Factor this out to a more central/generic place.
    var size = Math.max(
        projectionExtent.maxX - projectionExtent.minX,
        projectionExtent.maxY - projectionExtent.minY);
    var maxZoom = goog.isDef(tiledWMSOptions.maxZoom) ?
        tiledWMSOptions.maxZoom : 18;
    var resolutions = new Array(maxZoom + 1);
    for (var z = 0, zz = resolutions.length; z < zz; ++z) {
      resolutions[z] = size / (256 << z);
    }
    tileGrid = new ol.tilegrid.TileGrid({
      origin: projectionExtent.getTopLeft(),
      resolutions: resolutions
    });
  }

  function tileUrlFunction(tileCoord) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    }
    var tileSize = tileGrid.getTileSize();
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    var params = {
      'SERVICE': 'WMS',
      'VERSION': version,
      'REQUEST': 'GetMap',
      'WIDTH': tileSize.width,
      'HEIGHT': tileSize.height,
      'STYLES': '',
      'FORMAT': 'image/png',
      'TRANSPARENT': true,
      // FIXME Projection dependant axis order.
      'BBOX': [
        tileExtent.minX, tileExtent.minY, tileExtent.maxX, tileExtent.maxY
      ].join(',')
    };
    params[version >= '1.3' ? 'CRS' : 'SRS'] = projection.getCode();
    goog.object.extend(params, tiledWMSOptions.params);
    var url = tiledWMSOptions.urls ?
        tiledWMSOptions.urls[goog.math.modulo(
            tileCoord.hash(), tiledWMSOptions.urls.length)] :
        tiledWMSOptions.url;
    for (var param in params) {
      url += (~url.indexOf('?') ? '&' : '?') +
          param + '=' + encodeURIComponent(params[param]);
    }
    return url;
  }

  function tileCoordTransform(tileCoord) {
    if (tileGrid.getResolutions().length <= tileCoord.z) {
      return null;
    }
    var x = tileCoord.x;
    // FIXME do we want a wrapDateLine param? The code below will break maps
    // with projections that do not span the whole world width.
    if (extent.minX === projectionExtent.minX &&
        extent.maxX === projectionExtent.maxX) {
      var n = 1 << tileCoord.z;
      x = goog.math.modulo(x, n);
    }
    var tileExtent = tileGrid.getTileCoordExtent(
        new ol.TileCoord(tileCoord.z, x, tileCoord.y));
    // FIXME We shouldn't need a typecast here.
    if (!tileExtent.intersects(/** @type {ol.Extent} */ (extent))) {
      return null;
    }
    return new ol.TileCoord(tileCoord.z, x, tileCoord.y);
  }

  goog.base(this, {
    attributions: tiledWMSOptions.attributions,
    crossOrigin: tiledWMSOptions.crossOrigin,
    extent: extent,
    tileGrid: tileGrid,
    projection: projection,
    tileUrlFunction: ol.TileUrlFunction.withTileCoordTransform(
        tileCoordTransform, tileUrlFunction)
  });

};
goog.inherits(ol.source.TiledWMS, ol.source.TileSource);
