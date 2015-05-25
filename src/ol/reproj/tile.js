goog.provide('ol.reproj.Tile');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.object');
goog.require('ol.Tile');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.reproj');
goog.require('ol.reproj.triangulation');



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
  var targetResolution = targetTileGrid.getResolution(z);
  var transformInv = ol.proj.getTransform(targetProj, sourceProj);

  /**
   * @private
   * @type {!ol.reproj.Triangulation}
   */
  this.triangles_ = ol.reproj.triangulation.createForExtent(
      targetExtent, transformInv);

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

  var idealSourceResolution =
      targetProj.getPointResolution(targetResolution,
                                    ol.extent.getCenter(targetExtent)) *
      targetProj.getMetersPerUnit() / sourceProj.getMetersPerUnit();

  /**
   * @private
   * @type {number}
   */
  this.srcZ_ = sourceTileGrid.getZForResolution(idealSourceResolution);
  var srcExtent = ol.reproj.triangulation.getSourceExtent(this.triangles_);

  if (!ol.extent.intersects(sourceTileGrid.getExtent(), srcExtent)) {
    this.state = ol.TileState.EMPTY;
  } else {
    var srcRange = sourceTileGrid.getTileRangeForExtentAndZ(
        srcExtent, this.srcZ_);

    var srcFullRange = sourceTileGrid.getFullTileRange(this.srcZ_);
    srcRange.minX = Math.max(srcRange.minX, srcFullRange.minX);
    srcRange.maxX = Math.min(srcRange.maxX, srcFullRange.maxX);
    srcRange.minY = Math.max(srcRange.minY, srcFullRange.minY);
    srcRange.maxY = Math.min(srcRange.maxY, srcFullRange.maxY);

    for (var srcX = srcRange.minX; srcX <= srcRange.maxX; srcX++) {
      for (var srcY = srcRange.minY; srcY <= srcRange.maxY; srcY++) {
        var tile = getTileFunction(this.srcZ_, srcX, srcY, pixelRatio);
        if (tile) {
          this.srcTiles_.push(tile);
        }
      }
    }

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
    ol.reproj.renderTriangles(context, srcResolution, targetResolution,
                              targetExtent, this.triangles_, sources);
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
