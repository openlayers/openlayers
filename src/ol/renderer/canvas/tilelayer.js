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
goog.require('ol.renderer.canvas.Layer');


/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.Tile|ol.layer.VectorTile} tileLayer Tile layer.
 */
ol.renderer.canvas.TileLayer = function(tileLayer) {

  ol.renderer.canvas.Layer.call(this, tileLayer);

  /**
   * @private
   * @type {Array.<ol.Extent>}
   * Pixel clip extents with the zoom level for the extent as 5th Element ;-)
   */
  this.clips_ = [];

  /**
   * @protected
   * @type {CanvasRenderingContext2D}
   */
  this.context;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.coordinateToCanvasPixelTransform_ = ol.transform.create();

  /**
   * @protected
   * @type {Array.<ol.Tile>}
   */
  this.renderedTiles = [];

  /**
   * @private
   * @type {number}
   */
  this.renderedRevision_;

  /**
   * @private
   * @type {ol.TileRange}
   */
  this.renderedTileRange_ = null;

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
   * @type {ol.TileRange}
   */
  this.tmpTileRange_ = new ol.TileRange(0, 0, 0, 0);

  /**
   * @private
   * @type {ol.Size}
   */
  this.renderedSize_ = [NaN, NaN];

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
ol.renderer.canvas.TileLayer.prototype.prepareFrame = function(frameState, layerState) {

  var pixelRatio = frameState.pixelRatio;
  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var viewResolution = viewState.resolution;

  var tileLayer = this.getLayer();
  var source = /** @type {ol.source.Tile} */ (tileLayer.getSource());
  var sourceRevision = source.getRevision();
  var tileGrid = source.getTileGridForProjection(projection);
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


  /**
   * @type {Object.<number, Object.<string, ol.Tile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findLoadedTiles = this.createLoadedTileFinder(
      source, projection, tilesToDrawByZ);

  var useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
  var tmpExtent = this.tmpExtent;
  var tmpTileRange = this.tmpTileRange_;
  var newTiles = false;
  var tile, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
      tile = source.getTile(z, x, y, pixelRatio, projection);
      var tileState = tile.getState();
      var drawable = tileState == ol.Tile.State.LOADED ||
          tileState == ol.Tile.State.EMPTY ||
          tileState == ol.Tile.State.ERROR && !useInterimTilesOnError;
      if (!drawable) {
        tile = tile.getInterimTile();
      } else {
        if (tileState == ol.Tile.State.LOADED) {
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

  if (newTiles || !(this.renderedTileRange_ &&
      this.renderedTileRange_.equals(tileRange)) ||
      this.renderedRevision_ != sourceRevision) {

    /** @type {Array.<number>} */
    var zs = Object.keys(tilesToDrawByZ).map(Number);
    zs.sort(ol.array.numberSafeCompareFunction);
    this.renderedTiles.length = 0;
    var tilesToDraw;
    for (var i = 0, ii = zs.length; i < ii; ++i) {
      tilesToDraw = tilesToDrawByZ[zs[i]];
      for (var tileCoordKey in tilesToDraw) {
        this.prepareTileImage(tilesToDraw[tileCoordKey], frameState, layerState);
      }
    }

    this.renderedTileRange_ = tileRange;
    this.renderedRevision_ = sourceRevision;
  }

  this.updateUsedTiles(frameState.usedTiles, source, z, tileRange);
  this.manageTilePyramid(frameState, source, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
  this.scheduleExpireCache(frameState, source);
  this.updateLogos(frameState, source);

  return true;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.TileLayer.prototype.composeFrame = function(frameState, layerState, context) {

  this.preCompose(context, frameState);

  var viewState = frameState.viewState;
  var layer = this.getLayer();
  var source = /** @type {ol.source.Tile} */ (layer.getSource());
  var projection = viewState.projection;
  var viewResolution = viewState.resolution;
  var viewCenter = viewState.center;
  var size = frameState.size;
  var pixelRatio = frameState.pixelRatio;
  var tilePixelRatio = source.getTilePixelRatio(pixelRatio);
  var gutter = tilePixelRatio * source.getGutter(projection);
  var tileGrid = source.getTileGridForProjection(projection);
  var z = tileGrid.getZForResolution(viewState.resolution);
  var tileResolution = tileGrid.getResolution(z);
  var opaque = layer.getOpacity() == 1 && source.getOpaque(projection);
  var scale = pixelRatio * tileResolution / (tilePixelRatio * viewResolution);
  ol.transform.compose(this.coordinateToCanvasPixelTransform_,
      pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
      pixelRatio / viewResolution, -pixelRatio / viewResolution,
      0,
      -viewCenter[0], -viewCenter[1]);

  var extent = layerState.extent;
  var clipped = extent !== undefined;
  if (clipped) {
    this.clip(context, frameState, /** @type {ol.Extent} */ (extent));
  }

  var alpha = context.globalAlpha;
  context.globalAlpha = layerState.opacity;

  this.clips_.length = 0;
  var start = opaque ? 0 : this.renderedTiles.length - 1;
  var end = opaque ? this.renderedTiles.length : -1;
  var step = opaque ? 1 : -1;

  for (var i = start; i !== end; i += step) {
    var tile = this.renderedTiles[i];
    var image = tile.getImage();
    if (!image) {
      continue;
    }
    var tileCoord = tile.tileCoord;
    var currentZ = tileCoord[0];
    var tilePixelSize = source.getTilePixelSize(currentZ, pixelRatio, projection);
    var centerTileCoord = tileGrid.getTileCoordForCoordAndZ(viewCenter, currentZ);
    var centerTileOrigin = ol.extent.getTopLeft(tileGrid.getTileCoordExtent(centerTileCoord));
    ol.transform.apply(this.coordinateToCanvasPixelTransform_, centerTileOrigin);
    var currentTileResolution = tileGrid.getResolution(currentZ);
    var w = Math.round(tilePixelSize[0] * scale * currentTileResolution / tileResolution);
    var h = Math.round(tilePixelSize[1] * scale * currentTileResolution / tileResolution);
    var x = Math.round(centerTileOrigin[0] + (tileCoord[1] - centerTileCoord[1]) * w);
    var y = Math.round(centerTileOrigin[1] + (centerTileCoord[2] - tileCoord[2]) * h);
    var currentClip = [x, y, x + w, y + h, currentZ];
    if (!opaque) {
      context.save();
      var clips = this.clips_;
      for (var j = 0, jj = clips.length; j < jj; ++j) {
        var clip = clips[j];
        if (currentClip[4] < clip[4] && ol.extent.intersects(currentClip, clip)) {
          context.beginPath();
          // counter-clockwise (outer ring) for current tile
          context.moveTo(currentClip[0], currentClip[1]);
          context.lineTo(currentClip[0], currentClip[3]);
          context.lineTo(currentClip[2], currentClip[3]);
          context.lineTo(currentClip[2], currentClip[1]);
          // clockwise (inner ring) for higher resolution tile
          context.moveTo(clip[0], clip[1]);
          context.lineTo(clip[2], clip[1]);
          context.lineTo(clip[2], clip[3]);
          context.lineTo(clip[0], clip[3]);
          context.clip();
        }
      }
    }
    context.drawImage(image, gutter, gutter,
        image.width - 2 * gutter, image.height - 2 * gutter, x, y, w, h);
    if (!opaque) {
      context.restore();
      this.clips_.push(currentClip);
    }
  }
  context.globalAlpha = alpha;
  if (clipped) {
    context.restore();
  }

  if (context !== this.context) {
    this.renderedSize_[0] = context.canvas.width;
    this.renderedSize_[1] = context.canvas.height;
    this.context = null;
  }

  this.postCompose(context, frameState, layerState);
};


/**
 * @param {ol.Tile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 */
ol.renderer.canvas.TileLayer.prototype.prepareTileImage = function(tile, frameState, layerState) {
  this.renderedTiles.push(tile);
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
  if (!this.context) {
    this.context = ol.dom.createCanvasContext2D();
    var canvas = this.context.canvas;
    canvas.width = this.renderedSize_[0];
    canvas.height = this.renderedSize_[1];
    ol.render.canvas.rotateAtOffset(this.context, frameState.viewState.rotation,
        canvas.width / 2, canvas.height / 2);
    this.composeFrame(frameState, this.getLayer().getLayerState(), this.context);
  }
  var canvasPixel = ol.transform.apply(frameState.coordinateToPixelTransform, coordinate);
  var pixelRatio = frameState.pixelRatio;
  var imageData = this.context.getImageData(
      canvasPixel[0] * pixelRatio, canvasPixel[1] * pixelRatio, 1, 1).data;
  if (imageData[3] > 0) {
    return callback.call(thisArg, this.getLayer(), imageData);
  } else {
    return undefined;
  }

};


/**
 * @function
 * @return {ol.layer.Tile|ol.layer.VectorTile}
 */
ol.renderer.canvas.TileLayer.prototype.getLayer;
