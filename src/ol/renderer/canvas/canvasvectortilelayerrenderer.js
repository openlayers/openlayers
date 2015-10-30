goog.provide('ol.renderer.canvas.VectorTileLayer');

goog.require('goog.asserts');
goog.require('goog.events');
goog.require('goog.vec.Mat4');
goog.require('ol.Feature');
goog.require('ol.TileRange');
goog.require('ol.TileState');
goog.require('ol.VectorTile');
goog.require('ol.ViewHint');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.VectorTile');
goog.require('ol.proj.Units');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.renderer.canvas.Layer');
goog.require('ol.renderer.vector');
goog.require('ol.size');
goog.require('ol.source.VectorTile');
goog.require('ol.tilecoord');
goog.require('ol.vec.Mat4');



/**
 * @constructor
 * @extends {ol.renderer.canvas.Layer}
 * @param {ol.layer.VectorTile} layer VectorTile layer.
 */
ol.renderer.canvas.VectorTileLayer = function(layer) {

  goog.base(this, layer);

  /**
   * @private
   * @type {CanvasRenderingContext2D}
   */
  this.context_ = ol.dom.createCanvasContext2D();

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {Array.<ol.VectorTile>}
   */
  this.renderedTiles_ = [];

  /**
   * @private
   * @type {ol.Extent}
   */
  this.tmpExtent_ = ol.extent.createEmpty();

  /**
   * @private
   * @type {ol.Size}
   */
  this.tmpSize_ = [NaN, NaN];

  /**
   * @private
   * @type {!goog.vec.Mat4.Number}
   */
  this.tmpTransform_ = goog.vec.Mat4.createNumber();

};
goog.inherits(ol.renderer.canvas.VectorTileLayer, ol.renderer.canvas.Layer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.composeFrame =
    function(frameState, layerState, context) {

  var pixelRatio = frameState.pixelRatio;
  var skippedFeatureUids = layerState.managed ?
      frameState.skippedFeatureUids : {};
  var viewState = frameState.viewState;
  var center = viewState.center;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var rotation = viewState.rotation;
  var layer = this.getLayer();
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');

  var transform = this.getTransform(frameState, 0);

  this.dispatchPreComposeEvent(context, frameState, transform);

  var replayContext;
  if (layer.hasListener(ol.render.EventType.RENDER)) {
    // resize and clear
    this.context_.canvas.width = context.canvas.width;
    this.context_.canvas.height = context.canvas.height;
    replayContext = this.context_;
  } else {
    replayContext = context;
  }
  // for performance reasons, context.save / context.restore is not used
  // to save and restore the transformation matrix and the opacity.
  // see http://jsperf.com/context-save-restore-versus-variable
  var alpha = replayContext.globalAlpha;
  replayContext.globalAlpha = layerState.opacity;

  var tilesToDraw = this.renderedTiles_;
  var tileGrid = source.getTileGrid();

  var currentZ, i, ii, origin, scale, tile, tileExtent, tileSize;
  var tilePixelRatio, tilePixelResolution, tilePixelSize, tileResolution;
  for (i = 0, ii = tilesToDraw.length; i < ii; ++i) {
    tile = tilesToDraw[i];
    currentZ = tile.getTileCoord()[0];
    tileSize = tileGrid.getTileSize(currentZ);
    tilePixelSize = source.getTilePixelSize(currentZ, pixelRatio, projection);
    tilePixelRatio = tilePixelSize[0] /
        ol.size.toSize(tileSize, this.tmpSize_)[0];
    tileResolution = tileGrid.getResolution(currentZ);
    tilePixelResolution = tileResolution / tilePixelRatio;
    if (tile.getProjection().getUnits() == ol.proj.Units.TILE_PIXELS) {
      origin = ol.extent.getTopLeft(tileGrid.getTileCoordExtent(
          tile.getTileCoord(), this.tmpExtent_));
      transform = ol.vec.Mat4.makeTransform2D(this.tmpTransform_,
          pixelRatio * frameState.size[0] / 2,
          pixelRatio * frameState.size[1] / 2,
          pixelRatio * tilePixelResolution / resolution,
          pixelRatio * tilePixelResolution / resolution,
          viewState.rotation,
          (origin[0] - center[0]) / tilePixelResolution,
          (center[1] - origin[1]) / tilePixelResolution);
    }
    tile.getReplayState().replayGroup.replay(replayContext, pixelRatio,
        transform, rotation, skippedFeatureUids);
  }

  transform = this.getTransform(frameState, 0);

  if (replayContext != context) {
    this.dispatchRenderEvent(replayContext, frameState, transform);
    context.drawImage(replayContext.canvas, 0, 0);
  }
  replayContext.globalAlpha = alpha;

  this.dispatchPostComposeEvent(context, frameState, transform);
};


/**
 * @param {ol.VectorTile} tile Tile.
 * @param {ol.layer.VectorTile} layer Vector tile layer.
 * @param {number} pixelRatio Pixel ratio.
 */
ol.renderer.canvas.VectorTileLayer.prototype.createReplayGroup = function(tile,
    layer, pixelRatio) {
  var revision = layer.getRevision();
  var renderOrder = layer.getRenderOrder() || null;

  var replayState = tile.getReplayState();
  if (!replayState.dirty && replayState.renderedRevision == revision &&
      replayState.renderedRenderOrder == renderOrder) {
    return;
  }

  // FIXME dispose of old replayGroup in post render
  goog.dispose(replayState.replayGroup);
  replayState.replayGroup = null;
  replayState.dirty = false;

  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');
  var tileGrid = source.getTileGrid();
  var tileCoord = tile.getTileCoord();
  var pixelSpace = tile.getProjection().getUnits() == ol.proj.Units.TILE_PIXELS;
  var extent;
  if (pixelSpace) {
    var tilePixelSize = source.getTilePixelSize(tileCoord[0], pixelRatio,
        tile.getProjection());
    extent = [0, 0, tilePixelSize[0], tilePixelSize[1]];
  } else {
    extent = tileGrid.getTileCoordExtent(tileCoord);
  }
  var resolution = tileGrid.getResolution(tileCoord[0]);
  var tileResolution = pixelSpace ? source.getTilePixelRatio() : resolution;
  replayState.dirty = false;
  var replayGroup = new ol.render.canvas.ReplayGroup(0, extent,
      tileResolution, layer.getRenderBuffer());
  var squaredTolerance = ol.renderer.vector.getSquaredTolerance(
      tileResolution, pixelRatio);

  /**
   * @param {ol.Feature|ol.render.Feature} feature Feature.
   * @this {ol.renderer.canvas.VectorTileLayer}
   */
  function renderFeature(feature) {
    var styles;
    if (feature.getStyleFunction()) {
      goog.asserts.assertInstanceof(feature, ol.Feature, 'Got an ol.Feature');
      styles = feature.getStyleFunction().call(feature, resolution);
    } else if (layer.getStyleFunction()) {
      styles = layer.getStyleFunction()(feature, resolution);
    }
    if (styles) {
      var dirty = this.renderFeature(feature, squaredTolerance, styles,
          replayGroup);
      this.dirty_ = this.dirty_ || dirty;
      replayState.dirty = replayState.dirty || dirty;
    }
  }

  var features = tile.getFeatures();
  if (renderOrder && renderOrder !== replayState.renderedRenderOrder) {
    features.sort(renderOrder);
  }
  features.forEach(renderFeature, this);

  replayGroup.finish();

  replayState.renderedRevision = revision;
  replayState.renderedRenderOrder = renderOrder;
  replayState.replayGroup = replayGroup;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.forEachFeatureAtCoordinate =
    function(coordinate, frameState, callback, thisArg) {
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var layer = this.getLayer();
  var layerState = frameState.layerStates[goog.getUid(layer)];
  /** @type {Object.<string, boolean>} */
  var features = {};

  var replayables = this.renderedTiles_;
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');
  var tileGrid = source.getTileGrid();
  var found, tileSpaceCoordinate;
  var i, ii, origin, replayGroup;
  var tile, tileCoord, tileExtent, tilePixelRatio, tileResolution, tileSize;
  for (i = 0, ii = replayables.length; i < ii; ++i) {
    tile = replayables[i];
    tileCoord = tile.getTileCoord();
    tileExtent = source.getTileGrid().getTileCoordExtent(tileCoord,
        this.tmpExtent_);
    if (!ol.extent.containsCoordinate(tileExtent, coordinate)) {
      continue;
    }
    if (tile.getProjection().getUnits() === ol.proj.Units.TILE_PIXELS) {
      origin = ol.extent.getTopLeft(tileExtent);
      tilePixelRatio = source.getTilePixelRatio();
      tileResolution = tileGrid.getResolution(tileCoord[0]) / tilePixelRatio;
      tileSize = ol.size.toSize(tileGrid.getTileSize(tileCoord[0]));
      tileSpaceCoordinate = [
        (coordinate[0] - origin[0]) / tileResolution,
        (origin[1] - coordinate[1]) / tileResolution
      ];
      resolution = tilePixelRatio;
    } else {
      tileSpaceCoordinate = coordinate;
    }
    replayGroup = tile.getReplayState().replayGroup;
    found = found || replayGroup.forEachFeatureAtCoordinate(
        tileSpaceCoordinate, resolution, rotation,
        layerState.managed ? frameState.skippedFeatureUids : {},
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          goog.asserts.assert(feature, 'received a feature');
          var key = goog.getUid(feature).toString();
          if (!(key in features)) {
            features[key] = true;
            return callback.call(thisArg, feature, layer);
          }
        });
  }
  return found;
};


/**
 * Handle changes in image style state.
 * @param {goog.events.Event} event Image style change event.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.handleStyleImageChange_ =
    function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.prepareFrame =
    function(frameState, layerState) {
  var layer = /** @type {ol.layer.Vector} */ (this.getLayer());
  goog.asserts.assertInstanceof(layer, ol.layer.VectorTile,
      'layer is an instance of ol.layer.VectorTile');
  var source = layer.getSource();
  goog.asserts.assertInstanceof(source, ol.source.VectorTile,
      'Source is an ol.source.VectorTile');

  this.updateAttributions(
      frameState.attributions, source.getAttributions());
  this.updateLogos(frameState, source);

  var animating = frameState.viewHints[ol.ViewHint.ANIMATING];
  var interacting = frameState.viewHints[ol.ViewHint.INTERACTING];
  var updateWhileAnimating = layer.getUpdateWhileAnimating();
  var updateWhileInteracting = layer.getUpdateWhileInteracting();

  if (!this.dirty_ && (!updateWhileAnimating && animating) ||
      (!updateWhileInteracting && interacting)) {
    return true;
  }

  var extent = frameState.extent;
  if (layerState.extent) {
    extent = ol.extent.getIntersection(extent, layerState.extent);
  }
  if (ol.extent.isEmpty(extent)) {
    // Return false to prevent the rendering of the layer.
    return false;
  }

  var viewState = frameState.viewState;
  var projection = viewState.projection;
  var resolution = viewState.resolution;
  var pixelRatio = frameState.pixelRatio;

  var tileGrid = source.getTileGrid();
  var resolutions = tileGrid.getResolutions();
  var z = resolutions.length - 1;
  while (z > 0 && resolutions[z] < resolution) {
    --z;
  }
  var tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
  this.updateUsedTiles(frameState.usedTiles, source, z, tileRange);
  this.manageTilePyramid(frameState, source, tileGrid, pixelRatio,
      projection, extent, z, layer.getPreload());
  this.scheduleExpireCache(frameState, source);

  /**
   * @type {Object.<number, Object.<string, ol.VectorTile>>}
   */
  var tilesToDrawByZ = {};
  tilesToDrawByZ[z] = {};

  var findLoadedTiles = this.createLoadedTileFinder(source, projection,
      tilesToDrawByZ);

  var useInterimTilesOnError = layer.getUseInterimTilesOnError();

  var tmpExtent = this.tmpExtent_;
  var tmpTileRange = new ol.TileRange(0, 0, 0, 0);
  var childTileRange, fullyLoaded, tile, tileState, x, y;
  for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
    for (y = tileRange.minY; y <= tileRange.maxY; ++y) {

      tile = source.getTile(z, x, y, pixelRatio, projection);
      goog.asserts.assertInstanceof(tile, ol.VectorTile,
          'Tile is an ol.VectorTile');
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
        childTileRange = tileGrid.getTileCoordChildTileRange(
            tile.tileCoord, tmpTileRange, tmpExtent);
        if (childTileRange) {
          findLoadedTiles(z + 1, childTileRange);
        }
      }

    }
  }

  this.dirty_ = false;

  /** @type {Array.<number>} */
  var zs = Object.keys(tilesToDrawByZ).map(Number);
  zs.sort();
  var replayables = [];
  var i, ii, currentZ, tileCoordKey, tilesToDraw;
  for (i = 0, ii = zs.length; i < ii; ++i) {
    currentZ = zs[i];
    tilesToDraw = tilesToDrawByZ[currentZ];
    for (tileCoordKey in tilesToDraw) {
      tile = tilesToDraw[tileCoordKey];
      if (tile.getState() == ol.TileState.LOADED) {
        replayables.push(tile);
        this.createReplayGroup(tile, layer, pixelRatio);
      }
    }
  }

  this.renderedTiles_ = replayables;

  return true;
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {Array.<ol.style.Style>} styles Array of styles
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
ol.renderer.canvas.VectorTileLayer.prototype.renderFeature =
    function(feature, squaredTolerance, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  var i, ii, loading = false;
  for (i = 0, ii = styles.length; i < ii; ++i) {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles[i], squaredTolerance,
        this.handleStyleImageChange_, this) || loading;
  }
  return loading;
};
