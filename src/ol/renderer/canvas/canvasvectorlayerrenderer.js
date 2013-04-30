goog.provide('ol.renderer.canvas.VectorLayer');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.Pixel');
goog.require('ol.Size');
goog.require('ol.TileCache');
goog.require('ol.TileCoord');
goog.require('ol.ViewHint');
goog.require('ol.extent');
goog.require('ol.filter.Extent');
goog.require('ol.filter.Geometry');
goog.require('ol.filter.Logical');
goog.require('ol.filter.LogicalOperator');
goog.require('ol.geom.GeometryType');
goog.require('ol.layer.Vector');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.canvas.VectorRenderer');
goog.require('ol.tilegrid.TileGrid');



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
      (this.canvas_.getContext('2d'));

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
  // TODO: this is far too coarse, we want extent of added features
  goog.events.listenOnce(layer, goog.events.EventType.CHANGE,
      this.handleLayerChange_, false, this);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.tileArchetype_ = null;

  /**
   * Geometry filters in rendering order.
   * TODO: these will go away shortly (in favor of one call per symbolizer type)
   * @private
   * @type {Array.<ol.filter.Geometry>}
   */
  this.geometryFilters_ = [
    new ol.filter.Geometry(ol.geom.GeometryType.POINT),
    new ol.filter.Geometry(ol.geom.GeometryType.MULTIPOINT),
    new ol.filter.Geometry(ol.geom.GeometryType.LINESTRING),
    new ol.filter.Geometry(ol.geom.GeometryType.MULTILINESTRING),
    new ol.filter.Geometry(ol.geom.GeometryType.POLYGON),
    new ol.filter.Geometry(ol.geom.GeometryType.MULTIPOLYGON)
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

  /**
   * @private
   * @type {boolean}
   */
  this.pendingCachePrune_ = false;

  /**
   * Grid used for internal generation of canvas tiles.  This is created
   * lazily so we have access to the view projection.
   *
   * @private
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid_ = null;

  /**
   * @private
   * @type {function()}
   */
  this.requestMapRenderFrame_ = goog.bind(function() {
    this.dirty_ = true;
    mapRenderer.getMap().requestRenderFrame();
  }, this);

};
goog.inherits(ol.renderer.canvas.VectorLayer, ol.renderer.canvas.Layer);


/**
 * Get rid cached tiles.  If the optional extent is provided, only tiles that
 * intersect that extent will be removed.
 * @param {ol.Extent=} opt_extent extent Expire tiles within this extent only.
 * @private
 */
ol.renderer.canvas.VectorLayer.prototype.expireTiles_ = function(opt_extent) {
  if (goog.isDef(opt_extent)) {
    // TODO: implement this
  }
  this.tileCache_.clear();
};


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
 * @param {ol.Pixel} pixel Pixel coordinate relative to the map viewport.
 * @return {Array.<ol.Feature>} Features at the pixel location.
 */
ol.renderer.canvas.VectorLayer.prototype.getFeatureInfoForPixel =
    function(pixel) {
  // TODO adjust pixel tolerance for applied styles
  var minPixel = new ol.Pixel(pixel.x - 1, pixel.y - 1);
  var maxPixel = new ol.Pixel(pixel.x + 1, pixel.y + 1);
  var map = this.getMap();

  var locationMin = map.getCoordinateFromPixel(minPixel);
  var locationMax = map.getCoordinateFromPixel(maxPixel);
  var locationBbox = ol.extent.boundingExtent([locationMin, locationMax]);
  var filter = new ol.filter.Extent(locationBbox);
  // TODO do a real intersect against the filtered result for exact matches
  var candidates = this.getLayer().getFeatures(filter);

  var location = map.getCoordinateFromPixel(pixel);
  // TODO adjust tolerance for stroke width or use configurable tolerance
  var tolerance = map.getView().getView2D().getResolution() * 3;
  var result = [];
  var candidate, geom;
  for (var i = 0, ii = candidates.length; i < ii; ++i) {
    candidate = candidates[i];
    geom = candidate.getGeometry();
    if (goog.isFunction(geom.containsCoordinate)) {
      // For polygons, check if the pixel location is inside the polygon
      if (geom.containsCoordinate(location)) {
        result.push(candidate);
      }
    } else if (goog.isFunction(geom.distanceFromCoordinate)) {
      // For lines, check if the ditance to the pixel location is within the
      // tolerance threshold
      if (geom.distanceFromCoordinate(location) < tolerance) {
        result.push(candidate);
      }
    } else {
      // For points, the bbox filter is all we need
      result.push(candidate);
    }
  }
  return result;
};


/**
 * @param {goog.events.Event} event Layer change event.
 * @private
 */
ol.renderer.canvas.VectorLayer.prototype.handleLayerChange_ = function(event) {
  // TODO: get rid of this in favor of vector specific events
  this.expireTiles_();
  this.requestMapRenderFrame_();
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
      layer = this.getVectorLayer(),
      tileGrid = this.tileGrid_;

  if (goog.isNull(tileGrid)) {
    // lazy tile grid creation to match the view projection
    tileGrid = ol.tilegrid.createForProjection(
        view2DState.projection,
        22, // should be no harm in going big here - ideally, it would be ∞
        new ol.Size(512, 512));
    this.tileGrid_ = tileGrid;
  }

  // set up transform for the layer canvas to be drawn to the map canvas
  var z = tileGrid.getZForResolution(resolution),
      tileResolution = tileGrid.getResolution(z),
      tileRange = tileGrid.getTileRangeForExtentAndResolution(
          extent, tileResolution),
      tileRangeExtent = tileGrid.getTileRangeExtent(z, tileRange),
      tileSize = tileGrid.getTileSize(z),
      sketchOrigin = ol.extent.getTopLeft(tileRangeExtent),
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
      (sketchOrigin[0] - view2DState.center[0]) / tileResolution,
      (view2DState.center[1] - sketchOrigin[1]) / tileResolution,
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
        (goog.dom.createElement(goog.dom.TagName.CANVAS));
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
      -(sketchOrigin[0] + halfWidth * tileResolution),
      -(sketchOrigin[1] - halfHeight * tileResolution),
      0);

  // clear/resize sketch canvas
  sketchCanvas.width = sketchSize.width;
  sketchCanvas.height = sketchSize.height;

  var sketchCanvasRenderer = new ol.renderer.canvas.VectorRenderer(
      sketchCanvas, sketchTransform, undefined, this.requestMapRenderFrame_);

  // clear/resize final canvas
  var finalCanvas = this.canvas_;
  finalCanvas.width = sketchSize.width;
  finalCanvas.height = sketchSize.height;
  var finalContext = this.context_;

  var featuresToRender = {};
  var tilesToRender = {};
  var tilesOnSketchCanvas = {};
  // TODO make gutter configurable?
  var tileGutter = 15 * tileResolution;
  var tile, tileCoord, key, tileState, x, y;
  // render features by geometry type
  var filters = this.geometryFilters_,
      numFilters = filters.length,
      deferred = false,
      i, geomFilter, tileExtent, extentFilter, type,
      groups, group, j, numGroups;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tileCoord = new ol.TileCoord(z, x, y);
      key = tileCoord.toString();
      if (this.tileCache_.containsKey(key)) {
        tilesToRender[key] = tileCoord;
      } else if (!frameState.viewHints[ol.ViewHint.ANIMATING]) {
        tileExtent = tileGrid.getTileCoordExtent(tileCoord);
        tileExtent[0] -= tileGutter;
        tileExtent[1] += tileGutter;
        tileExtent[2] -= tileGutter;
        tileExtent[3] += tileGutter;
        extentFilter = new ol.filter.Extent(tileExtent);
        for (i = 0; i < numFilters; ++i) {
          geomFilter = filters[i];
          type = geomFilter.getType();
          if (!goog.isDef(featuresToRender[type])) {
            featuresToRender[type] = {};
          }
          goog.object.extend(featuresToRender[type],
              layer.getFeaturesObject(new ol.filter.Logical(
                  [geomFilter, extentFilter], ol.filter.LogicalOperator.AND)));
        }
        tilesOnSketchCanvas[key] = tileCoord;
      } else {
        this.dirty_ = true;
      }
    }
  }

  renderByGeometryType:
  for (type in featuresToRender) {
    groups = layer.groupFeaturesBySymbolizerLiteral(featuresToRender[type]);
    numGroups = groups.length;
    for (j = 0; j < numGroups; ++j) {
      group = groups[j];
      deferred = sketchCanvasRenderer.renderFeaturesByGeometryType(
          /** @type {ol.geom.GeometryType} */ (type),
          group[0], group[1]);
      if (deferred) {
        break renderByGeometryType;
      }
    }
  }

  if (!deferred) {
    goog.object.extend(tilesToRender, tilesOnSketchCanvas);
  }

  for (key in tilesToRender) {
    tileCoord = tilesToRender[key];
    if (this.tileCache_.containsKey(key)) {
      tile = /** @type {HTMLCanvasElement} */ (this.tileCache_.get(key));
    } else {
      tile = /** @type {HTMLCanvasElement} */
          (this.tileArchetype_.cloneNode(false));
      tile.getContext('2d').drawImage(sketchCanvas,
          (tileRange.minX - tileCoord.x) * tileSize.width,
          (tileCoord.y - tileRange.maxY) * tileSize.height);
      this.tileCache_.set(key, tile);
    }
    finalContext.drawImage(tile,
        tileSize.width * (tileCoord.x - tileRange.minX),
        tileSize.height * (tileRange.maxY - tileCoord.y));
  }

  this.renderedResolution_ = tileResolution;
  this.renderedExtent_ = tileRangeExtent;
  if (!this.pendingCachePrune_) {
    this.pendingCachePrune_ = true;
    frameState.postRenderFunctions.push(goog.bind(this.pruneTileCache_, this));
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
