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
  this.sourceTiles_ = [];

  /**
   * @private
   * @type {Array.<goog.events.Key>}
   */
  this.sourcesListenerKeys_ = null;

  /**
   * @private
   * @type {number}
   */
  this.sourceZ_ = 0;

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
      opt_errorThreshold : ol.DEFAULT_RASTER_REPROJECTION_ERROR_THRESHOLD;

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

  this.sourceZ_ = sourceTileGrid.getZForResolution(sourceResolution);
  var sourceExtent = this.triangulation_.calculateSourceExtent();

  if (maxSourceExtent &&
      !this.triangulation_.getWrapsXInSource() &&
      !ol.extent.intersects(maxSourceExtent, sourceExtent)) {
    this.state = ol.TileState.EMPTY;
  } else {
    var sourceRange = sourceTileGrid.getTileRangeForExtentAndZ(
        sourceExtent, this.sourceZ_);

    var xRange = [];
    var sourceFullRange = sourceTileGrid.getFullTileRange(this.sourceZ_);
    if (sourceFullRange) {
      sourceRange.minY = Math.max(sourceRange.minY, sourceFullRange.minY);
      sourceRange.maxY = Math.min(sourceRange.maxY, sourceFullRange.maxY);

      if (sourceRange.minX > sourceRange.maxX) {
        var i;
        for (i = sourceRange.minX; i <= sourceFullRange.maxX; i++) {
          xRange.push(i);
        }
        for (i = sourceFullRange.minX; i <= sourceRange.maxX; i++) {
          xRange.push(i);
        }
      } else {
        var first = Math.max(sourceRange.minX, sourceFullRange.minX);
        var last = Math.min(sourceRange.maxX, sourceFullRange.maxX);
        for (var j = first; j <= last; j++) {
          xRange.push(j);
        }
      }
    } else {
      for (var k = sourceRange.minX; k <= sourceRange.maxX; k++) {
        xRange.push(k);
      }
    }

    var tilesRequired = xRange.length * sourceRange.getHeight();
    if (!goog.asserts.assert(
        tilesRequired < ol.RASTER_REPROJECTION_MAX_SOURCE_TILES,
        'reasonable number of tiles is required')) {
      this.state = ol.TileState.ERROR;
      return;
    }
    xRange.forEach(function(srcX, i, arr) {
      for (var srcY = sourceRange.minY; srcY <= sourceRange.maxY; srcY++) {
        var tile = getTileFunction(this.sourceZ_, srcX, srcY, pixelRatio);
        if (tile) {
          this.sourceTiles_.push(tile);
        }
      }
    }, this);

    if (this.sourceTiles_.length === 0) {
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
  this.sourceTiles_.forEach(function(tile, i, arr) {
    if (tile && tile.getState() == ol.TileState.LOADED) {
      sources.push({
        extent: this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord),
        image: tile.getImage()
      });
    }
  }, this);
  this.sourceTiles_.length = 0;

  var tileCoord = this.getTileCoord();
  var z = tileCoord[0];
  var size = this.targetTileGrid_.getTileSize(z);
  var width = goog.isNumber(size) ? size : size[0];
  var height = goog.isNumber(size) ? size : size[1];
  var targetResolution = this.targetTileGrid_.getResolution(z);
  var sourceResolution = this.sourceTileGrid_.getResolution(this.sourceZ_);

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
    this.sourceTiles_.forEach(function(tile, i, arr) {
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
                if (leftToLoad === 0) {
                  this.unlistenSources_();
                  this.reproject_();
                }
              }
            }, false, this);
        this.sourcesListenerKeys_.push(sourceListenKey);
      }
    }, this);

    this.sourceTiles_.forEach(function(tile, i, arr) {
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
