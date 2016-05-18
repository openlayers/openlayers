// FIXME find correct globalCompositeOperation

goog.provide('ol.renderer.canvas.TileLayer');

goog.require('goog.asserts');
goog.require('goog.vec.Mat4');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.render.EventType');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.size');
goog.require('ol.source.Tile');
goog.require('ol.vec.Mat4');


/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Tile|ol.layer.VectorTile} tileLayer Tile layer.
 */
ol.renderer.canvas.TileLayer = function(tileLayer) {

  goog.base(this, tileLayer);

  /**
   * @protected
   * @type {CanvasRenderingContext2D}
   */
  this.context = ol.dom.createCanvasContext2D();

  /**
   * @protected
   * @type {Array.<ol.Tile|undefined>}
   */
  this.renderedTiles = null;

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
   * @type {!goog.vec.Mat4.Number}
   */
  this.imageTransform_ = goog.vec.Mat4.createNumber();

  /**
   * @protected
   * @type {number}
   */
  this.zDirection = 0;

};
goog.inherits(ol.renderer.canvas.TileLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.composeFrame = function(
    frameState, layerState, context) {
  var transform = this.getTransform(frameState, 0);
  this.dispatchPreComposeEvent(context, frameState, transform);
  this.renderTileImages(context, frameState, layerState);
  this.dispatchPostComposeEvent(context, frameState, transform);
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.prepareFrame = function(
    frameState, layerState) {

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var projection = viewState.projection;

  var tileLayer = this.getLayer();
  var tileSource = tileLayer.getSource();
  goog.asserts.assertInstanceof(tileSource, ol.source.Tile,
      'source is an ol.source.Tile');
  var tileGrid = tileSource.getTileGridForProjection(projection);
  var z = tileGrid.getZForResolution(viewState.resolution, this.zDirection);
  var tileResolution = tileGrid.getResolution(z);
  var center = viewState.center;
  var extent;
  if (tileResolution == viewState.resolution) {
    center = this.snapCenterToPixel(center, tileResolution, frameState.size);
    extent = ol.extent.getForViewAndSize(
        center, tileResolution, viewState.rotation, frameState.size);
  } else {
    extent = frameState.extent;
  }

  if (layerState.extent !== undefined) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }
  if (ol.extent.isEmpty(extent)) {
    // Return false to prevent the rendering of the layer.
    return false;
  }

  var tileRange = tileGrid.getTileRangeForExtentAndResolution(
      extent, tileResolution);

  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findLoadedTiles = this.createLoadedTileFinder(
      tileSource, projection, tilesToDrawByZ);

  var useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();

  var tmpExtent = ol.extent.createEmpty();
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, x, y;
  var drawableTile = (
      /**
       * @param {!ol.Tile} tile Tile.
       * @return {boolean} Tile is selected.
       */
      function(tile) {
        var tileState = tile.getState();
        return tileState == ol.TileState.LOADED ||
            tileState == ol.TileState.EMPTY ||
            tileState == ol.TileState.ERROR && !useInterimTilesOnError;
      });
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tile = tileSource.getTile(z, x, y, pixelRatio, projection);
      if (!drawableTile(tile) && tile.interimTile) {
        tile = tile.interimTile;
      }
      goog.asserts.assert(tile);
      if (drawableTile(tile)) {
        tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
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

  /** @type {Array.<number>} */
  var zs = Object.keys(tilesToDrawByZ).map(Number);
  zs.sort(ol.array.numberSafeCompareFunction);
  var renderables = [];
  var i, ii, currentZ, tileCoordKey, tilesToDraw;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    currentZ = zs[i];
    tilesToDraw = tilesToDrawByZ[currentZ];
    for (tileCoordKey in tilesToDraw) {
      tile = tilesToDraw[tileCoordKey];
      if (tile.getState() == ol.TileState.LOADED) {
        renderables.push(tile);
      }
    }
  }
  this.renderedTiles = renderables;

  this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
  this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
  this.scheduleExpireCache(frameState, tileSource);
  this.updateLogos(frameState, tileSource);

  return true;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.forEachLayerAtPixel = function(
    pixel, frameState, callback, thisArg) {
  var canvas = this.context.canvas;
  var size = frameState.size;
  canvas.width = size[0];
  canvas.height = size[1];
  this.composeFrame(frameState, this.getLayer().getLayerState(), this.context);

  var imageData = this.context.getImageData(
      pixel[0], pixel[1], 1, 1).data;

  if (imageData[3] > 0) {
    return callback.call(thisArg, this.getLayer());
  } else {
    return undefined;
  }
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @protected
 */
ol.renderer.canvas.TileLayer.prototype.renderTileImages = function(context, frameState, layerState) {
  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var center = viewState.center;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var rotation = viewState.rotation;
  var size = frameState.size;
  var offsetX = Math.round(pixelRatio * size[0] / 2);
  var offsetY = Math.round(pixelRatio * size[1] / 2);
  var pixelScale = pixelRatio / resolution;
  var layer = this.getLayer();
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.Tile,
      'source is an ol.source.Tile');
  var tileGutter = source.getGutter(projection);
  var tileGrid = source.getTileGridForProjection(projection);

  var hasRenderListeners = layer.hasListener(ol.render.EventType.RENDER);
  var renderContext = context;
  var drawOffsetX, drawOffsetY, drawScale, drawSize;
  if (rotation || hasRenderListeners) {
    renderContext = this.context;
    var renderCanvas = renderContext.canvas;
    var drawZ = tileGrid.getZForResolution(resolution);
    var drawTileSize = source.getTilePixelSize(drawZ, pixelRatio, projection);
    var tileSize = ol.size.toSize(tileGrid.getTileSize(drawZ));
    drawScale = drawTileSize[0] / tileSize[0];
    var width = context.canvas.width * drawScale;
    var height = context.canvas.height * drawScale;
    // Make sure the canvas is big enough for all possible rotation angles
    drawSize = Math.round(Math.sqrt(width * width + height * height));
    if (renderCanvas.width != drawSize) {
      renderCanvas.width = renderCanvas.height = drawSize;
    } else {
      renderContext.clearRect(0, 0, drawSize, drawSize);
    }
    drawOffsetX = (drawSize - width) / 2 / drawScale;
    drawOffsetY = (drawSize - height) / 2 / drawScale;
    pixelScale *= drawScale;
    offsetX = Math.round(drawScale * (offsetX + drawOffsetX))
    offsetY = Math.round(drawScale * (offsetY + drawOffsetY));
  }
  // for performance reasons, context.save / context.restore is not used
  // to save and restore the transformation matrix and the opacity.
  // see http://jsperf.com/context-save-restore-versus-variable
  var alpha = renderContext.globalAlpha;
  renderContext.globalAlpha = layerState.opacity;

  var tilesToDraw = this.renderedTiles;

  var pixelExtents;
  var opaque = source.getOpaque(projection) && layerState.opacity == 1;
  if (!opaque) {
    tilesToDraw.reverse();
    pixelExtents = [];
  }
  for (var i = 0, ii = tilesToDraw.length; i < ii; ++i) {
    var tile = tilesToDraw[i];
    var tileCoord = tile.getTileCoord();
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent);
    var currentZ = tileCoord[0];
    // Calculate all insert points by tile widths from a common origin to avoid
    // gaps caused by rounding
    var origin = ol.extent.getBottomLeft(tileGrid.getTileCoordExtent(
        tileGrid.getTileCoordForCoordAndZ(center, currentZ, this.tmpTileCoord_)));
    var w = Math.round(ol.extent.getWidth(tileExtent) * pixelScale);
    var h = Math.round(ol.extent.getHeight(tileExtent) * pixelScale);
    var left = Math.round((tileExtent[0] - origin[0]) * pixelScale / w) * w +
        offsetX + Math.round((origin[0] - center[0]) * pixelScale);
    var top = Math.round((origin[1] - tileExtent[3]) * pixelScale / h) * h +
        offsetY + Math.round((center[1] - origin[1]) * pixelScale);
    if (!opaque) {
      var pixelExtent = [left, top, left + w, top + h];
      // Create a clip mask for regions in this low resolution tile that are
      // already filled by a higher resolution tile
      renderContext.save();
      for (var j = 0, jj = pixelExtents.length; j < jj; ++j) {
        var clipExtent = pixelExtents[j];
        if (ol.extent.intersects(pixelExtent, clipExtent)) {
          renderContext.beginPath();
          // counter-clockwise (outer ring) for current tile
          renderContext.moveTo(pixelExtent[0], pixelExtent[1]);
          renderContext.lineTo(pixelExtent[0], pixelExtent[3]);
          renderContext.lineTo(pixelExtent[2], pixelExtent[3]);
          renderContext.lineTo(pixelExtent[2], pixelExtent[1]);
          // clockwise (inner ring) for higher resolution tile
          renderContext.moveTo(clipExtent[0], clipExtent[1]);
          renderContext.lineTo(clipExtent[2], clipExtent[1]);
          renderContext.lineTo(clipExtent[2], clipExtent[3]);
          renderContext.lineTo(clipExtent[0], clipExtent[3]);
          renderContext.closePath();
          renderContext.clip();
        }
      }
      pixelExtents.push(pixelExtent);
    }
    var tilePixelSize = source.getTilePixelSize(currentZ, pixelRatio, projection);
    renderContext.drawImage(tile.getImage(), tileGutter, tileGutter,
        tilePixelSize[0], tilePixelSize[1], left, top, w, h);
    if (!opaque) {
      renderContext.restore();
    }
  }

  if (hasRenderListeners) {
    var dX = drawOffsetX - offsetX / drawScale + offsetX;
    var dY = drawOffsetY - offsetY / drawScale + offsetY;
    var imageTransform = ol.vec.Mat4.makeTransform2D(this.imageTransform_,
        drawSize / 2 - dX, drawSize / 2 - dY, pixelScale, -pixelScale,
        -rotation, -center[0] + dX / pixelScale, -center[1] - dY / pixelScale);
    this.dispatchRenderEvent(renderContext, frameState, imageTransform);
  }
  if (rotation || hasRenderListeners) {
    context.drawImage(renderContext.canvas, -Math.round(drawOffsetX),
        -Math.round(drawOffsetY), drawSize / drawScale, drawSize / drawScale);
  }
  renderContext.globalAlpha = alpha;
};


/**
 * @function
 * @return {ol.layer.Tile|ol.layer.VectorTile}
 */
ol.renderer.canvas.TileLayer.prototype.getLayer;
