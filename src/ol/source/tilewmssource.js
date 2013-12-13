// FIXME add minZoom support

goog.provide('ol.source.TileWMS');

goog.require('goog.array');
goog.require('goog.math');
goog.require('goog.object');
goog.require('ol.TileCoord');
goog.require('ol.TileUrlFunction');
goog.require('ol.extent');
goog.require('ol.source.TileImage');
goog.require('ol.source.wms');



/**
 * @constructor
 * @extends {ol.source.TileImage}
 * @param {olx.source.TileWMSOptions} options Tile WMS options.
 * @todo stability experimental
 */
ol.source.TileWMS = function(options) {

  var tileGrid;
  if (goog.isDef(options.tileGrid)) {
    tileGrid = options.tileGrid;
  }

  var tileUrlFunction = ol.TileUrlFunction.nullTileUrlFunction;
  var urls = options.urls;
  if (!goog.isDef(urls) && goog.isDef(options.url)) {
    urls = ol.TileUrlFunction.expandUrl(options.url);
  }

  /**
   * @private
   * @type {number}
   */
  this.gutter_ = goog.isDef(options.gutter) ? options.gutter : 0;

  /**
   * @private
   * @type {Object}
   */
  this.params_ = options.params;

  /**
   * @private
   * @type {string}
   */
  this.coordKeyPrefix_ = '';
  this.resetCoordKeyPrefix_();

  if (goog.isDef(urls)) {
    var tileUrlFunctions = goog.array.map(
        urls, function(url) {
          return ol.TileUrlFunction.createFromParamsFunction(
              url, this.params_, this.gutter_, ol.source.wms.getUrl);
        }, this);
    tileUrlFunction = ol.TileUrlFunction.createFromTileUrlFunctions(
        tileUrlFunctions);
  }

  var transparent = goog.isDef(options.params['TRANSPARENT']) ?
      options.params['TRANSPARENT'] : true;
  var extent = options.extent;

  var tileCoordTransform = function(tileCoord, projection) {
    var tileGrid = this.getTileGrid();
    if (goog.isNull(tileGrid)) {
      tileGrid = ol.tilegrid.getForProjection(projection);
    }
    if (tileGrid.getResolutions().length <= tileCoord.z) {
      return null;
    }
    var x = tileCoord.x;
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    var projectionExtent = projection.getExtent();
    extent = goog.isDef(extent) ? extent : projectionExtent;

    if (!goog.isNull(extent) && projection.isGlobal() &&
        extent[0] === projectionExtent[0] &&
        extent[2] === projectionExtent[2]) {
      var numCols = Math.ceil(
          (extent[2] - extent[0]) /
          (tileExtent[2] - tileExtent[0]));
      x = goog.math.modulo(x, numCols);
      tileExtent = tileGrid.getTileCoordExtent(
          new ol.TileCoord(tileCoord.z, x, tileCoord.y));
    }
    if (!goog.isNull(extent) && (!ol.extent.intersects(tileExtent, extent) ||
        ol.extent.touches(tileExtent, extent))) {
      return null;
    }
    return new ol.TileCoord(tileCoord.z, x, tileCoord.y);
  };

  goog.base(this, {
    attributions: options.attributions,
    crossOrigin: options.crossOrigin,
    extent: extent,
    logo: options.logo,
    tileGrid: options.tileGrid,
    opaque: !transparent,
    projection: options.projection,
    tileLoadFunction: options.tileLoadFunction,
    tileUrlFunction: ol.TileUrlFunction.withTileCoordTransform(
        tileCoordTransform, tileUrlFunction)
  });

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
 * Update the user-provided params.
 * @param {Object} params Params.
 * @todo stability experimental
 */
ol.source.TileWMS.prototype.updateParams = function(params) {
  goog.object.extend(this.params_, params);
  this.resetCoordKeyPrefix_();
  this.dispatchChangeEvent();
};
