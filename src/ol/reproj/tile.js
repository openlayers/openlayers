goog.provide('ol.reproj.Tile');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('goog.object');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.reproj');
goog.require('ol.reproj.Triangulation');



/**
 * @classdesc
 * Class encapsulating single reprojected tile.
 * See {@link ol.source.TileImage}.
 *
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.proj.Projection} sourceProj Source projection.
 * @param {ol.tilegrid.TileGrid} sourceTileGrid Source tile grid.
 * @param {ol.proj.Projection} targetProj Target projection.
 * @param {ol.tilegrid.TileGrid} targetTileGrid Target tile grid.
 * @param {number} z Zoom level.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {number} pixelRatio Pixel ratio.
 * @param {function(number, number, number, number) : ol.Tile} getTileFunction
 *     Function returning source tiles (z, x, y, pixelRatio).
 * @param {number=} opt_errorThreshold Acceptable reprojection error (in px).
 * @param {boolean=} opt_renderEdges Render reprojection edges.
 */
ol.reproj.Tile = function(sourceProj, sourceTileGrid,
    targetProj, targetTileGrid, z, x, y, pixelRatio, getTileFunction,
    opt_errorThreshold,
    opt_renderEdges) {
  goog.base(this, [z, x, y], ol.TileState.IDLE);

  /**
   * @private
   * @type {boolean}
   */
  this.renderEdges_ = opt_renderEdges !== undefined ? opt_renderEdges : false;

  /**
   * @private
   * @type {number}
   */
  this.pixelRatio_ = pixelRatio;

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {Object.<number, HTMLCanvasElement>}
   */
  this.canvasByContext_ = {};

  /**
   * @private
   * @type {ol.tilegrid.TileGrid}
   */
  this.sourceTileGrid_ = sourceTileGrid;

  /**
   * @private
   * @type {ol.tilegrid.TileGrid}
   */
  this.targetTileGrid_ = targetTileGrid;

  /**
   * @private
   * @type {!Array.<ol.Tile>}
   */
  this.srcTiles_ = [];

  /**
   * @private
   * @type {Array.<goog.events.Key>}
   */
  this.sourcesListenerKeys_ = null;

  /**
   * @private
   * @type {number}
   */
  this.srcZ_ = 0;

  var targetExtent = targetTileGrid.getTileCoordExtent(this.getTileCoord());
  var maxTargetExtent = this.targetTileGrid_.getExtent();
  var maxSourceExtent = this.sourceTileGrid_.getExtent();

  var limitedTargetExtent = maxTargetExtent ?
      ol.extent.getIntersection(targetExtent, maxTargetExtent) : targetExtent;

  if (ol.extent.getArea(limitedTargetExtent) === 0) {
    // Tile is completely outside range -> EMPTY
    // TODO: is it actually correct that the source even creates the tile ?
    this.state = ol.TileState.EMPTY;
    return;
  }

  var sourceProjExtent = sourceProj.getExtent();
  if (sourceProjExtent) {
    if (!maxSourceExtent) {
      maxSourceExtent = sourceProjExtent;
    } else {
      maxSourceExtent = ol.extent.getIntersection(
          maxSourceExtent, sourceProjExtent);
    }
  }

  var targetResolution = targetTileGrid.getResolution(z);

  var targetCenter = ol.extent.getCenter(limitedTargetExtent);
  var sourceResolution = ol.reproj.calculateSourceResolution(
      sourceProj, targetProj, targetCenter, targetResolution);

  if (!goog.math.isFiniteNumber(sourceResolution) || sourceResolution <= 0) {
    // invalid sourceResolution -> EMPTY
    // probably edges of the projections when no extent is defined
    this.state = ol.TileState.EMPTY;
    return;
  }

  var errorThresholdInPixels = opt_errorThreshold !== undefined ?
      opt_errorThreshold : ol.DEFAULT_RASTER_REPROJ_ERROR_THRESHOLD;

  /**
   * @private
   * @type {!ol.reproj.Triangulation}
   */
  this.triangulation_ = new ol.reproj.Triangulation(
      sourceProj, targetProj, limitedTargetExtent, maxSourceExtent,
      sourceResolution * errorThresholdInPixels);

  if (this.triangulation_.getTriangles().length === 0) {
    // no valid triangles -> EMPTY
    this.state = ol.TileState.EMPTY;
    return;
  }

  this.srcZ_ = sourceTileGrid.getZForResolution(sourceResolution);
  var srcExtent = this.triangulation_.calculateSourceExtent();

  if (maxSourceExtent &&
      !this.triangulation_.getWrapsXInSource() &&
      !ol.extent.intersects(maxSourceExtent, srcExtent)) {
    this.state = ol.TileState.EMPTY;
  } else {
    var srcRange = sourceTileGrid.getTileRangeForExtentAndZ(
        srcExtent, this.srcZ_);

    var xRange = [];
    var srcFullRange = sourceTileGrid.getFullTileRange(this.srcZ_);
    if (srcFullRange) {
      srcRange.minY = Math.max(srcRange.minY, srcFullRange.minY);
      srcRange.maxY = Math.min(srcRange.maxY, srcFullRange.maxY);

      if (srcRange.minX > srcRange.maxX) {
        var i;
        for (i = srcRange.minX; i <= srcFullRange.maxX; i++) {
          xRange.push(i);
        }
        for (i = srcFullRange.minX; i <= srcRange.maxX; i++) {
          xRange.push(i);
        }
      } else {
        var first = Math.max(srcRange.minX, srcFullRange.minX);
        var last = Math.min(srcRange.maxX, srcFullRange.maxX);
        for (var j = first; j <= last; j++) {
          xRange.push(j);
        }
      }
    } else {
      for (var k = srcRange.minX; k <= srcRange.maxX; k++) {
        xRange.push(k);
      }
    }

    var tilesRequired = xRange.length * srcRange.getHeight();
    if (!goog.asserts.assert(tilesRequired < ol.RASTER_REPROJ_MAX_SOURCE_TILES,
        'reasonable number of tiles is required')) {
      this.state = ol.TileState.ERROR;
      return;
    }
    xRange.forEach(function(srcX, i, arr) {
      for (var srcY = srcRange.minY; srcY <= srcRange.maxY; srcY++) {
        var tile = getTileFunction(this.srcZ_, srcX, srcY, pixelRatio);
        if (tile) {
          this.srcTiles_.push(tile);
        }
      }
    }, this);

    if (this.srcTiles_.length === 0) {
      this.state = ol.TileState.EMPTY;
    }
  }
};
goog.inherits(ol.reproj.Tile, ol.Tile);


/**
 * @inheritDoc
 */
ol.reproj.Tile.prototype.disposeInternal = function() {
  if (this.state == ol.TileState.LOADING) {
    this.unlistenSources_();
  }
  goog.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
ol.reproj.Tile.prototype.getImage = function(opt_context) {
  if (opt_context !== undefined) {
    var image;
    var key = goog.getUid(opt_context);
    if (key in this.canvasByContext_) {
      return this.canvasByContext_[key];
    } else if (goog.object.isEmpty(this.canvasByContext_)) {
      image = this.canvas_;
    } else {
      image = /** @type {HTMLCanvasElement} */ (this.canvas_.cloneNode(false));
    }
    this.canvasByContext_[key] = image;
    return image;
  } else {
    return this.canvas_;
  }
};


/**
 * @private
 */
ol.reproj.Tile.prototype.reproject_ = function() {
  var sources = [];
  this.srcTiles_.forEach(function(tile, i, arr) {
    if (tile && tile.getState() == ol.TileState.LOADED) {
      sources.push({
        extent: this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord),
        image: tile.getImage()
      });
    }
  }, this);

  var tileCoord = this.getTileCoord();
  var z = tileCoord[0];
  var size = this.targetTileGrid_.getTileSize(z);
  var width = goog.isNumber(size) ? size : size[0];
  var height = goog.isNumber(size) ? size : size[1];
  var targetResolution = this.targetTileGrid_.getResolution(z);
  var sourceResolution = this.sourceTileGrid_.getResolution(this.srcZ_);

  var targetExtent = this.targetTileGrid_.getTileCoordExtent(tileCoord);
  this.canvas_ = ol.reproj.render(width, height, this.pixelRatio_,
      sourceResolution, this.sourceTileGrid_.getExtent(),
      targetResolution, targetExtent, this.triangulation_, sources,
      this.renderEdges_);

  this.state = ol.TileState.LOADED;
  this.changed();
};


/**
 * @inheritDoc
 */
ol.reproj.Tile.prototype.load = function() {
  if (this.state == ol.TileState.IDLE) {
    this.state = ol.TileState.LOADING;
    this.changed();

    var leftToLoad = 0;

    goog.asserts.assert(!this.sourcesListenerKeys_,
        'this.sourcesListenerKeys_ should be null');

    this.sourcesListenerKeys_ = [];
    this.srcTiles_.forEach(function(tile, i, arr) {
      var state = tile.getState();
      if (state == ol.TileState.IDLE || state == ol.TileState.LOADING) {
        leftToLoad++;

        var sourceListenKey;
        sourceListenKey = tile.listen(goog.events.EventType.CHANGE,
            function(e) {
              var state = tile.getState();
              if (state == ol.TileState.LOADED ||
                  state == ol.TileState.ERROR ||
                  state == ol.TileState.EMPTY) {
                goog.events.unlistenByKey(sourceListenKey);
                leftToLoad--;
                goog.asserts.assert(leftToLoad >= 0,
                    'leftToLoad should not be negative');
                if (leftToLoad <= 0) {
                  this.unlistenSources_();
                  this.reproject_();
                }
              }
            }, false, this);
        this.sourcesListenerKeys_.push(sourceListenKey);
      }
    }, this);

    this.srcTiles_.forEach(function(tile, i, arr) {
      var state = tile.getState();
      if (state == ol.TileState.IDLE) {
        tile.load();
      }
    });

    if (leftToLoad === 0) {
      this.reproject_();
    }
  }
};


/**
 * @private
 */
ol.reproj.Tile.prototype.unlistenSources_ = function() {
  goog.asserts.assert(this.sourcesListenerKeys_,
      'this.sourcesListenerKeys_ should not be null');
  this.sourcesListenerKeys_.forEach(goog.events.unlistenByKey);
  this.sourcesListenerKeys_ = null;
};
