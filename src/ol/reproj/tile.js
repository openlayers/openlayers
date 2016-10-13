goog.provide('ol.reproj.Tile');

goog.require('ol');
goog.require('ol.Tile');
goog.require('ol.events');
goog.require('ol.events.EventType');
goog.require('ol.extent');
goog.require('ol.math');
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
 * @param {ol.TileCoord} tileCoord Coordinate of the tile.
 * @param {ol.TileCoord} wrappedTileCoord Coordinate of the tile wrapped in X.
 * @param {number} pixelRatio Pixel ratio.
 * @param {number} gutter Gutter of the source tiles.
 * @param {ol.ReprojTileFunctionType} getTileFunction
 *     Function returning source tiles (z, x, y, pixelRatio).
 * @param {number=} opt_errorThreshold Acceptable reprojection error (in px).
 * @param {boolean=} opt_renderEdges Render reprojection edges.
 */
ol.reproj.Tile = function(sourceProj, sourceTileGrid,
    targetProj, targetTileGrid, tileCoord, wrappedTileCoord,
    pixelRatio, gutter, getTileFunction,
    opt_errorThreshold,
    opt_renderEdges) {
  ol.Tile.call(this, tileCoord, ol.Tile.State.IDLE);

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
   * @type {number}
   */
  this.gutter_ = gutter;

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

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
   * @type {ol.TileCoord}
   */
  this.wrappedTileCoord_ = wrappedTileCoord ? wrappedTileCoord : tileCoord;

  /**
   * @private
   * @type {!Array.<ol.Tile>}
   */
  this.sourceTiles_ = [];

  /**
   * @private
   * @type {Array.<ol.EventsKey>}
   */
  this.sourcesListenerKeys_ = null;

  /**
   * @private
   * @type {number}
   */
  this.sourceZ_ = 0;

  var targetExtent = targetTileGrid.getTileCoordExtent(this.wrappedTileCoord_);
  var maxTargetExtent = this.targetTileGrid_.getExtent();
  var maxSourceExtent = this.sourceTileGrid_.getExtent();

  var limitedTargetExtent = maxTargetExtent ?
      ol.extent.getIntersection(targetExtent, maxTargetExtent) : targetExtent;

  if (ol.extent.getArea(limitedTargetExtent) === 0) {
    // Tile is completely outside range -> EMPTY
    // TODO: is it actually correct that the source even creates the tile ?
    this.state = ol.Tile.State.EMPTY;
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

  var targetResolution = targetTileGrid.getResolution(
      this.wrappedTileCoord_[0]);

  var targetCenter = ol.extent.getCenter(limitedTargetExtent);
  var sourceResolution = ol.reproj.calculateSourceResolution(
      sourceProj, targetProj, targetCenter, targetResolution);

  if (!isFinite(sourceResolution) || sourceResolution <= 0) {
    // invalid sourceResolution -> EMPTY
    // probably edges of the projections when no extent is defined
    this.state = ol.Tile.State.EMPTY;
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
    this.state = ol.Tile.State.EMPTY;
    return;
  }

  this.sourceZ_ = sourceTileGrid.getZForResolution(sourceResolution);
  var sourceExtent = this.triangulation_.calculateSourceExtent();

  if (maxSourceExtent) {
    if (sourceProj.canWrapX()) {
      sourceExtent[1] = ol.math.clamp(
          sourceExtent[1], maxSourceExtent[1], maxSourceExtent[3]);
      sourceExtent[3] = ol.math.clamp(
          sourceExtent[3], maxSourceExtent[1], maxSourceExtent[3]);
    } else {
      sourceExtent = ol.extent.getIntersection(sourceExtent, maxSourceExtent);
    }
  }

  if (!ol.extent.getArea(sourceExtent)) {
    this.state = ol.Tile.State.EMPTY;
  } else {
    var sourceRange = sourceTileGrid.getTileRangeForExtentAndZ(
        sourceExtent, this.sourceZ_);

    var tilesRequired = sourceRange.getWidth() * sourceRange.getHeight();
    if (ol.DEBUG && !(tilesRequired < ol.RASTER_REPROJECTION_MAX_SOURCE_TILES)) {
      console.assert(false, 'reasonable number of tiles is required');
      this.state = ol.Tile.State.ERROR;
      return;
    }
    for (var srcX = sourceRange.minX; srcX <= sourceRange.maxX; srcX++) {
      for (var srcY = sourceRange.minY; srcY <= sourceRange.maxY; srcY++) {
        var tile = getTileFunction(this.sourceZ_, srcX, srcY, pixelRatio);
        if (tile) {
          this.sourceTiles_.push(tile);
        }
      }
    }

    if (this.sourceTiles_.length === 0) {
      this.state = ol.Tile.State.EMPTY;
    }
  }
};
ol.inherits(ol.reproj.Tile, ol.Tile);


/**
 * @inheritDoc
 */
ol.reproj.Tile.prototype.disposeInternal = function() {
  if (this.state == ol.Tile.State.LOADING) {
    this.unlistenSources_();
  }
  ol.Tile.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
ol.reproj.Tile.prototype.getImage = function() {
  return this.canvas_;
};


/**
 * @private
 */
ol.reproj.Tile.prototype.reproject_ = function() {
  var sources = [];
  this.sourceTiles_.forEach(function(tile, i, arr) {
    if (tile && tile.getState() == ol.Tile.State.LOADED) {
      sources.push({
        extent: this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord),
        image: tile.getImage()
      });
    }
  }, this);
  this.sourceTiles_.length = 0;

  if (sources.length === 0) {
    this.state = ol.Tile.State.ERROR;
  } else {
    var z = this.wrappedTileCoord_[0];
    var size = this.targetTileGrid_.getTileSize(z);
    var width = typeof size === 'number' ? size : size[0];
    var height = typeof size === 'number' ? size : size[1];
    var targetResolution = this.targetTileGrid_.getResolution(z);
    var sourceResolution = this.sourceTileGrid_.getResolution(this.sourceZ_);

    var targetExtent = this.targetTileGrid_.getTileCoordExtent(
        this.wrappedTileCoord_);
    this.canvas_ = ol.reproj.render(width, height, this.pixelRatio_,
        sourceResolution, this.sourceTileGrid_.getExtent(),
        targetResolution, targetExtent, this.triangulation_, sources,
        this.gutter_, this.renderEdges_);

    this.state = ol.Tile.State.LOADED;
  }
  this.changed();
};


/**
 * @inheritDoc
 */
ol.reproj.Tile.prototype.load = function() {
  if (this.state == ol.Tile.State.IDLE) {
    this.state = ol.Tile.State.LOADING;
    this.changed();

    var leftToLoad = 0;

    ol.DEBUG && console.assert(!this.sourcesListenerKeys_,
        'this.sourcesListenerKeys_ should be null');

    this.sourcesListenerKeys_ = [];
    this.sourceTiles_.forEach(function(tile, i, arr) {
      var state = tile.getState();
      if (state == ol.Tile.State.IDLE || state == ol.Tile.State.LOADING) {
        leftToLoad++;

        var sourceListenKey;
        sourceListenKey = ol.events.listen(tile, ol.events.EventType.CHANGE,
            function(e) {
              var state = tile.getState();
              if (state == ol.Tile.State.LOADED ||
                  state == ol.Tile.State.ERROR ||
                  state == ol.Tile.State.EMPTY) {
                ol.events.unlistenByKey(sourceListenKey);
                leftToLoad--;
                ol.DEBUG && console.assert(leftToLoad >= 0,
                    'leftToLoad should not be negative');
                if (leftToLoad === 0) {
                  this.unlistenSources_();
                  this.reproject_();
                }
              }
            }, this);
        this.sourcesListenerKeys_.push(sourceListenKey);
      }
    }, this);

    this.sourceTiles_.forEach(function(tile, i, arr) {
      var state = tile.getState();
      if (state == ol.Tile.State.IDLE) {
        tile.load();
      }
    });

    if (leftToLoad === 0) {
      setTimeout(this.reproject_.bind(this), 0);
    }
  }
};


/**
 * @private
 */
ol.reproj.Tile.prototype.unlistenSources_ = function() {
  this.sourcesListenerKeys_.forEach(ol.events.unlistenByKey);
  this.sourcesListenerKeys_ = null;
};
