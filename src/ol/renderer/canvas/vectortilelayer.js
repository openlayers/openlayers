goog.provide('ol.renderer.canvas.VectorTileLayer');

goog.require('ol');
goog.require('ol.array');
goog.require('ol.extent');
goog.require('ol.proj');
goog.require('ol.proj.Units');
goog.require('ol.render.EventType');
goog.require('ol.render.ReplayType');
goog.require('ol.render.canvas');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.render.replay');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.vector');
goog.require('ol.size');
goog.require('ol.transform');


/**
 * @const
 * @type {!Object.<string, Array.<ol.render.ReplayType>>}
 */
ol.renderer.canvas.IMAGE_REPLAYS = {
  'image': ol.render.replay.ORDER,
  'hybrid': [ol.render.ReplayType.POLYGON, ol.render.ReplayType.LINE_STRING]
};


/**
 * @const
 * @type {!Object.<string, Array.<ol.render.ReplayType>>}
 */
ol.renderer.canvas.VECTOR_REPLAYS = {
  'hybrid': [ol.render.ReplayType.IMAGE, ol.render.ReplayType.TEXT],
  'vector': ol.render.replay.ORDER
};


/**
 * @constructor
 * @extends {ol.renderer.canvas.TileLayer}
 * @param {ol.layer.VectorTile} layer VectorTile layer.
 */
ol.renderer.canvas.VectorTileLayer = function(layer) {

  ol.renderer.canvas.TileLayer.call(this, layer);

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {ol.Transform}
   */
  this.tmpTransform_ = ol.transform.create();

  // Use lower resolution for pure vector rendering. Closest resolution otherwise.
  this.zDirection =
      layer.getRenderMode() == ol.layer.VectorTileRenderType.VECTOR ? 1 : 0;

};
ol.inherits(ol.renderer.canvas.VectorTileLayer, ol.renderer.canvas.TileLayer);


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.composeFrame = function(
    frameState, layerState, context) {
  var transform = this.getTransform(frameState, 0);
  this.dispatchPreComposeEvent(context, frameState, transform);

  // clipped rendering if layer extent is set
  var extent = layerState.extent;
  var clipped = extent !== undefined;
  if (clipped) {
    this.clip(context, frameState,  /** @type {ol.Extent} */ (extent));
  }

  var renderMode = this.getLayer().getRenderMode();
  if (renderMode !== ol.layer.VectorTileRenderType.VECTOR) {
    this.renderTileImages(context, frameState, layerState);
  }
  if (renderMode !== ol.layer.VectorTileRenderType.IMAGE) {
    this.renderTileReplays_(context, frameState, layerState);
  }

  if (clipped) {
    context.restore();
  }

  this.dispatchPostComposeEvent(context, frameState, transform);
};


/**
 * @param {CanvasRenderingContext2D} context Context.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.renderTileReplays_ = function(
    context, frameState, layerState) {

  var layer = this.getLayer();
  var replays = ol.renderer.canvas.VECTOR_REPLAYS[layer.getRenderMode()];
  var pixelRatio = frameState.pixelRatio;
  var skippedFeatureUids = layerState.managed ?
      frameState.skippedFeatureUids : {};
  var viewState = frameState.viewState;
  var center = viewState.center;
  var resolution = viewState.resolution;
  var rotation = viewState.rotation;
  var size = frameState.size;
  var pixelScale = pixelRatio / resolution;
  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var tilePixelRatio = source.getTilePixelRatio();

  var transform = this.getTransform(frameState, 0);

  var replayContext;
  if (layer.hasListener(ol.render.EventType.RENDER)) {
    // resize and clear
    this.context.canvas.width = context.canvas.width;
    this.context.canvas.height = context.canvas.height;
    replayContext = this.context;
  } else {
    replayContext = context;
  }
  // for performance reasons, context.save / context.restore is not used
  // to save and restore the transformation matrix and the opacity.
  // see http://jsperf.com/context-save-restore-versus-variable
  var alpha = replayContext.globalAlpha;
  replayContext.globalAlpha = layerState.opacity;

  var tilesToDraw = this.renderedTiles;
  var tileGrid = source.getTileGrid();

  var currentZ, i, ii, offsetX, offsetY, origin, pixelSpace, replayState;
  var tile, tileExtent, tilePixelResolution, tileResolution, tileTransform;
  for (i = 0, ii = tilesToDraw.length; i < ii; ++i) {
    tile = tilesToDraw[i];
    replayState = tile.getReplayState();
    tileExtent = tileGrid.getTileCoordExtent(
        tile.getTileCoord(), this.tmpExtent);
    currentZ = tile.getTileCoord()[0];
    pixelSpace = tile.getProjection().getUnits() == ol.proj.Units.TILE_PIXELS;
    tileResolution = tileGrid.getResolution(currentZ);
    tilePixelResolution = tileResolution / tilePixelRatio;
    offsetX = Math.round(pixelRatio * size[0] / 2);
    offsetY = Math.round(pixelRatio * size[1] / 2);

    if (pixelSpace) {
      origin = ol.extent.getTopLeft(tileExtent);
      tileTransform = ol.transform.reset(this.tmpTransform_);
      tileTransform = ol.transform.compose(this.tmpTransform_,
          offsetX, offsetY,
          pixelScale * tilePixelResolution, pixelScale * tilePixelResolution,
          rotation,
          (origin[0] - center[0]) / tilePixelResolution, (center[1] - origin[1]) / tilePixelResolution);
    } else {
      tileTransform = transform;
    }
    ol.render.canvas.rotateAtOffset(replayContext, -rotation, offsetX, offsetY);
    replayState.replayGroup.replay(replayContext, pixelRatio,
        tileTransform, rotation, skippedFeatureUids, replays);
    ol.render.canvas.rotateAtOffset(replayContext, rotation, offsetX, offsetY);
  }

  if (replayContext != context) {
    this.dispatchRenderEvent(replayContext, frameState, transform);
    context.drawImage(replayContext.canvas, 0, 0);
  }
  replayContext.globalAlpha = alpha;
};


/**
 * @param {ol.VectorTile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 */
ol.renderer.canvas.VectorTileLayer.prototype.createReplayGroup = function(tile,
    frameState) {
  var layer = this.getLayer();
  var pixelRatio = frameState.pixelRatio;
  var projection = frameState.viewState.projection;
  var revision = layer.getRevision();
  var renderOrder = layer.getRenderOrder() || null;

  var replayState = tile.getReplayState();
  if (!replayState.dirty && replayState.renderedRevision == revision &&
      replayState.renderedRenderOrder == renderOrder) {
    return;
  }

  replayState.replayGroup = null;
  replayState.dirty = false;

  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var tileGrid = source.getTileGrid();
  var tileCoord = tile.getTileCoord();
  var tileProjection = tile.getProjection();
  var pixelSpace = tileProjection.getUnits() == ol.proj.Units.TILE_PIXELS;
  var resolution = tileGrid.getResolution(tileCoord[0]);
  var extent, reproject, tileResolution;
  if (pixelSpace) {
    var tilePixelRatio = tileResolution = source.getTilePixelRatio();
    var tileSize = ol.size.toSize(tileGrid.getTileSize(tileCoord[0]));
    extent = [0, 0, tileSize[0] * tilePixelRatio, tileSize[1] * tilePixelRatio];
  } else {
    tileResolution = resolution;
    extent = tileGrid.getTileCoordExtent(tileCoord);
    if (!ol.proj.equivalent(projection, tileProjection)) {
      reproject = true;
      tile.setProjection(projection);
    }
  }
  replayState.dirty = false;
  var replayGroup = new ol.render.canvas.ReplayGroup(0, extent,
      tileResolution, source.getOverlaps(), layer.getRenderBuffer());
  var squaredTolerance = ol.renderer.vector.getSquaredTolerance(
      tileResolution, pixelRatio);

  /**
   * @param {ol.Feature|ol.render.Feature} feature Feature.
   * @this {ol.renderer.canvas.VectorTileLayer}
   */
  function renderFeature(feature) {
    var styles;
    var styleFunction = feature.getStyleFunction();
    if (styleFunction) {
      styles = styleFunction.call(/** @type {ol.Feature} */ (feature), resolution);
    } else {
      styleFunction = layer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
    }
    if (styles) {
      if (!Array.isArray(styles)) {
        styles = [styles];
      }
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
  var feature;
  for (var i = 0, ii = features.length; i < ii; ++i) {
    feature = features[i];
    if (reproject) {
      feature.getGeometry().transform(tileProjection, projection);
    }
    renderFeature.call(this, feature);
  }

  replayGroup.finish();

  replayState.renderedRevision = revision;
  replayState.renderedRenderOrder = renderOrder;
  replayState.replayGroup = replayGroup;
  replayState.resolution = NaN;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, callback, thisArg) {
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  var layer = this.getLayer();
  /** @type {Object.<string, boolean>} */
  var features = {};

  var replayables = this.renderedTiles;
  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var tileGrid = source.getTileGrid();
  var found, tileSpaceCoordinate;
  var i, ii, origin, replayGroup;
  var tile, tileCoord, tileExtent, tilePixelRatio, tileResolution;
  for (i = 0, ii = replayables.length; i < ii; ++i) {
    tile = replayables[i];
    tileCoord = tile.getTileCoord();
    tileExtent = source.getTileGrid().getTileCoordExtent(tileCoord,
        this.tmpExtent);
    if (!ol.extent.containsCoordinate(tileExtent, coordinate)) {
      continue;
    }
    if (tile.getProjection().getUnits() === ol.proj.Units.TILE_PIXELS) {
      origin = ol.extent.getTopLeft(tileExtent);
      tilePixelRatio = source.getTilePixelRatio();
      tileResolution = tileGrid.getResolution(tileCoord[0]) / tilePixelRatio;
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
        tileSpaceCoordinate, resolution, rotation, {},
        /**
         * @param {ol.Feature|ol.render.Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          var key = ol.getUid(feature).toString();
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
 * @param {ol.events.Event} event Image style change event.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.handleStyleImageChange_ = function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.prepareFrame = function(frameState, layerState) {
  var prepared = ol.renderer.canvas.TileLayer.prototype.prepareFrame.call(this, frameState, layerState);
  if (prepared) {
    var skippedFeatures = Object.keys(frameState.skippedFeatureUids_ || {});
    for (var i = 0, ii = this.renderedTiles.length; i < ii; ++i) {
      var tile = /** @type {ol.VectorTile} */ (this.renderedTiles[i]);
      this.createReplayGroup(tile, frameState);
      this.renderTileImage_(tile, frameState, layerState, skippedFeatures);
    }
  }
  return prepared;
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {(ol.style.Style|Array.<ol.style.Style>)} styles The style or array of
 *     styles.
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
ol.renderer.canvas.VectorTileLayer.prototype.renderFeature = function(feature, squaredTolerance, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  var loading = false;
  if (Array.isArray(styles)) {
    for (var i = 0, ii = styles.length; i < ii; ++i) {
      loading = ol.renderer.vector.renderFeature(
          replayGroup, feature, styles[i], squaredTolerance,
          this.handleStyleImageChange_, this) || loading;
    }
  } else {
    loading = ol.renderer.vector.renderFeature(
        replayGroup, feature, styles, squaredTolerance,
        this.handleStyleImageChange_, this) || loading;
  }
  return loading;
};


/**
 * @param {ol.VectorTile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @param {Array.<string>} skippedFeatures Skipped features.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.renderTileImage_ = function(
    tile, frameState, layerState, skippedFeatures) {
  var layer = this.getLayer();
  var replays = ol.renderer.canvas.IMAGE_REPLAYS[layer.getRenderMode()];
  if (!replays) {
    // do not create an image in 'vector' mode
    return;
  }
  var pixelRatio = frameState.pixelRatio;
  var replayState = tile.getReplayState();
  var revision = layer.getRevision();
  if (!ol.array.equals(replayState.skippedFeatures, skippedFeatures) ||
      replayState.renderedTileRevision !== revision) {
    replayState.skippedFeatures = skippedFeatures;
    replayState.renderedTileRevision = revision;
    var tileContext = tile.getContext();
    var source = layer.getSource();
    var tileGrid = source.getTileGrid();
    var currentZ = tile.getTileCoord()[0];
    var resolution = tileGrid.getResolution(currentZ);
    var tileSize = ol.size.toSize(tileGrid.getTileSize(currentZ));
    var tileResolution = tileGrid.getResolution(currentZ);
    var resolutionRatio = tileResolution / resolution;
    var width = tileSize[0] * pixelRatio * resolutionRatio;
    var height = tileSize[1] * pixelRatio * resolutionRatio;
    tileContext.canvas.width = width / resolutionRatio + 0.5;
    tileContext.canvas.height = height / resolutionRatio + 0.5;
    tileContext.scale(1 / resolutionRatio, 1 / resolutionRatio);
    tileContext.translate(width / 2, height / 2);
    var pixelSpace = tile.getProjection().getUnits() == ol.proj.Units.TILE_PIXELS;
    var pixelScale = pixelRatio / resolution;
    var tilePixelRatio = source.getTilePixelRatio();
    var tilePixelResolution = tileResolution / tilePixelRatio;
    var tileExtent = tileGrid.getTileCoordExtent(
        tile.getTileCoord(), this.tmpExtent);
    var tileTransform = ol.transform.reset(this.tmpTransform_);
    if (pixelSpace) {
      ol.transform.scale(tileTransform,
          pixelScale * tilePixelResolution, pixelScale * tilePixelResolution);
      ol.transform.translate(tileTransform,
          -tileSize[0] * tilePixelRatio / 2, -tileSize[1] * tilePixelRatio / 2);
    } else {
      var tileCenter = ol.extent.getCenter(tileExtent);
      ol.transform.scale(tileTransform, pixelScale, -pixelScale);
      ol.transform.translate(tileTransform, -tileCenter[0], -tileCenter[1]);
    }

    replayState.replayGroup.replay(tileContext, pixelRatio,
        tileTransform, 0, frameState.skippedFeatureUids || {}, replays);
  }
};
