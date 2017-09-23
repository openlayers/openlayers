goog.provide('ol.renderer.canvas.VectorTileLayer');

goog.require('ol');
goog.require('ol.LayerType');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.extent');
goog.require('ol.layer.VectorTileRenderType');
goog.require('ol.proj');
goog.require('ol.proj.Units');
goog.require('ol.render.ReplayType');
goog.require('ol.render.canvas');
goog.require('ol.render.canvas.ReplayGroup');
goog.require('ol.render.replay');
goog.require('ol.renderer.Type');
goog.require('ol.renderer.canvas.TileLayer');
goog.require('ol.renderer.vector');
goog.require('ol.transform');


/**
 * @constructor
 * @extends {ol.renderer.canvas.TileLayer}
 * @param {ol.layer.VectorTile} layer VectorTile layer.
 * @api
 */
ol.renderer.canvas.VectorTileLayer = function(layer) {

  /**
   * @type {CanvasRenderingContext2D}
   */
  this.context = null;

  ol.renderer.canvas.TileLayer.call(this, layer);

  /**
   * @private
   * @type {boolean}
   */
  this.dirty_ = false;

  /**
   * @private
   * @type {number}
   */
  this.renderedLayerRevision_;

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
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
ol.renderer.canvas.VectorTileLayer['handles'] = function(type, layer) {
  return type === ol.renderer.Type.CANVAS && layer.getType() === ol.LayerType.VECTOR_TILE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.canvas.VectorTileLayer} The layer renderer.
 */
ol.renderer.canvas.VectorTileLayer['create'] = function(mapRenderer, layer) {
  return new ol.renderer.canvas.VectorTileLayer(/** @type {ol.layer.VectorTile} */ (layer));
};


/**
 * @const
 * @type {!Object.<string, Array.<ol.render.ReplayType>>}
 */
ol.renderer.canvas.VectorTileLayer.IMAGE_REPLAYS = {
  'image': [ol.render.ReplayType.POLYGON, ol.render.ReplayType.CIRCLE,
    ol.render.ReplayType.LINE_STRING, ol.render.ReplayType.IMAGE, ol.render.ReplayType.TEXT],
  'hybrid': [ol.render.ReplayType.POLYGON, ol.render.ReplayType.LINE_STRING]
};


/**
 * @const
 * @type {!Object.<string, Array.<ol.render.ReplayType>>}
 */
ol.renderer.canvas.VectorTileLayer.VECTOR_REPLAYS = {
  'image': [ol.render.ReplayType.DEFAULT],
  'hybrid': [ol.render.ReplayType.IMAGE, ol.render.ReplayType.TEXT, ol.render.ReplayType.DEFAULT],
  'vector': ol.render.replay.ORDER
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.prepareFrame = function(frameState, layerState) {
  var layer = this.getLayer();
  var layerRevision = layer.getRevision();
  if (this.renderedLayerRevision_ != layerRevision) {
    this.renderedTiles.length = 0;
    var renderMode = layer.getRenderMode();
    if (!this.context && renderMode != ol.layer.VectorTileRenderType.VECTOR) {
      this.context = ol.dom.createCanvasContext2D();
    }
    if (this.context && renderMode == ol.layer.VectorTileRenderType.VECTOR) {
      this.context = null;
    }
  }
  this.renderedLayerRevision_ = layerRevision;
  return ol.renderer.canvas.TileLayer.prototype.prepareFrame.apply(this, arguments);
};


/**
 * @param {ol.VectorImageTile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.createReplayGroup_ = function(
    tile, frameState) {
  var layer = this.getLayer();
  var pixelRatio = frameState.pixelRatio;
  var projection = frameState.viewState.projection;
  var revision = layer.getRevision();
  var renderOrder = /** @type {ol.RenderOrderFunction} */
      (layer.getRenderOrder()) || null;

  var replayState = tile.getReplayState(layer);
  if (!replayState.dirty && replayState.renderedRevision == revision &&
      replayState.renderedRenderOrder == renderOrder) {
    return;
  }

  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var sourceTileGrid = source.getTileGrid();
  var tileGrid = source.getTileGridForProjection(projection);
  var resolution = tileGrid.getResolution(tile.tileCoord[0]);
  var tileExtent = tileGrid.getTileCoordExtent(tile.wrappedTileCoord);

  for (var t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
    var sourceTile = tile.getTile(tile.tileKeys[t]);
    if (sourceTile.getState() == ol.TileState.ERROR) {
      continue;
    }

    var sourceTileCoord = sourceTile.tileCoord;
    var sourceTileExtent = sourceTileGrid.getTileCoordExtent(sourceTileCoord);
    var sharedExtent = ol.extent.getIntersection(tileExtent, sourceTileExtent);
    var tileProjection = sourceTile.getProjection();
    var reproject = false;
    if (!ol.proj.equivalent(projection, tileProjection)) {
      reproject = true;
      sourceTile.setProjection(projection);
    }
    replayState.dirty = false;
    var replayGroup = new ol.render.canvas.ReplayGroup(0, sharedExtent,
        resolution, pixelRatio, source.getOverlaps(), layer.getRenderBuffer());
    var squaredTolerance = ol.renderer.vector.getSquaredTolerance(
        resolution, pixelRatio);

    /**
     * @param {ol.Feature|ol.render.Feature} feature Feature.
     * @this {ol.renderer.canvas.VectorTileLayer}
     */
    var renderFeature = function(feature) {
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
        var dirty = this.renderFeature(feature, squaredTolerance, styles,
            replayGroup);
        this.dirty_ = this.dirty_ || dirty;
        replayState.dirty = replayState.dirty || dirty;
      }
    };

    var features = sourceTile.getFeatures();
    if (renderOrder && renderOrder !== replayState.renderedRenderOrder) {
      features.sort(renderOrder);
    }
    var feature;
    for (var i = 0, ii = features.length; i < ii; ++i) {
      feature = features[i];
      if (reproject) {
        if (tileProjection.getUnits() == ol.proj.Units.TILE_PIXELS) {
          // projected tile extent
          tileProjection.setWorldExtent(sourceTileExtent);
          // tile extent in tile pixel space
          tileProjection.setExtent(sourceTile.getExtent());
        }
        feature.getGeometry().transform(tileProjection, projection);
      }
      renderFeature.call(this, feature);
    }
    replayGroup.finish();
    sourceTile.setReplayGroup(layer, tile.tileCoord.toString(), replayGroup);
  }
  replayState.renderedRevision = revision;
  replayState.renderedRenderOrder = renderOrder;
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.drawTileImage = function(
    tile, frameState, layerState, x, y, w, h, gutter, transition) {
  var vectorImageTile = /** @type {ol.VectorImageTile} */ (tile);
  this.createReplayGroup_(vectorImageTile, frameState);
  if (this.context) {
    this.renderTileImage_(vectorImageTile, frameState, layerState);
    ol.renderer.canvas.TileLayer.prototype.drawTileImage.apply(this, arguments);
  }
};


/**
 * @inheritDoc
 */
ol.renderer.canvas.VectorTileLayer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  var resolution = frameState.viewState.resolution;
  var rotation = frameState.viewState.rotation;
  hitTolerance = hitTolerance == undefined ? 0 : hitTolerance;
  var layer = this.getLayer();
  /** @type {Object.<string, boolean>} */
  var features = {};

  /** @type {Array.<ol.VectorImageTile>} */
  var renderedTiles = this.renderedTiles;

  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var tileGrid = source.getTileGridForProjection(frameState.viewState.projection);
  var bufferedExtent, found;
  var i, ii, replayGroup;
  var tile, tileCoord, tileExtent;
  for (i = 0, ii = renderedTiles.length; i < ii; ++i) {
    tile = renderedTiles[i];
    tileCoord = tile.tileCoord;
    tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent);
    bufferedExtent = ol.extent.buffer(tileExtent, hitTolerance * resolution, bufferedExtent);
    if (!ol.extent.containsCoordinate(bufferedExtent, coordinate)) {
      continue;
    }
    for (var t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
      var sourceTile = tile.getTile(tile.tileKeys[t]);
      if (sourceTile.getState() == ol.TileState.ERROR) {
        continue;
      }
      replayGroup = sourceTile.getReplayGroup(layer, tile.tileCoord.toString());
      found = found || replayGroup.forEachFeatureAtCoordinate(
          coordinate, resolution, rotation, hitTolerance, {},
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
  }
  return found;
};


/**
 * @param {ol.VectorTile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @return {ol.Transform} transform Transform.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.getReplayTransform_ = function(tile, frameState) {
  var layer = this.getLayer();
  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var tileGrid = source.getTileGrid();
  var tileCoord = tile.tileCoord;
  var tileResolution = tileGrid.getResolution(tileCoord[0]);
  var viewState = frameState.viewState;
  var pixelRatio = frameState.pixelRatio;
  var renderResolution = viewState.resolution / pixelRatio;
  var tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent);
  var center = viewState.center;
  var origin = ol.extent.getTopLeft(tileExtent);
  var size = frameState.size;
  var offsetX = Math.round(pixelRatio * size[0] / 2);
  var offsetY = Math.round(pixelRatio * size[1] / 2);
  return ol.transform.compose(this.tmpTransform_,
      offsetX, offsetY,
      tileResolution / renderResolution, tileResolution / renderResolution,
      viewState.rotation,
      (origin[0] - center[0]) / tileResolution,
      (center[1] - origin[1]) / tileResolution);
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
ol.renderer.canvas.VectorTileLayer.prototype.postCompose = function(context, frameState, layerState) {
  var layer = this.getLayer();
  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var renderMode = layer.getRenderMode();
  var replays = ol.renderer.canvas.VectorTileLayer.VECTOR_REPLAYS[renderMode];
  var pixelRatio = frameState.pixelRatio;
  var rotation = frameState.viewState.rotation;
  var size = frameState.size;
  var offsetX = Math.round(pixelRatio * size[0] / 2);
  var offsetY = Math.round(pixelRatio * size[1] / 2);
  var tiles = this.renderedTiles;
  var tileGrid = source.getTileGridForProjection(frameState.viewState.projection);
  var clips = [];
  var zs = [];
  for (var i = tiles.length - 1; i >= 0; --i) {
    var tile = /** @type {ol.VectorImageTile} */ (tiles[i]);
    if (tile.getState() == ol.TileState.ABORT) {
      continue;
    }
    var tileCoord = tile.tileCoord;
    var worldOffset = tileGrid.getTileCoordExtent(tileCoord)[0] -
        tileGrid.getTileCoordExtent(tile.wrappedTileCoord)[0];
    for (var t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
      var sourceTile = tile.getTile(tile.tileKeys[t]);
      if (sourceTile.getState() == ol.TileState.ERROR) {
        continue;
      }
      var replayGroup = sourceTile.getReplayGroup(layer, tileCoord.toString());
      if (renderMode != ol.layer.VectorTileRenderType.VECTOR && !replayGroup.hasReplays(replays)) {
        continue;
      }
      var currentZ = sourceTile.tileCoord[0];
      var transform = this.getTransform(frameState, worldOffset);
      var currentClip = replayGroup.getClipCoords(transform);
      context.save();
      context.globalAlpha = layerState.opacity;
      ol.render.canvas.rotateAtOffset(context, -rotation, offsetX, offsetY);
      // Create a clip mask for regions in this low resolution tile that are
      // already filled by a higher resolution tile
      for (var j = 0, jj = clips.length; j < jj; ++j) {
        var clip = clips[j];
        if (currentZ < zs[j]) {
          context.beginPath();
          // counter-clockwise (outer ring) for current tile
          context.moveTo(currentClip[0], currentClip[1]);
          context.lineTo(currentClip[2], currentClip[3]);
          context.lineTo(currentClip[4], currentClip[5]);
          context.lineTo(currentClip[6], currentClip[7]);
          // clockwise (inner ring) for higher resolution tile
          context.moveTo(clip[6], clip[7]);
          context.lineTo(clip[4], clip[5]);
          context.lineTo(clip[2], clip[3]);
          context.lineTo(clip[0], clip[1]);
          context.clip();
        }
      }
      replayGroup.replay(context, transform, rotation, {}, replays);
      context.restore();
      clips.push(currentClip);
      zs.push(currentZ);
    }
  }
  ol.renderer.canvas.TileLayer.prototype.postCompose.apply(this, arguments);
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
 * @param {ol.VectorImageTile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @private
 */
ol.renderer.canvas.VectorTileLayer.prototype.renderTileImage_ = function(
    tile, frameState, layerState) {
  var layer = this.getLayer();
  var replayState = tile.getReplayState(layer);
  var revision = layer.getRevision();
  var replays = ol.renderer.canvas.VectorTileLayer.IMAGE_REPLAYS[layer.getRenderMode()];
  if (replays && replayState.renderedTileRevision !== revision) {
    replayState.renderedTileRevision = revision;
    var tileCoord = tile.wrappedTileCoord;
    var z = tileCoord[0];
    var pixelRatio = frameState.pixelRatio;
    var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
    var tileGrid = source.getTileGridForProjection(frameState.viewState.projection);
    var resolution = tileGrid.getResolution(z);
    var context = tile.getContext(layer);
    var size = source.getTilePixelSize(z, pixelRatio, frameState.viewState.projection);
    context.canvas.width = size[0];
    context.canvas.height = size[1];
    var tileExtent = tileGrid.getTileCoordExtent(tileCoord);
    for (var i = 0, ii = tile.tileKeys.length; i < ii; ++i) {
      var sourceTile = tile.getTile(tile.tileKeys[i]);
      if (sourceTile.getState() == ol.TileState.ERROR) {
        continue;
      }
      var pixelScale = pixelRatio / resolution;
      var transform = ol.transform.reset(this.tmpTransform_);
      ol.transform.scale(transform, pixelScale, -pixelScale);
      ol.transform.translate(transform, -tileExtent[0], -tileExtent[3]);
      var replayGroup = sourceTile.getReplayGroup(layer, tile.tileCoord.toString());
      replayGroup.replay(context, transform, 0, {}, replays, true);
    }
  }
};
