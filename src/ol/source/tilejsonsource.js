// FIXME check order of async callbacks

/**
 * @see http://mapbox.com/developers/api/
 */

goog.provide('ol.source.TileJSON');
goog.provide('ol.tilejson');

goog.require('goog.asserts');
goog.require('goog.net.Jsonp');
goog.require('ol.Attribution');
goog.require('ol.TileRange');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.source.State');
goog.require('ol.source.TileImage');



/**
 * @classdesc
 * Layer source for tile data in TileJSON format.
 *
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.TileJSONOptions} options TileJSON options.
 * @api stable
 */
ol.source.TileJSON = function(options) {

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    projection: ol.proj.get('EPSG:3857'),
    reprojectionErrorThreshold: options.reprojectionErrorThreshold,
    state: ol.source.State.LOADING,
    tileLoadFunction: options.tileLoadFunction,
    wrapX: options.wrapX !== undefined ? options.wrapX : true
  });

  var request = new goog.net.Jsonp(options.url);
  request.send(undefined, goog.bind(this.handleTileJSONResponse, this),
      goog.bind(this.handleTileJSONError, this));

};
goog.inherits(ol.source.TileJSON, ol.source.TileImage);


/**
 * @protected
 * @param {TileJSON} tileJSON Tile JSON.
 */
ol.source.TileJSON.prototype.handleTileJSONResponse = function(tileJSON) {

  var epsg4326Projection = ol.proj.get('EPSG:4326');

  var sourceProjection = this.getProjection();
  var extent;
  if (tileJSON.bounds !== undefined) {
    var transform = ol.proj.getTransformFromProjections(
        epsg4326Projection, sourceProjection);
    extent = ol.extent.applyTransform(tileJSON.bounds, transform);
  }

  if (tileJSON.scheme !== undefined) {
    goog.asserts.assert(tileJSON.scheme == 'xyz', 'tileJSON-scheme is "xyz"');
  }
  var minZoom = tileJSON.minzoom || 0;
  var maxZoom = tileJSON.maxzoom || 22;
  var tileGrid = ol.tilegrid.createXYZ({
    extent: ol.tilegrid.extentFromProjection(sourceProjection),
    maxZoom: maxZoom,
    minZoom: minZoom
  });
  this.tileGrid = tileGrid;

  this.tileUrlFunction =
      ol.TileUrlFunction.createFromTemplates(tileJSON.tiles, tileGrid);

  if (tileJSON.attribution !== undefined && !this.getAttributions()) {
    var attributionExtent = extent !== undefined ?
        extent : epsg4326Projection.getExtent();
    /** @type {Object.<string, Array.<ol.TileRange>>} */
    var tileRanges = {};
    var z, zKey;
    for (z = minZoom; z <= maxZoom; ++z) {
      zKey = z.toString();
      tileRanges[zKey] =
          [tileGrid.getTileRangeForExtentAndZ(attributionExtent, z)];
    }
    this.setAttributions([
      new ol.Attribution({
        html: tileJSON.attribution,
        tileRanges: tileRanges
      })
    ]);
  }

  this.setState(ol.source.State.READY);

};


/**
 * @protected
 */
ol.source.TileJSON.prototype.handleTileJSONError = function() {
  this.setState(ol.source.State.ERROR);
};
