// FIXME find correct globalCompositeOperation

import _ol_ from '../../index';
import _ol_LayerType_ from '../../layertype';
import _ol_TileRange_ from '../../tilerange';
import _ol_TileState_ from '../../tilestate';
import _ol_ViewHint_ from '../../viewhint';
import _ol_array_ from '../../array';
import _ol_dom_ from '../../dom';
import _ol_extent_ from '../../extent';
import _ol_renderer_Type_ from '../type';
import _ol_renderer_canvas_IntermediateCanvas_ from '../canvas/intermediatecanvas';
import _ol_transform_ from '../../transform';

/**
 * @constructor
 * @extends {ol.renderer.canvas.IntermediateCanvas}
 * @param {ol.layer.Tile|ol.layer.VectorTile} tileLayer Tile layer.
 * @api
 */
var _ol_renderer_canvas_TileLayer_ = function(tileLayer) {

  _ol_renderer_canvas_IntermediateCanvas_.call(this, tileLayer);

  /**
   * @protected
   * @type {CanvasRenderingContext2D}
   */
  this.context = this.context === null ? null :  _ol_dom_.createCanvasContext2D();

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
  this.tmpExtent = _ol_extent_.createEmpty();

  /**
   * @private
   * @type {ol.TileRange}
   */
  this.tmpTileRange_ = new _ol_TileRange_(0, 0, 0, 0);

  /**
   * @private
   * @type {ol.Transform}
   */
  this.imageTransform_ = _ol_transform_.create();

  /**
   * @protected
   * @type {number}
   */
  this.zDirection = 0;

};

_ol_.inherits(_ol_renderer_canvas_TileLayer_, _ol_renderer_canvas_IntermediateCanvas_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_canvas_TileLayer_['handles'] = function(type, layer) {
  return type === _ol_renderer_Type_.CANVAS && layer.getType() === _ol_LayerType_.TILE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.canvas.TileLayer} The layer renderer.
 */
_ol_renderer_canvas_TileLayer_['create'] = function(mapRenderer, layer) {
  return new _ol_renderer_canvas_TileLayer_(/** @type {ol.layer.Tile} */ (layer));
};


/**
 * @private
 * @param {ol.Tile} tile Tile.
 * @return {boolean} Tile is drawable.
 */
_ol_renderer_canvas_TileLayer_.prototype.isDrawableTile_ = function(tile) {
  var tileState = tile.getState();
  var useInterimTilesOnError = this.getLayer().getUseInterimTilesOnError();
  return tileState == _ol_TileState_.LOADED ||
      tileState == _ol_TileState_.EMPTY ||
      tileState == _ol_TileState_.ERROR && !useInterimTilesOnError;
};

/**
 * @inheritDoc
 */
_ol_renderer_canvas_TileLayer_.prototype.prepareFrame = function(frameState, layerState) {

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
    extent = _ol_extent_.getIntersection(extent, layerState.extent);
  }
  if (_ol_extent_.isEmpty(extent)) {
    // Return false to prevent the rendering of the layer.
    return false;
  }

  var tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
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
      if (tile.getState() == _ol_TileState_.ERROR) {
        if (!tileLayer.getUseInterimTilesOnError()) {
          // When useInterimTilesOnError is false, we consider the error tile as loaded.
          tile.setState(_ol_TileState_.LOADED);
        } else if (tileLayer.getPreload() > 0) {
          // Preloaded tiles for lower resolutions might have finished loading.
          newTiles = true;
        }
      }
      if (!this.isDrawableTile_(tile)) {
        tile = tile.getInterimTile();
      }
      if (this.isDrawableTile_(tile)) {
        if (tile.getState() == _ol_TileState_.LOADED) {
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

  var renderedResolution = tileResolution * pixelRatio / tilePixelRatio * oversampling;
  var hints = frameState.viewHints;
  var animatingOrInteracting = hints[_ol_ViewHint_.ANIMATING] || hints[_ol_ViewHint_.INTERACTING];
  if (!(this.renderedResolution && Date.now() - frameState.time > 16 && animatingOrInteracting) && (
    newTiles ||
        !(this.renderedExtent_ && _ol_extent_.containsExtent(this.renderedExtent_, extent)) ||
        this.renderedRevision != sourceRevision ||
        oversampling != this.oversampling_ ||
        !animatingOrInteracting && renderedResolution != this.renderedResolution
  )) {

    var context = this.context;
    if (context) {
      var tilePixelSize = tileSource.getTilePixelSize(z, pixelRatio, projection);
      var width = Math.round(tileRange.getWidth() * tilePixelSize[0] / oversampling);
      var height = Math.round(tileRange.getHeight() * tilePixelSize[1] / oversampling);
      var canvas = context.canvas;
      if (canvas.width != width || canvas.height != height) {
        this.oversampling_ = oversampling;
        canvas.width = width;
        canvas.height = height;
      } else {
        context.clearRect(0, 0, width, height);
        oversampling = this.oversampling_;
      }
    }

    this.renderedTiles.length = 0;
    /** @type {Array.<number>} */
    var zs = Object.keys(tilesToDrawByZ).map(Number);
    zs.sort(_ol_array_.numberSafeCompareFunction);
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
        this.drawTileImage(tile, frameState, layerState, x, y, w, h, tileGutter);
        this.renderedTiles.push(tile);
      }
    }

    this.renderedRevision = sourceRevision;
    this.renderedResolution = tileResolution * pixelRatio / tilePixelRatio * oversampling;
    this.renderedExtent_ = imageExtent;
  }

  var scale = this.renderedResolution / viewResolution;
  var transform = _ol_transform_.compose(this.imageTransform_,
      pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
      scale, scale,
      0,
      (this.renderedExtent_[0] - viewCenter[0]) / this.renderedResolution * pixelRatio,
      (viewCenter[1] - this.renderedExtent_[3]) / this.renderedResolution * pixelRatio);
  _ol_transform_.compose(this.coordinateToCanvasPixelTransform,
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
_ol_renderer_canvas_TileLayer_.prototype.drawTileImage = function(tile, frameState, layerState, x, y, w, h, gutter) {
  if (!this.getLayer().getSource().getOpaque(frameState.viewState.projection)) {
    this.context.clearRect(x, y, w, h);
  }
  var image = tile.getImage(this.getLayer());
  if (image) {
    this.context.drawImage(image, gutter, gutter,
        image.width - 2 * gutter, image.height - 2 * gutter, x, y, w, h);
  }
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_TileLayer_.prototype.getImage = function() {
  var context = this.context;
  return context ? context.canvas : null;
};


/**
 * @function
 * @return {ol.layer.Tile|ol.layer.VectorTile}
 */
_ol_renderer_canvas_TileLayer_.prototype.getLayer;


/**
 * @inheritDoc
 */
_ol_renderer_canvas_TileLayer_.prototype.getImageTransform = function() {
  return this.imageTransform_;
};
export default _ol_renderer_canvas_TileLayer_;
