goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.vec.Mat4');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.TileCache');
goog.require('ol.TileCoord');
goog.require('ol.ViewHint');
goog.require('ol.filter.Geometry');
goog.require('ol.geom.GeometryType');
goog.require('ol.layer.Vector');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.Renderer');
goog.require('ol.style.LiteralLine');
goog.require('ol.style.LiteralPolygon');
goog.require('ol.style.LiteralShape');
goog.require('ol.style.ShapeType');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Vector} layer Vector layer.
 */
ol.renderer.canvas.VectorLayer = function(mapRenderer, layer) {

  goog.base(this, mapRenderer, layer);

  /**
   * Final canvas made available to the map renderer.
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ =  /** @type {CanvasRenderingContext2D} */
      this.canvas_.getContext('2d');

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

  /**
   * Interim canvas for drawing newly visible features.
   * @private
   * @type {HTMLCanvasElement}
   */
  this.sketchCanvas_ = /** @type {HTMLCanvasElement} */
      (goog.dom.createElement(goog.dom.TagName.CANVAS));

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.sketchTransform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {ol.TileCache}
   */
  this.tileCache_ = new ol.TileCache(
      ol.renderer.canvas.VectorLayer.TILECACHE_SIZE);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.tileArchetype_ = null;

  /**
   * Geometry filters in rendering order.
   * @private
   * @type {Array.<ol.filter.Geometry>}
   * TODO: deal with multis
   */
  this.geometryFilters_ = [
    new ol.filter.Geometry(ol.geom.GeometryType.POLYGON),
    new ol.filter.Geometry(ol.geom.GeometryType.LINESTRING),
    new ol.filter.Geometry(ol.geom.GeometryType.POINT)
  ];

  /**
   * @private
   * @type {number}
   */
  this.renderedResolution_;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedExtent_ = null;

  /**
   * Flag to be set internally when we know something has changed that suggests
   * we need to re-render.
   * TODO: discuss setting this for all layers when something changes before
   * calling map.render().
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;


  // TODO: implement layer.setStyle(style) where style is a set of rules
  // and a rule has a filter and array of symbolizers
  var symbolizers = {};
  symbolizers[ol.geom.GeometryType.POINT] = new ol.style.LiteralShape({
    type: ol.style.ShapeType.CIRCLE,
    size: 10,
    fillStyle: '#ffcc99',
    strokeStyle: '#ff9933',
    strokeWidth: 2,
    opacity: 0.75
  });
  symbolizers[ol.geom.GeometryType.LINESTRING] = new ol.style.LiteralLine({
    strokeStyle: '#ff9933',
    strokeWidth: 2,
    opacity: 1
  });
  symbolizers[ol.geom.GeometryType.POLYGON] = new ol.style.LiteralPolygon({
    fillStyle: '#ffcc99',
    strokeStyle: '#ff9933',
    strokeWidth: 2,
    opacity: 0.5
  });
  // TODO: remove this
  this.symbolizers_ = symbolizers;

  /**
   * @private
   * @type {boolean}
   */
  this.pendingCachePrune_ = false;

};
goog.inherits(ol.renderer.canvas.VectorLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.getImage = function() {
  return this.canvas_;
};


/**
 * @return {ol.layer.Vector} Vector layer.
 */
ol.renderer.canvas.VectorLayer.prototype.getVectorLayer = function() {
  return /** @type {ol.layer.Vector} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.getTransform = function() {
  return this.transform_;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorLayer.prototype.renderFrame =
    function(frameState, layerState) {

  // TODO: consider bailing out here if rendered center and resolution
  // have not changed.  Requires that other change listeners set a dirty flag.

  var view2DState = frameState.view2DState,
      resolution = view2DState.resolution,
      extent = frameState.extent,
      source = this.getVectorLayer().getVectorSource(),
      tileGrid = source.getTileGrid();

  if (goog.isNull(tileGrid)) {
    // lazy tile source creation to match the view projection
    tileGrid = ol.tilegrid.createForProjection(
        view2DState.projection, /** TODO: get this elsewhere */ 22);
    source.setTileGrid(tileGrid);
  }

  // set up transform for the layer canvas to be drawn to the map canvas
  var tileSize = tileGrid.getTileSize(),
      z = tileGrid.getZForResolution(resolution),
      tileResolution = tileGrid.getResolution(z),
      tileRange = tileGrid.getTileRangeForExtentAndResolution(
          extent, tileResolution),
      tileRangeExtent = tileGrid.getTileRangeExtent(z, tileRange),
      sketchOrigin = tileRangeExtent.getTopLeft(),
      transform = this.transform_;

  goog.vec.Mat4.makeIdentity(transform);
  goog.vec.Mat4.translate(transform,
      frameState.size.width / 2,
      frameState.size.height / 2,
      0);
  goog.vec.Mat4.scale(transform,
      tileResolution / resolution, tileResolution / resolution, 1);
  goog.vec.Mat4.rotateZ(transform, view2DState.rotation);
  goog.vec.Mat4.translate(transform,
      (sketchOrigin.x - view2DState.center.x) / tileResolution,
      (view2DState.center.y - sketchOrigin.y) / tileResolution,
      0);

  /**
   * Fastest path out of here.  This method is called many many times while
   * there is nothing to do (e.g. while waiting for tiles from every other
   * layer to load.)  Do not put anything above here that is more expensive than
   * necessary.  And look for ways to get here faster.
   */
  if (!this.dirty_ && this.renderedResolution_ === tileResolution &&
      // TODO: extent.equals()
      this.renderedExtent_.toString() === tileRangeExtent.toString()) {
    return;
  }

  if (goog.isNull(this.tileArchetype_)) {
    this.tileArchetype_ = /** @type {HTMLCanvasElement} */
        goog.dom.createElement(goog.dom.TagName.CANVAS);
    this.tileArchetype_.width = tileSize.width;
    this.tileArchetype_.height = tileSize.height;
  }

  /**
   * Prepare the sketch canvas.  This covers the currently visible tile range
   * and will have rendered all newly visible features.
   */
  var sketchCanvas = this.sketchCanvas_;
  var sketchSize = new ol.Size(
      tileSize.width * tileRange.getWidth(),
      tileSize.height * tileRange.getHeight());

  // transform for map coords to sketch canvas pixel coords
  var sketchTransform = this.sketchTransform_;
  var halfWidth = sketchSize.width / 2;
  var halfHeight = sketchSize.height / 2;
  goog.vec.Mat4.makeIdentity(sketchTransform);
  goog.vec.Mat4.translate(sketchTransform,
      halfWidth,
      halfHeight,
      0);
  goog.vec.Mat4.scale(sketchTransform,
      1 / tileResolution,
      -1 / tileResolution,
      1);
  goog.vec.Mat4.translate(sketchTransform,
      -(sketchOrigin.x + halfWidth * tileResolution),
      -(sketchOrigin.y - halfHeight * tileResolution),
      0);

  // clear/resize sketch canvas
  sketchCanvas.width = sketchSize.width;
  sketchCanvas.height = sketchSize.height;

  var sketchCanvasRenderer = new ol.renderer.canvas.Renderer(
      sketchCanvas, sketchTransform);

  // clear/resize final canvas
  var finalCanvas = this.canvas_;
  finalCanvas.width = sketchSize.width;
  finalCanvas.height = sketchSize.height;
  var finalContext = this.context_;

  var renderedFeatures = {};
  var tilesToRender = {};
  var tile, tileCoord, key, tileExtent, tileState, x, y;
  // render features by geometry type
  var filters = this.geometryFilters_,
      numFilters = filters.length,
      i, filter, type, features, symbolizer;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoord = new ol.TileCoord(z, x, y);
      key = tileCoord.toString();
      if (this.tileCache_.containsKey(key)) {
        tilesToRender[key] = tileCoord;
      } else if (!frameState.viewHints[ol.ViewHint.ANIMATING]) {
        tilesToRender[key] = tileCoord;
        tileExtent = tileGrid.getTileCoordExtent(tileCoord);
        // TODO: instead of filtering here, do this on the source and maintain
        // a spatial index
        function filterFn(feature) {
          var id = goog.getUid(feature);
          var include = !(id in renderedFeatures) &&
              feature.getGeometry().getBounds().intersects(tileExtent);
          if (include === true) {
            renderedFeatures[id] = true;
          }
          return include;
        }
        for (i = 0; i < numFilters; ++i) {
          filter = filters[i];
          type = filter.getType();
          features = source.getFeatures(filter);
          // TODO: spatial index of tiles - see filterFn above
          features = goog.array.filter(features, filterFn);
          if (features.length) {
            // TODO: layer.getSymbolizerLiterals(features) or similar
            symbolizer = this.symbolizers_[type];
            sketchCanvasRenderer.renderFeaturesByGeometryType(
                type, features, symbolizer);
          }
        }
      }
    }
  }

  this.dirty_ = true;
  for (key in tilesToRender) {
    tileCoord = tilesToRender[key];
    if (this.tileCache_.containsKey(key)) {
      tile = /** @type {HTMLCanvasElement} */ (this.tileCache_.get(key));
    } else {
      tile = /** @type {HTMLCanvasElement} */
          this.tileArchetype_.cloneNode(false);
      tile.getContext('2d').drawImage(sketchCanvas,
          (tileRange.minX - tileCoord.x) * tileSize.width,
          (tileCoord.y - tileRange.maxY) * tileSize.height);
      this.tileCache_.set(key, tile);
    }
    finalContext.drawImage(tile,
        tileSize.width * (tileCoord.x - tileRange.minX),
        tileSize.height * (tileRange.maxY - tileCoord.y));
    this.dirty_ = false;
  }

  this.renderedResolution_ = tileResolution;
  this.renderedExtent_ = tileRangeExtent;
  if (!this.pendingCachePrune_) {
    this.pendingCachePrune_ = true;
    goog.global.setTimeout(goog.bind(this.pruneTileCache_, this), 0);
  }

};


/**
 * Get rid of tiles that exceed the cache capacity.
 * TODO: add a method to the cache to handle this
 * @private
 */
ol.renderer.canvas.VectorLayer.prototype.pruneTileCache_ = function() {
  while (this.tileCache_.canExpireCache()) {
    this.tileCache_.pop();
  }
  this.pendingCachePrune_ = false;
};


/**
 * @type {number}
 */
ol.renderer.canvas.VectorLayer.TILECACHE_SIZE = 128;
