// FIXME find correct globalCompositeOperation

goog.provide('ol.renderer.canvas.TileLayer');

goog.require('ol');
goog.require('ol.transform');
goog.require('ol.TileRange');
goog.require('ol.Tile');
goog.require('ol.array');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.render.canvas');
goog.require('ol.render.EventType');
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
   * @type {ol.Transform}
   */
  this.imageTransform_ = ol.transform.create();

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
  var tileSource = /** @type {ol.source.Tile} */ (tileLayer.getSource());
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
        return tileState == ol.Tile.State.LOADED ||
            tileState == ol.Tile.State.EMPTY ||
            tileState == ol.Tile.State.ERROR && !useInterimTilesOnError;
      });
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tile = tileSource.getTile(z, x, y, pixelRatio, projection);
      if (!drawableTile(tile) && tile.interimTile) {
        tile = tile.interimTile;
      }
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
      if (tile.getState() == ol.Tile.State.LOADED) {
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
 * @param {ol.Pixel} pixel Pixel.
 * @param {olx.FrameState} frameState FrameState.
 * @param {function(this: S, ol.layer.Layer, ol.Color): T} callback Layer
 *     callback.
 * @param {S} thisArg Value to use as `this` when executing `callback`.
 * @return {T|undefined} Callback result.
 * @template S,T,U
 */
ol.renderer.canvas.TileLayer.prototype.forEachLayerAtPixel = function(
    pixel, frameState, callback, thisArg) {
  var canvas = this.context.canvas;
  var size = frameState.size;
  var pixelRatio = frameState.pixelRatio;
  canvas.width = size[0] * pixelRatio;
  canvas.height = size[1] * pixelRatio;
  this.composeFrame(frameState, this.getLayer().getLayerState(), this.context);

  var imageData = this.context.getImageData(
      pixel[0], pixel[1], 1, 1).data;

  if (imageData[3] > 0) {
    return callback.call(thisArg, this.getLayer(),  imageData);
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
  var source = /** @type {ol.source.Tile} */ (layer.getSource());
  var tileGutter = pixelRatio * source.getGutter(projection);
  var tileGrid = source.getTileGridForProjection(projection);

  var hasRenderListeners = layer.hasListener(ol.render.EventType.RENDER);
  var renderContext = context;
  var drawScale = 1;
  var drawOffsetX, drawOffsetY, drawSize;
  if (rotation || hasRenderListeners) {
    renderContext = this.context;
    var renderCanvas = renderContext.canvas;
    drawScale = source.getTilePixelRatio(pixelRatio) / pixelRatio;
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
    offsetX = Math.round(drawScale * (offsetX + drawOffsetX));
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

  var extent = layerState.extent;
  var clipped = extent !== undefined;
  if (clipped) {
    var topLeft = ol.extent.getTopLeft(/** @type {ol.Extent} */ (extent));
    var topRight = ol.extent.getTopRight(/** @type {ol.Extent} */ (extent));
    var bottomRight = ol.extent.getBottomRight(/** @type {ol.Extent} */ (extent));
    var bottomLeft = ol.extent.getBottomLeft(/** @type {ol.Extent} */ (extent));

    ol.transform.apply(frameState.coordinateToPixelTransform, topLeft);
    ol.transform.apply(frameState.coordinateToPixelTransform, topRight);
    ol.transform.apply(frameState.coordinateToPixelTransform, bottomRight);
    ol.transform.apply(frameState.coordinateToPixelTransform, bottomLeft);

    var ox = drawOffsetX || 0;
    var oy = drawOffsetY || 0;
    renderContext.save();
    var cx = (renderContext.canvas.width) / 2;
    var cy = (renderContext.canvas.height) / 2;
    ol.render.canvas.rotateAtOffset(renderContext, -rotation, cx, cy);
    renderContext.beginPath();
    renderContext.moveTo(drawScale * (topLeft[0] * pixelRatio + ox),
        drawScale * (topLeft[1] * pixelRatio + oy));
    renderContext.lineTo(drawScale * (topRight[0] * pixelRatio + ox),
        drawScale * (topRight[1] * pixelRatio + oy));
    renderContext.lineTo(drawScale * (bottomRight[0] * pixelRatio + ox),
        drawScale * (bottomRight[1] * pixelRatio + oy));
    renderContext.lineTo(drawScale * (bottomLeft[0] * pixelRatio + ox),
        drawScale * (bottomLeft[1] * pixelRatio + oy));
    renderContext.clip();
    ol.render.canvas.rotateAtOffset(renderContext, rotation, cx, cy);
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

  if (clipped) {
    renderContext.restore();
  }

  if (hasRenderListeners) {
    var dX = drawOffsetX - offsetX / drawScale + offsetX;
    var dY = drawOffsetY - offsetY / drawScale + offsetY;
    var imageTransform = ol.transform.compose(this.imageTransform_,
        drawSize / 2 - dX, drawSize / 2 - dY,
        pixelScale, -pixelScale,
        -rotation,
        -center[0] + dX / pixelScale, -center[1] - dY / pixelScale);
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
