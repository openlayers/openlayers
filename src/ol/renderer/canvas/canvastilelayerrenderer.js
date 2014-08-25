// FIXME find correct globalCompositeOperation
// FIXME optimize :-)

goog.provide('ol.renderer.canvas.TileLayer');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');
goog.require('goog.vec.Mat4');
goog.require('ol.Size');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.Tile');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.Tile} tileLayer Tile layer.
 */
ol.renderer.canvas.TileLayer = function(mapRenderer, tileLayer) {

  goog.base(this, mapRenderer, tileLayer);

  /**
   * @private
   * @type {HTMLCanvasElement}
   */
  this.canvas_ = null;

  /**
   * @private
   * @type {ol.Size}
   */
  this.canvasSize_ = null;

  /**
   * @private
   * @type {boolean}
   */
  this.canvasTooBig_ = false;

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = null;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.imageTransform_ = goog.vec.Mat4.createNumber();

  /**
   * @private
   * @type {number}
   */
  this.renderedCanvasZ_ = NaN;

  /**
   * @private
   * @type {ol.TileRange}
   */
  this.renderedCanvasTileRange_ = null;

  /**
   * @private
   * @type {Array.<ol.Tile|undefined>}
   */
  this.renderedTiles_ = null;

};
goog.inherits(ol.renderer.canvas.TileLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.getImage = function() {
  return this.canvas_;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.getImageTransform = function() {
  return this.imageTransform_;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.prepareFrame =
    function(frameState, layerState) {

  //
  // Warning! You're entering a dangerous zone!
  //
  // The canvas tile layer renderering is highly optimized, hence
  // the complexity of this function. For best performance we try
  // to minimize the number of pixels to update on the canvas. This
  // includes:
  //
  // - Only drawing pixels that will be visible.
  // - Not re-drawing pixels/tiles that are already correct.
  // - Minimizing calls to clearRect.
  // - Never shrink the canvas. Just make it bigger when necessary.
  //   Re-sizing the canvas also clears it, which further means
  //   re-creating it (expensive).
  //
  // The various steps performed by this functions:
  //
  // - Create a canvas element if none has been created yet.
  //
  // - Make the canvas bigger if it's too small. Note that we never shrink
  //   the canvas, we just make it bigger when necessary, when rotating for
  //   example. Note also that the canvas always contains a whole number
  //   of tiles.
  //
  // - Invalidate the canvas tile range (renderedCanvasTileRange_ = null)
  //   if (1) the canvas has been enlarged, or (2) the zoom level changes,
  //   or (3) the canvas tile range doesn't contain the required tile
  //   range. This canvas tile range invalidation thing is related to
  //   an optimization where we attempt to redraw as few pixels as
  //   possible on each prepareFrame call.
  //
  // - If the canvas tile range has been invalidated we reset
  //   renderedCanvasTileRange_ and reset the renderedTiles_ array.
  //   The renderedTiles_ array is the structure used to determine
  //   the canvas pixels that need not be redrawn from one prepareFrame
  //   call to another. It records while tile has been rendered at
  //   which position in the canvas.
  //
  // - We then determine the tiles to draw on the canvas. Tiles for
  //   the target resolution may not be loaded yet. In that case we
  //   use low-resolution/interim tiles if loaded already. And, if
  //   for a non-yet-loaded tile we haven't found a corresponding
  //   low-resolution tile we indicate that the pixels for that
  //   tile must be cleared on the canvas. Note: determining the
  //   interim tiles is based on tile extents instead of tile
  //   coords, this is to be able to handler irregular tile grids.
  //
  // - We're now ready to render. We start by calling clearRect
  //   for the tiles that aren't loaded yet and are not fully covered
  //   by a low-resolution tile (if they're loaded, we'll draw them;
  //   if they're fully covered by a low-resolution tile then there's
  //   no need to clear). We then render the tiles "back to front",
  //   i.e. starting with the low-resolution tiles.
  //
  // - After rendering some bookkeeping is performed (updateUsedTiles,
  //   etc.). manageTilePyramid is what enqueue tiles in the tile
  //   queue for loading.
  //
  // - The last step involves updating the image transform matrix,
  //   which will be used by the map renderer for the final
  //   composition and positioning.
  //

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var projection = viewState.projection;

  var tileLayer = this.getLayer();
  goog.asserts.assertInstanceof(tileLayer, ol.layer.Tile);
  var tileSource = tileLayer.getSource();
  goog.asserts.assertInstanceof(tileSource, ol.source.Tile);
  var tileGrid = tileSource.getTileGridForProjection(projection);
  var tileGutter = tileSource.getGutter();
  var z = tileGrid.getZForResolution(viewState.resolution);
  var tilePixelSize =
      tileSource.getTilePixelSize(z, frameState.pixelRatio, projection);
  var tilePixelRatio = tilePixelSize / tileGrid.getTileSize(z);
  var tileResolution = tileGrid.getResolution(z);
  var tilePixelResolution = tileResolution / tilePixelRatio;
  var center = viewState.center;
  var extent;
  if (tileResolution == viewState.resolution) {
    center = this.snapCenterToPixel(center, tileResolution, frameState.size);
    extent = ol.extent.getForViewAndSize(
        center, tileResolution, viewState.rotation, frameState.size);
  } else {
    extent = frameState.extent;
  }

  if (goog.isDef(layerState.extent)) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }
  if (ol.extent.isEmpty(extent)) {
    // Return false to prevent the rendering of the layer.
    return false;
  }

  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);

  var canvasWidth = tilePixelSize * tileRange.getWidth();
  var canvasHeight = tilePixelSize * tileRange.getHeight();

  var canvas, context;
  if (goog.isNull(this.canvas_)) {
    goog.asserts.assert(goog.isNull(this.canvasSize_));
    goog.asserts.assert(goog.isNull(this.context_));
    goog.asserts.assert(goog.isNull(this.renderedCanvasTileRange_));
    context = ol.dom.createCanvasContext2D(canvasWidth, canvasHeight);
    this.canvas_ = context.canvas;
    this.canvasSize_ = [canvasWidth, canvasHeight];
    this.context_ = context;
    this.canvasTooBig_ =
        !ol.renderer.canvas.Layer.testCanvasSize(this.canvasSize_);
  } else {
    goog.asserts.assert(!goog.isNull(this.canvasSize_));
    goog.asserts.assert(!goog.isNull(this.context_));
    canvas = this.canvas_;
    context = this.context_;
    if (this.canvasSize_[0] < canvasWidth ||
        this.canvasSize_[1] < canvasHeight ||
        (this.canvasTooBig_ && (this.canvasSize_[0] > canvasWidth ||
        this.canvasSize_[1] > canvasHeight))) {
      // Canvas is too small, resize it. We never shrink the canvas, unless
      // we know that the current canvas size exceeds the maximum size
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      this.canvasSize_ = [canvasWidth, canvasHeight];
      this.canvasTooBig_ =
          !ol.renderer.canvas.Layer.testCanvasSize(this.canvasSize_);
      this.renderedCanvasTileRange_ = null;
    } else {
      canvasWidth = this.canvasSize_[0];
      canvasHeight = this.canvasSize_[1];
      if (z != this.renderedCanvasZ_ ||
          !this.renderedCanvasTileRange_.containsTileRange(tileRange)) {
        this.renderedCanvasTileRange_ = null;
        // Due to limited layer extent, we may be rendering tiles on a small
        // portion of the canvas.
        if (z < this.renderedCanvasZ_) {
          this.context_.clearRect(0, 0, canvasWidth, canvasHeight);
        }
      }
    }
  }

  var canvasTileRange, canvasTileRangeWidth, minX, minY;
  if (goog.isNull(this.renderedCanvasTileRange_)) {
    canvasTileRangeWidth = canvasWidth / tilePixelSize;
    var canvasTileRangeHeight = canvasHeight / tilePixelSize;
    minX = tileRange.minX -
        Math.floor((canvasTileRangeWidth - tileRange.getWidth()) / 2);
    minY = tileRange.minY -
        Math.floor((canvasTileRangeHeight - tileRange.getHeight()) / 2);
    this.renderedCanvasZ_ = z;
    this.renderedCanvasTileRange_ = new ol.TileRange(
        minX, minX + canvasTileRangeWidth - 1,
        minY, minY + canvasTileRangeHeight - 1);
    this.renderedTiles_ =
        new Array(canvasTileRangeWidth * canvasTileRangeHeight);
    canvasTileRange = this.renderedCanvasTileRange_;
  } else {
    canvasTileRange = this.renderedCanvasTileRange_;
    canvasTileRangeWidth = canvasTileRange.getWidth();
  }

  goog.asserts.assert(canvasTileRange.containsTileRange(tileRange));

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};
  /** @type {Array.<ol.Tile>} */
  var tilesToClear = [];

  var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
    return !goog.isNull(tile) && tile.getState() == ol.TileState.LOADED;
  }, tileSource, pixelRatio, projection);
  var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource,
      tilesToDrawByZ, getTileIfLoaded);

  var useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
  if (!goog.isDef(useInterimTilesOnError)) {
    useInterimTilesOnError = true;
  }

  var tmpExtent = ol.extent.createEmpty();
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tile = tileSource.getTile(z, x, y, pixelRatio, projection);
      tileState = tile.getState();
      if (tileState == ol.TileState.LOADED ||
          tileState == ol.TileState.EMPTY ||
          (tileState == ol.TileState.ERROR && !useInterimTilesOnError)) {
        tilesToDrawByZ[z][ol.tilecoord.toString(tile.tileCoord)] = tile;
        continue;
      }

      fullyLoaded = tileGrid.forEachTileCoordParentTileRange(
          tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
      if (!fullyLoaded) {
        // FIXME we do not need to clear the tile if it is fully covered by its
        //       children
        tilesToClear.push(tile);
        childTileRange = tileGrid.getTileCoordChildTileRange(
            tile.tileCoord, tmpTileRange, tmpExtent);
        if (!goog.isNull(childTileRange)) {
          findLoadedTiles(z + 1, childTileRange);
        }
      }

    }
  }

  var i, ii;
  for (i = 0, ii = tilesToClear.length; i < ii; ++i) {
    tile = tilesToClear[i];
    x = tilePixelSize * (tile.tileCoord[1] - canvasTileRange.minX);
    y = tilePixelSize * (canvasTileRange.maxY - tile.tileCoord[2]);
    context.clearRect(x, y, tilePixelSize, tilePixelSize);
  }

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);
  var opaque = tileSource.getOpaque();
  var origin = ol.extent.getTopLeft(tileGrid.getTileCoordExtent(
      [z, canvasTileRange.minX, canvasTileRange.maxY],
      tmpExtent));
  var currentZ, index, scale, tileCoordKey, tileExtent, tilesToDraw;
  var ix, iy, interimTileExtent, interimTileRange, maxX, maxY;
  var height, width;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    currentZ = zs[i];
    tilePixelSize =
        tileSource.getTilePixelSize(currentZ, pixelRatio, projection);
    tilesToDraw = tilesToDrawByZ[currentZ];
    if (currentZ == z) {
      for (tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        index =
            (tile.tileCoord[2] - canvasTileRange.minY) * canvasTileRangeWidth +
            (tile.tileCoord[1] - canvasTileRange.minX);
        if (this.renderedTiles_[index] != tile) {
          x = tilePixelSize * (tile.tileCoord[1] - canvasTileRange.minX);
          y = tilePixelSize * (canvasTileRange.maxY - tile.tileCoord[2]);
          tileState = tile.getState();
          if (tileState == ol.TileState.EMPTY ||
              (tileState == ol.TileState.ERROR && !useInterimTilesOnError) ||
              !opaque) {
            context.clearRect(x, y, tilePixelSize, tilePixelSize);
          }
          if (tileState == ol.TileState.LOADED) {
            context.drawImage(tile.getImage(),
                tileGutter, tileGutter, tilePixelSize, tilePixelSize,
                x, y, tilePixelSize, tilePixelSize);
          }
          this.renderedTiles_[index] = tile;
        }
      }
    } else {
      scale = tileGrid.getResolution(currentZ) / tileResolution;
      for (tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord, tmpExtent);
        x = (tileExtent[0] - origin[0]) / tilePixelResolution;
        y = (origin[1] - tileExtent[3]) / tilePixelResolution;
        width = scale * tilePixelSize;
        height = scale * tilePixelSize;
        tileState = tile.getState();
        if (tileState == ol.TileState.EMPTY || !opaque) {
          context.clearRect(x, y, width, height);
        }
        if (tileState == ol.TileState.LOADED) {
          context.drawImage(tile.getImage(),
              tileGutter, tileGutter, tilePixelSize, tilePixelSize,
              x, y, width, height);
        }
        interimTileRange =
            tileGrid.getTileRangeForExtentAndZ(tileExtent, z, tmpTileRange);
        minX = Math.max(interimTileRange.minX, canvasTileRange.minX);
        maxX = Math.min(interimTileRange.maxX, canvasTileRange.maxX);
        minY = Math.max(interimTileRange.minY, canvasTileRange.minY);
        maxY = Math.min(interimTileRange.maxY, canvasTileRange.maxY);
        for (ix = minX; ix <= maxX; ++ix) {
          for (iy = minY; iy <= maxY; ++iy) {
            index = (iy - canvasTileRange.minY) * canvasTileRangeWidth +
                    (ix - canvasTileRange.minX);
            this.renderedTiles_[index] = undefined;
          }
        }
      }
    }
  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
  this.scheduleExpireCache(frameState, tileSource);
  this.updateLogos(frameState, tileSource);

  ol.vec.Mat4.makeTransform2D(this.imageTransform_,
      pixelRatio * frameState.size[0] / 2,
      pixelRatio * frameState.size[1] / 2,
      pixelRatio * tilePixelResolution / viewState.resolution,
      pixelRatio * tilePixelResolution / viewState.resolution,
      viewState.rotation,
      (origin[0] - center[0]) / tilePixelResolution,
      (center[1] - origin[1]) / tilePixelResolution);

  return true;
};
