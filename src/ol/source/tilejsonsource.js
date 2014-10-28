// FIXME add some error checking
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
goog.require('ol.tilegrid.XYZ');



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
    crossOrigin: options.crossOrigin,
    projection: ol.proj.get('EPSG:3857'),
    state: ol.source.State.LOADING,
    tileLoadFunction: options.tileLoadFunction
  });

  /**
   * @type {boolean|undefined}
   * @private
   */
  this.wrapX_ = options.wrapX;

  var request = new goog.net.Jsonp(options.url);
  request.send(undefined, goog.bind(this.handleTileJSONResponse, this));

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
  if (goog.isDef(tileJSON.bounds)) {
    var transform = ol.proj.getTransformFromProjections(
        epsg4326Projection, sourceProjection);
    extent = ol.extent.applyTransform(tileJSON.bounds, transform);
  }

  if (goog.isDef(tileJSON.scheme)) {
    goog.asserts.assert(tileJSON.scheme == 'xyz');
  }
  var minZoom = tileJSON.minzoom || 0;
  var maxZoom = tileJSON.maxzoom || 22;
  var tileGrid = new ol.tilegrid.XYZ({
    extent: ol.tilegrid.extentFromProjection(sourceProjection),
    maxZoom: maxZoom,
    minZoom: minZoom
  });
  this.tileGrid = tileGrid;

  this.tileUrlFunction = ol.TileUrlFunction.withTileCoordTransform(
      tileGrid.createTileCoordTransform({
        extent: extent,
        wrapX: this.wrapX_
      }),
      ol.TileUrlFunction.createFromTemplates(tileJSON.tiles));

  if (goog.isDef(tileJSON.attribution)) {
    var attributionExtent = goog.isDef(extent) ?
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
