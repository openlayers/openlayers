goog.provide('ol.source.TiledVector');
goog.provide('ol.source.TiledVectorOptions');


goog.require('goog.array');
goog.require('goog.object');
goog.require('ol.Projection');
goog.require('ol.source.TileSource');
goog.require('ol.tilegrid.TileGrid');


/**
 * @typedef {{features: (ol.Collection|undefined),
 *            extent: (ol.Extent|undefined),
 *            projection: (ol.Projection|undefined),
 *            tileGrid: (ol.tilegrid.TileGrid|undefined)}}
 */
ol.source.TiledVectorOptions;



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @private
 */
ol.VectorTile_ = function(tileCoord, tileGrid) {

  goog.base(this, tileCoord);

  this.state = ol.TileState.LOADING;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {Object.<number, HTMLCanvasElement>}
   * FIXME needs to be cleared when the data changes
   */
  this.canvasByContext_ = {};

  /**
   * @private
   * @type {ol.renderer.canvas.Renderer}
   * FIXME Use a shared renderer and cut out tiles; keep track of rendered items
   */
  this.renderer_ = this.createRenderer_(tileGrid);

};
goog.inherits(ol.VectorTile_, ol.Tile);


/**
 * @private
 * @param {ol.TileGrid} tileGrid tileGrid.
 * @return {ol.renderer.canvas.Renderer} The renderer for this tile.
 */
ol.VectorTile_.prototype.createRenderer_ = function(tileGrid) {
  var tileSize = tileGrid.getTileSize();
  var canvas = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));
  canvas.width = tileSize.width;
  canvas.height = tileSize.height;

  var transform = this.transform_;
  var origin = tileGrid.getExtent_.getTopLeft();
  var resolution = tileGrid.getResolution();
  goog.vec.Mat4.makeIdentity(transform);
  goog.vec.Mat4.scale(transform, resolution, resolution, 1);
  goog.vec.Mat4.translate(transform,
      origin.x / resolution, -origin.y / resolution, 0);

  this.canvasByContext_[key] = canvas;

  return ol.renderer.canvas.Renderer(canvas, transform);
};


/**
 * @param {Array.<ol.geom.Geometry>} geometries Geometries for this tile.
 * @param {Array.<ol.style.LiteralSymbolizer>} symbolizers Symbolizers for the
 *   geometries, in the same order.
 */
ol.VectorTile_.prototype.setContent = function(geometries, symbolizers) {
  this.state = ol.TileState.LOADED;

  var uniqueSymbolizers = [];
  goog.array.removeDuplicates(symbolizers, uniqueSymbolizers);

  var geometriesBySymbolizer = goog.array.bucket(geometries, function(e, i) {
    var index = goog.array.indexOf(uniqueSymbolizers, symbolizers[i]);
    return index === -1 ? undefined : index;
  });

  var buckets,
      renderer = this.renderer_,
      type = {line: 'line', point: 'point', polygon: 'polygon'};
  function sortByGeometryType(geometry) {
    if (geometry instanceof ol.geom.LineString) {
      return type['line'];
    } else if (geometry instanceof ol.geom.Point) {
      return type['point'];
    } else if (geometry instanceof ol.geom.Polygon) {
      return type['polygon'];
    }
  }
  for (var i = 0, ii = uniqueSymbolizers.length; i < ii; ++i) {
    buckets = ol.array.bucket(geometriesBySymbolizer[i], sortByGeometryType);
    renderer.renderLineStrings(buckets[type['line']], uniqueSymbolizers[i]);
    renderer.renderPoints(buckets[type['point']], uniqueSymbolizers[i]);
    renderer.renderPolygons(buckets[type['polygon']], uniqueSymbolizers[i]);
  }
};


/**
 * @inheritDoc
 */
ol.VectorTile_.prototype.getImage = function(opt_context) {
  var key = goog.isDef(opt_context) ? goog.getUid(opt_context) : -1;
  if (key in this.canvasByContext_) {
    return this.canvasByContext_[key];
  } else {

    return canvas;

  }
};



/**
 * @constructor
 * @extends {ol.source.TileSource}
 * @param {ol.source.TiledVectorOptions} options options.
 */
ol.source.TiledVector = function(options) {

  /**
   * @type {ol.Collection}
   * @private
   */
  this.features_ = goog.isDef(options.features) ?
      options.features : new ol.Collection();

  /**
   * @private
   * @type {Object.<string, ol.DebugTile_>}
   * FIXME will need to expire elements from this cache
   * FIXME will need to invalidate tiles when data changes
   */
  this.tileCache_ = {};

  var projection = ol.Projection.createProjection(
      options.projection, 'EPSG:3857');

  goog.base(this, {
    extent: goog.isDef(options.extent) ?
        options.extent : projection.getExtent(),
    projection: projection,
    tileGrid: goog.isDef(options.tileGrid) ?
        options.tileGrid : ol.tilegrid.createForProjection(projection)
  });

};
goog.inherits(ol.source.TiledVector, ol.source.TileSource);


/**
 * @return {ol.Collection} This layer's features.
 */
ol.source.TiledVector.prototype.getFeatures = function() {
  return this.features_;
};


/**
 * @inheritDoc
 */
ol.source.TiledVector.prototype.getTile = function(tileCoord) {
  var extent = this.tileGrid.getTileCoordExtent(tileCoord);
  var key = tileCoord.toString();
  if (goog.object.containsKey(this.tileCache_, key)) {
    return this.tileCache_[key];
  } else {
    var tile = new ol.VectorTile_(tileCoord, this.tileGrid),
        geometries = [],
        symbolizers = [];
    // FIXME only pass geometries for tile extent
    this.features_.forEach(function(feature) {
      geometries.push(feature.getGeometry());
      symbolizers.push(feature.getSymbolizer());
    });
    tile.setContent(geometries, symbolizers);

    this.tileCache_[key] = tile;
    return tile;
  }
};
