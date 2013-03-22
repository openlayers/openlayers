// FIXME find correct globalCompositeOperation
// FIXME optimize :-)

goog.provide('ol.renderer.canvas.TileLayer');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.vec.Mat4');
goog.require('ol.Extent');
goog.require('ol.Size');
goog.require('ol.Tile');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.layer.TileLayer');
goog.require('ol.renderer.Map');
goog.require('ol.renderer.canvas.Layer');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.renderer.Map} mapRenderer Map renderer.
 * @param {ol.layer.TileLayer} tileLayer Tile layer.
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
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = null;

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.transform_ = goog.vec.Mat4.createNumber();

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
 * @return {ol.layer.TileLayer} Tile layer.
 */
ol.renderer.canvas.TileLayer.prototype.getTileLayer = function() {
  return /** @type {ol.layer.TileLayer} */ (this.getLayer());
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.getTransform = function() {
  return this.transform_;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.renderFrame =
    function(frameState, layerState) {

  var view2DState = frameState.view2DState;
  var projection = view2DState.projection;

  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileSourceKey = goog.getUid(tileSource).toString();
  var tileGrid = tileSource.getTileGrid();
  if (goog.isNull(tileGrid)) {
    tileGrid = ol.tilegrid.getForProjection(projection);
  }
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileSize = tileGrid.getTileSize(z);
  var tileResolution = tileGrid.getResolution(z);
  var center = view2DState.center;
  var extent;
  if (tileResolution == view2DState.resolution) {
    center = this.snapCenterToPixel(center, tileResolution, frameState.size);
    extent = ol.Extent.getForView2DAndSize(
        center, tileResolution, view2DState.rotation, frameState.size);
  } else {
    extent = frameState.extent;
  }
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);
  var tileRangeWidth = tileRange.getWidth();
  var tileRangeHeight = tileRange.getHeight();

  var canvasSize = new ol.Size(
      tileSize.width * tileRangeWidth, tileSize.height * tileRangeHeight);

  var canvas, context;
  if (goog.isNull(this.canvas_)) {
    canvas = /** @type {HTMLCanvasElement} */
        (goog.dom.createElement(goog.dom.TagName.CANVAS));
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    context = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.canvas_ = canvas;
    this.canvasSize_ = canvasSize;
    this.context_ = context;
    this.renderedTiles_ = new Array(tileRangeWidth * tileRangeHeight);
  } else {
    canvas = this.canvas_;
    context = this.context_;
    if (!this.canvasSize_.equals(canvasSize)) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      this.canvasSize_ = canvasSize;
      this.renderedTiles_ = new Array(tileRangeWidth * tileRangeHeight);
    }
  }

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var getTileIfLoaded = this.createGetTileIfLoadedFunction(function(tile) {
    return !goog.isNull(tile) && tile.getState() == ol.TileState.LOADED;
  }, tileSource, tileGrid, projection);
  var findLoadedTiles = goog.bind(tileSource.findLoadedTiles, tileSource,
      tilesToDrawByZ, getTileIfLoaded);

  var allTilesLoaded = true;
  var tile, tileCenter, tileCoord, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tileCoord = new ol.TileCoord(z, x, y);
      tile = tileSource.getTile(tileCoord, tileGrid, projection);
      tileState = tile.getState();
      if (tileState == ol.TileState.IDLE) {
        this.updateWantedTiles(frameState.wantedTiles, tileSource, tileCoord);
        tileCenter = tileGrid.getTileCoordCenter(tileCoord);
        frameState.tileQueue.enqueue(tile, tileSourceKey, tileCenter);
      } else if (tileState == ol.TileState.LOADED ||
                 tileState == ol.TileState.EMPTY) {
        tilesToDrawByZ[z][tileCoord.toString()] = tile;
        continue;
      } else if (tileState == ol.TileState.ERROR) {
        continue;
      }

      allTilesLoaded = false;
      tileGrid.forEachTileCoordParentTileRange(tileCoord, findLoadedTiles);

    }
  }

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);
  var opaque = tileSource.getOpaque();
  var origin = tileGrid.getTileCoordExtent(
      new ol.TileCoord(z, tileRange.minX, tileRange.maxY)).getTopLeft();
  var currentZ, i, index, scale, tileCoordKey, tileExtent, tilesToDraw;
  var ix, iy, interimTileExtent, interimTileRange, maxX, maxY, minX, minY;
  var height, width;
  for (i = 0; i < zs.length; ++i) {
    currentZ = zs[i];
    tileSize = tileGrid.getTileSize(currentZ);
    tilesToDraw = tilesToDrawByZ[currentZ];
    if (currentZ == z) {
      for (tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileCoord = tile.tileCoord;
        index = (tileCoord.y - tileRange.minY) * tileRangeWidth +
                (tileCoord.x - tileRange.minX);
        if (this.renderedTiles_[index] != tile) {
          x = tileSize.width * (tile.tileCoord.x - tileRange.minX);
          y = tileSize.height * (tileRange.maxY - tile.tileCoord.y);
          tileState = tile.getState();
          if (tileState == ol.TileState.EMPTY || !opaque) {
            context.clearRect(x, y, tileSize.width, tileSize.height);
          }
          if (tileState == ol.TileState.LOADED) {
            context.drawImage(tile.getImage(), x, y);
          }
          this.renderedTiles_[index] = tile;
        }
      }
    } else {
      scale = tileGrid.getResolution(currentZ) / tileResolution;
      for (tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord);
        x = (tileExtent.minX - origin.x) / tileResolution;
        y = (origin.y - tileExtent.maxY) / tileResolution;
        width = scale * tileSize.width;
        height = scale * tileSize.height;
        tileState = tile.getState();
        if (tileState == ol.TileState.EMPTY || !opaque) {
          context.clearRect(x, y, width, height);
        }
        if (tileState == ol.TileState.LOADED) {
          context.drawImage(tile.getImage(), x, y, width, height);
        }
        interimTileRange =
            tileGrid.getTileRangeForExtentAndZ(tileExtent, z);
        minX = Math.max(interimTileRange.minX, tileRange.minX);
        maxX = Math.min(interimTileRange.maxX, tileRange.maxX);
        minY = Math.max(interimTileRange.minY, tileRange.minY);
        maxY = Math.min(interimTileRange.maxY, tileRange.maxY);
        for (ix = minX; ix <= maxX; ++ix) {
          for (iy = minY; iy <= maxY; ++iy) {
            this.renderedTiles_[(iy - tileRange.minY) * tileRangeWidth +
                                (ix - tileRange.minX)] = undefined;
          }
        }
      }
    }
  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  tileSource.useLowResolutionTiles(z, extent, tileGrid);
  this.scheduleExpireCache(frameState, tileSource);

  var transform = this.transform_;
  goog.vec.Mat4.makeIdentity(transform);
  goog.vec.Mat4.translate(transform,
      frameState.size.width / 2, frameState.size.height / 2, 0);
  goog.vec.Mat4.rotateZ(transform, view2DState.rotation);
  goog.vec.Mat4.scale(
      transform,
      tileResolution / view2DState.resolution,
      tileResolution / view2DState.resolution,
      1);
  goog.vec.Mat4.translate(
      transform,
      (origin.x - center.x) / tileResolution,
      (center.y - origin.y) / tileResolution,
      0);

};
