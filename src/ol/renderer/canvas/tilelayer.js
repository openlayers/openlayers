// FIXME find correct globalCompositeOperation

goog.provide('ol.renderer.canvas.TileLayer');

goog.require('ol');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.ViewHint');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.renderer.canvas.IntermediateCanvas');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.canvas.IntermediateCanvas}
 * @param {ol.layer.Tile|ol.layer.VectorTile} tileLayer Tile layer.
 */
ol.renderer.canvas.TileLayer = function(tileLayer) {

  ol.renderer.canvas.IntermediateCanvas.call(this, tileLayer);

  /**
   * @protected
   * @type {CanvasRenderingContext2D}
   */
  this.context = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {number}
   */
  this.oversampling_;

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedExtent_ = null;

  /**
   * @protected
   * @type {number}
   */
  this.renderedRevision;

  /**
   * @protected
   * @type {!Array.<ol.Tile>}
   */
  this.renderedTiles = [];

  /**
   * @protected
   * @type {ol.Extent}
   */
  this.tmpExtent = ol.extent.createEmpty();

  /**
   * @private
   * @type {ol.TileRange}
   */
  this.tmpTileRange_ = new ol.TileRange(0, 0, 0, 0);

  /**
   * @private
   * @type {ol.Transform}
   */
  this.imageTransform_ = ol.transform.create();

  /**
   * @protected
   * @type {number}
   */
  this.zDirection = 0;

};
ol.inherits(ol.renderer.canvas.TileLayer, ol.renderer.canvas.IntermediateCanvas);


/**
 * @private
 * @param {ol.Tile} tile Tile.
 * @return {boolean} Tile is drawable.
 */
ol.renderer.canvas.TileLayer.prototype.isDrawableTile_ = function(tile) {
  var tileState = tile.getState();
  var useInterimTilesOnError = this.getLayer().getUseInterimTilesOnError();
  return tileState == ol.TileState.LOADED ||
      tileState == ol.TileState.EMPTY ||
      tileState == ol.TileState.ERROR && !useInterimTilesOnError;
};

/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.prepareFrame = function(frameState, layerState) {

  var pixelRatio = frameState.pixelRatio;
  var size = frameState.size;
  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var viewResolution = viewState.resolution;
  var viewCenter = viewState.center;

  var tileLayer = this.getLayer();
  var tileSource = /** @type {ol.source.Tile} */ (tileLayer.getSource());
  var sourceRevision = tileSource.getRevision();
  var tileGrid = tileSource.getTileGridForProjection(projection);
  var z = tileGrid.getZForResolution(viewResolution, this.zDirection);
  var tileResolution = tileGrid.getResolution(z);
  var oversampling = Math.round(viewResolution / tileResolution) || 1;
  var extent = frameState.extent;

  if (layerState.extent !== undefined) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }
  if (ol.extent.isEmpty(extent)) {
    // Return false to prevent the rendering of the layer.
    return false;
  }

  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);
  var imageExtent = tileGrid.getTileRangeExtent(z, tileRange);

  var tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findLoadedTiles = this.createLoadedTileFinder(
      tileSource, projection, tilesToDrawByZ);

  var tmpExtent = this.tmpExtent;
  var tmpTileRange = this.tmpTileRange_;
  var newTiles = false;
  var tile, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tile = tileSource.getTile(z, x, y, pixelRatio, projection);
      if (!this.isDrawableTile_(tile)) {
        tile = tile.getInterimTile();
      }
      if (this.isDrawableTile_(tile)) {
        if (tile.getState() == ol.TileState.LOADED) {
          tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
          if (!newTiles && this.renderedTiles.indexOf(tile) == -1) {
            newTiles = true;
          }
        }
        continue;
      }

      var fullyLoaded = tileGrid.forEachTileCoordParentTileRange(
          tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
      if (!fullyLoaded) {
        var childTileRange = tileGrid.getTileCoordChildTileRange(
            tile.tileCoord, tmpTileRange, tmpExtent);
        if (childTileRange) {
          findLoadedTiles(z + 1, childTileRange);
        }
      }

    }
  }

  var hints = frameState.viewHints;
  if (!(this.renderedResolution && Date.now() - frameState.time > 16 &&
      (hints[ol.ViewHint.ANIMATING] || hints[ol.ViewHint.INTERACTING])) &&
      (newTiles || !(this.renderedExtent_ &&
      ol.extent.containsExtent(this.renderedExtent_, extent)) ||
      this.renderedRevision != sourceRevision) ||
      oversampling != this.oversampling_) {

    var tilePixelSize = tileSource.getTilePixelSize(z, pixelRatio, projection);
    var width = Math.round(tileRange.getWidth() * tilePixelSize[0] / oversampling);
    var height = Math.round(tileRange.getHeight() * tilePixelSize[1] / oversampling);
    var context = this.context;
    var canvas = context.canvas;
    var opaque = tileSource.getOpaque(projection);
    if (canvas.width != width || canvas.height != height) {
      this.oversampling_ = oversampling;
      canvas.width = width;
      canvas.height = height;
    } else {
      context.clearRect(0, 0, width, height);
      oversampling = this.oversampling_;
    }

    this.renderedTiles.length = 0;
    /** @type {Array.<number>} */
    var zs = Object.keys(tilesToDrawByZ).map(Number);
    zs.sort(ol.array.numberSafeCompareFunction);
    var currentResolution, currentScale, currentTilePixelSize, currentZ, i, ii;
    var tileExtent, tileGutter, tilesToDraw, w, h;
    for (i = 0, ii = zs.length; i < ii; ++i) {
      currentZ = zs[i];
      currentTilePixelSize = tileSource.getTilePixelSize(currentZ, pixelRatio, projection);
      currentResolution = tileGrid.getResolution(currentZ);
      currentScale = currentResolution / tileResolution;
      tileGutter = tilePixelRatio * tileSource.getGutter(projection);
      tilesToDraw = tilesToDrawByZ[currentZ];
      for (var tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.getTileCoord(), tmpExtent);
        x = (tileExtent[0] - imageExtent[0]) / tileResolution * tilePixelRatio / oversampling;
        y = (imageExtent[3] - tileExtent[3]) / tileResolution * tilePixelRatio / oversampling;
        w = currentTilePixelSize[0] * currentScale / oversampling;
        h = currentTilePixelSize[1] * currentScale / oversampling;
        if (!opaque) {
          context.clearRect(x, y, w, h);
        }
        this.drawTileImage(tile, frameState, layerState, x, y, w, h, tileGutter);
        this.renderedTiles.push(tile);
      }
    }

    this.renderedRevision = sourceRevision;
    this.renderedResolution = tileResolution * pixelRatio / tilePixelRatio * oversampling;
    this.renderedExtent_ = imageExtent;
  }

  var scale = this.renderedResolution / viewResolution;
  var transform = ol.transform.compose(this.imageTransform_,
      pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
      scale, scale,
      0,
      (this.renderedExtent_[0] - viewCenter[0]) / this.renderedResolution * pixelRatio,
      (viewCenter[1] - this.renderedExtent_[3]) / this.renderedResolution * pixelRatio);
  ol.transform.compose(this.coordinateToCanvasPixelTransform,
      pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
      pixelRatio / viewResolution, -pixelRatio / viewResolution,
      0,
      -viewCenter[0], -viewCenter[1]);


  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
  this.scheduleExpireCache(frameState, tileSource);
  this.updateLogos(frameState, tileSource);

  return this.renderedTiles.length > 0;
};


/**
 * @param {ol.Tile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {number} x Left of the tile.
 * @param {number} y Top of the tile.
 * @param {number} w Width of the tile.
 * @param {number} h Height of the tile.
 * @param {number} gutter Tile gutter.
 */
ol.renderer.canvas.TileLayer.prototype.drawTileImage = function(tile, frameState, layerState, x, y, w, h, gutter) {
  var image = tile.getImage();
  if (image) {
    this.context.drawImage(image, gutter, gutter,
        image.width - 2 * gutter, image.height - 2 * gutter, x, y, w, h);
  }
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.getImage = function() {
  return this.context.canvas;
};


/**
 * @function
 * @return {ol.layer.Tile|ol.layer.VectorTile}
 */
ol.renderer.canvas.TileLayer.prototype.getLayer;


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.getImageTransform = function() {
  return this.imageTransform_;
};
