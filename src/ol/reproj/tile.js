goog.provide('ol.reproj.Tile');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.math');
goog.require('goog.object');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.reproj');
goog.require('ol.reproj.Triangulation');



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.proj.Projection} sourceProj
 * @param {ol.tilegrid.TileGrid} sourceTileGrid
 * @param {ol.proj.Projection} targetProj
 * @param {ol.tilegrid.TileGrid} targetTileGrid
 * @param {number} z
 * @param {number} x
 * @param {number} y
 * @param {number} pixelRatio
 * @param {function(number, number, number, number) : ol.Tile} getTileFunction
 */
ol.reproj.Tile = function(sourceProj, sourceTileGrid,
    targetProj, targetTileGrid, z, x, y, pixelRatio, getTileFunction) {
  goog.base(this, [z, x, y], ol.TileState.IDLE);

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


  var targetExtent = targetTileGrid.getTileCoordExtent(this.getTileCoord());
  var maxTargetExtent = this.targetTileGrid_.getExtent();
  var maxSourceExtent = this.sourceTileGrid_.getExtent();

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

  var limitedTargetExtent = ol.extent.getIntersection(
      targetExtent, maxTargetExtent);

  if (ol.extent.getArea(limitedTargetExtent) === 0) {
    // Tile is completely outside range -> EMPTY
    // TODO: is it actually correct that the source even creates the tile ?
    this.state = ol.TileState.EMPTY;
    return;
  }

  var targetResolution = targetTileGrid.getResolution(z);

  var errorThresholdInPixels = 0.5;

  // in source units
  var errorThreshold = targetResolution * errorThresholdInPixels *
      targetProj.getMetersPerUnit() / sourceProj.getMetersPerUnit();

  /**
   * @private
   * @type {!ol.reproj.Triangulation}
   */
  this.triangulation_ = new ol.reproj.Triangulation(
      sourceProj, targetProj, limitedTargetExtent, maxSourceExtent,
      5, errorThreshold);

  if (this.triangulation_.getTriangles().length === 0) {
    // no valid triangles -> EMPTY
    this.state = ol.TileState.EMPTY;
    return;
  }

  var targetCenter = ol.extent.getCenter(limitedTargetExtent);
  var sourceResolution = ol.reproj.calculateSourceResolution(
      sourceProj, targetProj, targetCenter, targetResolution);

  if (!goog.math.isFiniteNumber(sourceResolution) || sourceResolution <= 0) {
    // invalid sourceResolution -> EMPTY
    // probably edges of the projections when no extent is defined
    this.state = ol.TileState.EMPTY;
    return;
  }

  this.srcZ_ = sourceTileGrid.getZForResolution(sourceResolution);
  var srcExtent = this.triangulation_.calculateSourceExtent();

  var sourceProjExtent = sourceProj.getExtent();
  if (!sourceProj.isGlobal() && sourceProjExtent) {
    srcExtent = ol.extent.getIntersection(srcExtent, sourceProjExtent);
  }

  if (!goog.isNull(maxSourceExtent) &&
      !ol.extent.intersects(maxSourceExtent, srcExtent)) {
    this.state = ol.TileState.EMPTY;
  } else {
    var srcRange = sourceTileGrid.getTileRangeForExtentAndZ(
        srcExtent, this.srcZ_);

    var srcFullRange = sourceTileGrid.getFullTileRange(this.srcZ_);
    srcRange.minY = Math.max(srcRange.minY, srcFullRange.minY);
    srcRange.maxY = Math.min(srcRange.maxY, srcFullRange.maxY);

    var xRange;
    if (srcRange.minX > srcRange.maxX) {
      xRange = goog.array.concat(
          goog.array.range(srcRange.minX, srcFullRange.maxX + 1),
          goog.array.range(srcFullRange.minX, srcRange.maxX + 1)
          );
    } else {
      xRange = goog.array.range(
          Math.max(srcRange.minX, srcFullRange.minX),
          Math.min(srcRange.maxX, srcFullRange.maxX) + 1
          );
    }

    if (xRange.length * srcRange.getHeight() > 100) {
      // Too many source tiles are needed -- something probably went wrong
      // This sometimes happens for certain non-global projections
      // if no extent is specified.
      // TODO: detect somehow better? or at least make this a define
      this.state = ol.TileState.ERROR;
      return;
    }
    goog.array.forEach(xRange, function(srcX, i, arr) {
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
  if (goog.isDef(opt_context)) {
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
  goog.array.forEach(this.srcTiles_, function(tile, i, arr) {
    if (tile && tile.getState() == ol.TileState.LOADED) {
      sources.push({
        extent: this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord),
        image: tile.getImage()
      });
    }
  }, this);

  // create the canvas
  var tileCoord = this.getTileCoord();
  var z = tileCoord[0];
  var size = this.targetTileGrid_.getTileSize(z);
  var targetResolution = this.targetTileGrid_.getResolution(z);
  var srcResolution = this.sourceTileGrid_.getResolution(this.srcZ_);

  var width = goog.isNumber(size) ? size : size[0];
  var height = goog.isNumber(size) ? size : size[1];
  var context = ol.dom.createCanvasContext2D(width, height);
  context.imageSmoothingEnabled = true;

  if (goog.DEBUG) {
    context.fillStyle =
        sources.length === 0 ? 'rgba(255,0,0,.8)' :
        (sources.length == 1 ? 'rgba(0,255,0,.3)' : 'rgba(0,0,255,.1)');
    context.fillRect(0, 0, width, height);
  }

  if (sources.length > 0) {
    var targetExtent = this.targetTileGrid_.getTileCoordExtent(tileCoord);
    ol.reproj.renderTriangles(context,
        srcResolution, this.sourceTileGrid_.getExtent(),
        targetResolution, targetExtent, this.triangulation_, sources);
  }

  this.canvas_ = context.canvas;
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
    var onSingleSourceLoaded = goog.bind(function() {
      leftToLoad--;
      goog.asserts.assert(leftToLoad >= 0, 'leftToLoad should not be negative');
      if (leftToLoad <= 0) {
        this.unlistenSources_();
        this.reproject_();
      }
    }, this);

    goog.asserts.assert(goog.isNull(this.sourcesListenerKeys_),
        'this.sourcesListenerKeys_ should be null');

    this.sourcesListenerKeys_ = [];
    goog.array.forEach(this.srcTiles_, function(tile, i, arr) {
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
                onSingleSourceLoaded();
                goog.events.unlistenByKey(sourceListenKey);
              }
            });
        this.sourcesListenerKeys_.push(sourceListenKey);
      }
    }, this);

    goog.array.forEach(this.srcTiles_, function(tile, i, arr) {
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
  goog.asserts.assert(!goog.isNull(this.sourcesListenerKeys_),
      'this.sourcesListenerKeys_ should not be null');
  goog.array.forEach(this.sourcesListenerKeys_, goog.events.unlistenByKey);
  this.sourcesListenerKeys_ = null;
};
