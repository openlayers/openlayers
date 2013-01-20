// FIXME don't redraw tiles if not needed
// FIXME find correct globalCompositeOperation
// FIXME optimize :-)

goog.provide('ol.renderer.canvas.TileLayer');

goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.style');
goog.require('goog.vec.Mat4');
goog.require('ol.Size');
goog.require('ol.TileRange');
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

  var tileLayer = this.getTileLayer();
  var tileSource = tileLayer.getTileSource();
  var tileSourceKey = goog.getUid(tileSource).toString();
  var tileGrid = tileSource.getTileGrid();
  var tileSize = tileGrid.getTileSize();
  var z = tileGrid.getZForResolution(view2DState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      frameState.extent, tileResolution);

  var canvasSize = new ol.Size(
      tileSize.width * tileRange.getWidth(),
      tileSize.height * tileRange.getHeight());

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
  } else {
    canvas = this.canvas_;
    context = this.context_;
    if (!this.canvasSize_.equals(canvasSize)) {
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;
      this.canvasSize_ = canvasSize;
    }
  }

  context.clearRect(0, 0, canvasSize.width, canvasSize.height);

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findInterimTiles = function(z, tileRange) {
    // FIXME this could be more efficient about filling partial holes
    var fullyCovered = true;
    var tile, tileCoord, tileCoordKey, x, y;
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
        tileCoord = new ol.TileCoord(z, x, y);
        tileCoordKey = tileCoord.toString();
        if (tilesToDrawByZ[z] && tilesToDrawByZ[z][tileCoordKey]) {
          return;
        }
        tile = tileSource.getTile(tileCoord);
        if (!goog.isNull(tile) && tile.getState() == ol.TileState.LOADED) {
          if (!tilesToDrawByZ[z]) {
            tilesToDrawByZ[z] = {};
          }
          tilesToDrawByZ[z][tileCoordKey] = tile;
        } else {
          fullyCovered = false;
        }
      }
    }
    return fullyCovered;
  };

  var allTilesLoaded = true;
  var tile, tileCenter, tileCoord, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tileCoord = new ol.TileCoord(z, x, y);
      tile = tileSource.getTile(tileCoord);
      if (goog.isNull(tile)) {
        continue;
      }

      tileState = tile.getState();
      if (tileState == ol.TileState.IDLE) {
        tileCenter = tileGrid.getTileCoordCenter(tileCoord);
        frameState.tileQueue.enqueue(tile, tileSourceKey, tileCenter);
      } else if (tileState == ol.TileState.LOADED) {
        tilesToDrawByZ[z][tileCoord.toString()] = tile;
        continue;
      } else if (tileState == ol.TileState.ERROR) {
        continue;
      }

      allTilesLoaded = false;
      tileGrid.forEachTileCoordParentTileRange(tileCoord, findInterimTiles);

    }
  }

  /** @type {Array.<number>} */
  var zs = goog.array.map(goog.object.getKeys(tilesToDrawByZ), Number);
  goog.array.sort(zs);
  var origin = tileGrid.getTileCoordExtent(
      new ol.TileCoord(z, tileRange.minX, tileRange.maxY)).getTopLeft();
  var currentZ, i, scale, tileCoordKey, tileExtent, tilesToDraw;
  for (i = 0; i < zs.length; ++i) {
    currentZ = zs[i];
    tilesToDraw = tilesToDrawByZ[currentZ];
    if (currentZ == z) {
      for (tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        context.drawImage(
            tile.getImage(),
            tileSize.width * (tile.tileCoord.x - tileRange.minX),
            tileSize.height * (tileRange.maxY - tile.tileCoord.y));
      }
    } else {
      scale = tileGrid.getResolution(currentZ) / tileResolution;
      for (tileCoordKey in tilesToDraw) {
        tile = tilesToDraw[tileCoordKey];
        tileExtent = tileGrid.getTileCoordExtent(tile.tileCoord);
        context.drawImage(
            tile.getImage(),
            (tileExtent.minX - origin.x) / tileResolution,
            (origin.y - tileExtent.maxY) / tileResolution,
            scale * tileSize.width,
            scale * tileSize.height);
      }
    }
  }

  if (!allTilesLoaded) {
    frameState.animate = true;
    this.updateWantedTiles(frameState.wantedTiles, tileSource, z, tileRange);
  }

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);

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
      (origin.x - view2DState.center.x) / tileResolution,
      (view2DState.center.y - origin.y) / tileResolution,
      0);

};
