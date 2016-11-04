// FIXME find correct globalCompositeOperation

goog.provide('ol.renderer.canvas.TileLayer');

goog.require('ol');
goog.require('ol.transform');
goog.require('ol.TileRange');
goog.require('ol.Tile');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.renderer.canvas.Layer');


/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Tile|ol.layer.VectorTile} tileLayer Tile layer.
 */
ol.renderer.canvas.TileLayer = function(tileLayer) {

  ol.renderer.canvas.Layer.call(this, tileLayer);

  /**
   * @protected
   * @type {CanvasRenderingContext2D}
   */
  this.context = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {ol.Extent}
   */
  this.renderedExtent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {number}
   */
  this.renderedResolution_;

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_;

  /**
   * @private
   * @type {Array.<string>}
   */
  this.renderedTileKeys_ = null;

  /**
   * @protected
   * @type {ol.Extent}
   */
  this.tmpExtent = ol.extent.createEmpty();

  /**
   * @private
   * @type {ol.TileCoord}
   */
  this.tmpTileCoord_ = [0, 0, 0];

  /**
   * @private
   * @type {ol.Transform}
   */
  this.imageTransform_ = ol.transform.create();

  /**
   * @private
   * @type {ol.Transform}
   */
  this.coordinateToCanvasPixelTransform_ = ol.transform.create();

  /**
   * @protected
   * @type {number}
   */
  this.zDirection = 0;

};
ol.inherits(ol.renderer.canvas.TileLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.prepareFrame = function(
    frameState, layerState) {

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
  var scale = pixelRatio / tilePixelRatio * tileResolution / viewResolution;

  var transform = ol.transform.compose(ol.transform.reset(this.imageTransform_),
      pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
      scale, scale,
      0,
      tilePixelRatio * (imageExtent[0] - viewCenter[0]) / tileResolution,
      tilePixelRatio * (viewCenter[1] - imageExtent[3]) / tileResolution);
  ol.transform.compose(ol.transform.reset(this.coordinateToCanvasPixelTransform_),
      pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
      pixelRatio / viewResolution, -pixelRatio / viewResolution,
      0,
      -viewCenter[0], -viewCenter[1]);

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};
  var loadedTileKeys = [];

  var findLoadedTiles = this.createLoadedTileFinder(
      tileSource, projection, tilesToDrawByZ);

  var useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();

  var tmpExtent = this.tmpExtent;
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, tileCoordKey, x, y;
  var drawableTile = (
      /**
       * @param {!ol.Tile} tile Tile.
       * @return {boolean} Tile is selected.
       */
      function(tile) {
        var tileState = tile.getState();
        return tileState == ol.Tile.State.LOADED ||
            tileState == ol.Tile.State.EMPTY ||
            tileState == ol.Tile.State.ERROR && !useInterimTilesOnError;
      });
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tile = tileSource.getTile(z, x, y, pixelRatio, projection);
      if (!drawableTile(tile)) {
        tile = tile.getInterimTile();
      }
      if (drawableTile(tile)) {
        if (tile.getState() == ol.Tile.State.LOADED) {
          loadedTileKeys.push(tileCoordKey);
          tileCoordKey = tile.tileCoord.toString();
          tilesToDrawByZ[z][tileCoordKey] = tile;
        }
        continue;
      }
      fullyLoaded = tileGrid.forEachTileCoordParentTileRange(
          tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
      if (!fullyLoaded) {
        childTileRange = tileGrid.getTileCoordChildTileRange(
            tile.tileCoord, tmpTileRange, tmpExtent);
        if (childTileRange) {
          findLoadedTiles(z + 1, childTileRange);
        }
      }

    }
  }
  loadedTileKeys.sort();

  if (tileResolution != this.renderedResolution_ ||
      sourceRevision != this.renderedRevision_ ||
      !ol.extent.equals(this.renderedExtent_, imageExtent) ||
      !ol.array.equals(loadedTileKeys, this.renderedTileKeys_)) {

    var tilePixelSize = tileSource.getTilePixelSize(z, pixelRatio, projection);
    var width = tileRange.getWidth() * tilePixelSize[0];
    var height = tileRange.getHeight() * tilePixelSize[0];
    var context = this.context;
    var canvas = context.canvas;
    var opaque = tileSource.getOpaque(projection);
    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    }

    /** @type {Array.<number>} */
    var zs = Object.keys(tilesToDrawByZ).map(Number);
    zs.sort(ol.array.numberSafeCompareFunction);
    var currentResolution, currentScale, currentTilePixelSize, currentZ, i, ii;
    var image, tileExtent, tileGutter, tilesToDraw, w, h;
    for (i = 0, ii = zs.length; i < ii; ++i) {
      currentZ = zs[i];
      currentTilePixelSize = tileSource.getTilePixelSize(currentZ, pixelRatio, projection);
      currentResolution = tileGrid.getResolution(currentZ);
      currentScale = currentResolution / tileResolution;
      tileGutter = tilePixelRatio * tileSource.getGutter(projection);
      tilesToDraw = tilesToDrawByZ[currentZ];
      for (tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.getTileCoord(), tmpExtent);
        x = (tileExtent[0] - imageExtent[0]) / tileResolution * tilePixelRatio;
        y = (imageExtent[3] - tileExtent[3]) / tileResolution * tilePixelRatio;
        w = currentTilePixelSize[0] * currentScale;
        h = currentTilePixelSize[1] * currentScale;
        if (!opaque) {
          context.clearRect(x, y, w, h);
        }
        image = tile.getImage();
        context.drawImage(image, tileGutter, tileGutter,
            image.width, image.height, x, y, w, h);
      }
    }

  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
  this.scheduleExpireCache(frameState, tileSource);
  this.updateLogos(frameState, tileSource);

  this.renderedTileKeys_ = loadedTileKeys;
  this.renderedExtent_ = imageExtent;
  this.renderedResolution_ = tileResolution;
  this.renderedRevision_ = sourceRevision;

  return true;
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.layer.Layer, (Uint8ClampedArray|Uint8Array)): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.canvas.TileLayer.prototype.forEachLayerAtCoordinate = function(
    coordinate, frameState, callback, thisArg) {
  var canvasPixel = ol.transform.apply(this.coordinateToCanvasPixelTransform_, coordinate);

  var imageData = this.context.getImageData(canvasPixel[0], canvasPixel[1], 1, 1).data;
  if (imageData[3] > 0) {
    return callback.call(thisArg, this.getLayer(), imageData);
  } else {
    return undefined;
  }

};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.getImage = function() {
  return this.context.canvas;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.getImageTransform = function() {
  return this.imageTransform_;
};


/**
 * @function
 * @return {ol.layer.Tile|ol.layer.VectorTile}
 */
ol.renderer.canvas.TileLayer.prototype.getLayer;
