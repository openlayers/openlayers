/**
 * @module ol/renderer/canvas/VectorTileLayer
 */
import {getUid, inherits} from '../../index.js';
import _ol_LayerType_ from '../../LayerType.js';
import _ol_TileState_ from '../../TileState.js';
import {createCanvasContext2D} from '../../dom.js';
import _ol_events_ from '../../events.js';
import EventType from '../../events/EventType.js';
import _ol_ext_rbush_ from 'rbush';
import {buffer, containsCoordinate, equals, getIntersection, getTopLeft, intersects} from '../../extent.js';
import _ol_layer_VectorTileRenderType_ from '../../layer/VectorTileRenderType.js';
import {equivalent as equivalentProjection} from '../../proj.js';
import _ol_proj_Units_ from '../../proj/Units.js';
import _ol_render_ReplayType_ from '../../render/ReplayType.js';
import _ol_render_canvas_ from '../../render/canvas.js';
import _ol_render_canvas_ReplayGroup_ from '../../render/canvas/ReplayGroup.js';
import _ol_render_replay_ from '../../render/replay.js';
import _ol_renderer_Type_ from '../Type.js';
import _ol_renderer_canvas_TileLayer_ from '../canvas/TileLayer.js';
import _ol_renderer_vector_ from '../vector.js';
import _ol_transform_ from '../../transform.js';

/**
 * @constructor
 * @extends {ol.renderer.canvas.TileLayer}
 * @param {ol.layer.VectorTile} layer VectorTile layer.
 * @api
 */
var _ol_renderer_canvas_VectorTileLayer_ = function(layer) {

  /**
   * @type {CanvasRenderingContext2D}
   */
  this.context = null;

  _ol_renderer_canvas_TileLayer_.call(this, layer);

  /**
   * Declutter tree.
   * @private
     */
  this.declutterTree_ = layer.getDeclutter() ? _ol_ext_rbush_(9) : null;

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
  this.tmpTransform_ = _ol_transform_.create();

  // Use lower resolution for pure vector rendering. Closest resolution otherwise.
  this.zDirection =
      layer.getRenderMode() == _ol_layer_VectorTileRenderType_.VECTOR ? 1 : 0;

  _ol_events_.listen(_ol_render_canvas_.labelCache, EventType.CLEAR, this.handleFontsChanged_, this);

};

inherits(_ol_renderer_canvas_VectorTileLayer_, _ol_renderer_canvas_TileLayer_);


/**
 * Determine if this renderer handles the provided layer.
 * @param {ol.renderer.Type} type The renderer type.
 * @param {ol.layer.Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
_ol_renderer_canvas_VectorTileLayer_['handles'] = function(type, layer) {
  return type === _ol_renderer_Type_.CANVAS && layer.getType() === _ol_LayerType_.VECTOR_TILE;
};


/**
 * Create a layer renderer.
 * @param {ol.renderer.Map} mapRenderer The map renderer.
 * @param {ol.layer.Layer} layer The layer to be rendererd.
 * @return {ol.renderer.canvas.VectorTileLayer} The layer renderer.
 */
_ol_renderer_canvas_VectorTileLayer_['create'] = function(mapRenderer, layer) {
  return new _ol_renderer_canvas_VectorTileLayer_(/** @type {ol.layer.VectorTile} */ (layer));
};


/**
 * @const
 * @type {!Object.<string, Array.<ol.render.ReplayType>>}
 */
_ol_renderer_canvas_VectorTileLayer_.IMAGE_REPLAYS = {
  'image': [_ol_render_ReplayType_.POLYGON, _ol_render_ReplayType_.CIRCLE,
    _ol_render_ReplayType_.LINE_STRING, _ol_render_ReplayType_.IMAGE, _ol_render_ReplayType_.TEXT],
  'hybrid': [_ol_render_ReplayType_.POLYGON, _ol_render_ReplayType_.LINE_STRING]
};


/**
 * @const
 * @type {!Object.<string, Array.<ol.render.ReplayType>>}
 */
_ol_renderer_canvas_VectorTileLayer_.VECTOR_REPLAYS = {
  'image': [_ol_render_ReplayType_.DEFAULT],
  'hybrid': [_ol_render_ReplayType_.IMAGE, _ol_render_ReplayType_.TEXT, _ol_render_ReplayType_.DEFAULT],
  'vector': _ol_render_replay_.ORDER
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.disposeInternal = function() {
  _ol_events_.unlisten(_ol_render_canvas_.labelCache, EventType.CLEAR, this.handleFontsChanged_, this);
  _ol_renderer_canvas_TileLayer_.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.prepareFrame = function(frameState, layerState) {
  var layer = this.getLayer();
  var layerRevision = layer.getRevision();
  if (this.renderedLayerRevision_ != layerRevision) {
    this.renderedTiles.length = 0;
    var renderMode = layer.getRenderMode();
    if (!this.context && renderMode != _ol_layer_VectorTileRenderType_.VECTOR) {
      this.context = createCanvasContext2D();
    }
    if (this.context && renderMode == _ol_layer_VectorTileRenderType_.VECTOR) {
      this.context = null;
    }
  }
  this.renderedLayerRevision_ = layerRevision;
  return _ol_renderer_canvas_TileLayer_.prototype.prepareFrame.apply(this, arguments);
};


/**
 * @param {ol.VectorImageTile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @private
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.createReplayGroup_ = function(
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

  var zIndexKeys = {};
  for (var t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
    var sourceTile = tile.getTile(tile.tileKeys[t]);
    if (sourceTile.getState() == _ol_TileState_.ERROR) {
      continue;
    }

    var sourceTileCoord = sourceTile.tileCoord;
    var sourceTileExtent = sourceTileGrid.getTileCoordExtent(sourceTileCoord);
    var sharedExtent = getIntersection(tileExtent, sourceTileExtent);
    var bufferedExtent = equals(sourceTileExtent, sharedExtent) ? null :
      buffer(sharedExtent, layer.getRenderBuffer() * resolution);
    var tileProjection = sourceTile.getProjection();
    var reproject = false;
    if (!equivalentProjection(projection, tileProjection)) {
      reproject = true;
      sourceTile.setProjection(projection);
    }
    replayState.dirty = false;
    var replayGroup = new _ol_render_canvas_ReplayGroup_(0, sharedExtent, resolution,
        pixelRatio, source.getOverlaps(), this.declutterTree_, layer.getRenderBuffer());
    var squaredTolerance = _ol_renderer_vector_.getSquaredTolerance(
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
        if (tileProjection.getUnits() == _ol_proj_Units_.TILE_PIXELS) {
          // projected tile extent
          tileProjection.setWorldExtent(sourceTileExtent);
          // tile extent in tile pixel space
          tileProjection.setExtent(sourceTile.getExtent());
        }
        feature.getGeometry().transform(tileProjection, projection);
      }
      if (!bufferedExtent || intersects(bufferedExtent, feature.getGeometry().getExtent())) {
        renderFeature.call(this, feature);
      }
    }
    replayGroup.finish();
    for (var r in replayGroup.getReplays()) {
      zIndexKeys[r] = true;
    }
    sourceTile.setReplayGroup(layer, tile.tileCoord.toString(), replayGroup);
  }
  replayState.renderedRevision = revision;
  replayState.renderedRenderOrder = renderOrder;
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.drawTileImage = function(
    tile, frameState, layerState, x, y, w, h, gutter, transition) {
  var vectorImageTile = /** @type {ol.VectorImageTile} */ (tile);
  this.createReplayGroup_(vectorImageTile, frameState);
  if (this.context) {
    this.renderTileImage_(vectorImageTile, frameState, layerState);
    _ol_renderer_canvas_TileLayer_.prototype.drawTileImage.apply(this, arguments);
  }
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
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
    tileCoord = tile.wrappedTileCoord;
    tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent);
    bufferedExtent = buffer(tileExtent, hitTolerance * resolution, bufferedExtent);
    if (!containsCoordinate(bufferedExtent, coordinate)) {
      continue;
    }
    for (var t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
      var sourceTile = tile.getTile(tile.tileKeys[t]);
      if (sourceTile.getState() == _ol_TileState_.ERROR) {
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
            var key = getUid(feature).toString();
            if (!(key in features)) {
              features[key] = true;
              return callback.call(thisArg, feature, layer);
            }
          }, null);
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
_ol_renderer_canvas_VectorTileLayer_.prototype.getReplayTransform_ = function(tile, frameState) {
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
  var origin = getTopLeft(tileExtent);
  var size = frameState.size;
  var offsetX = Math.round(pixelRatio * size[0] / 2);
  var offsetY = Math.round(pixelRatio * size[1] / 2);
  return _ol_transform_.compose(this.tmpTransform_,
      offsetX, offsetY,
      tileResolution / renderResolution, tileResolution / renderResolution,
      viewState.rotation,
      (origin[0] - center[0]) / tileResolution,
      (center[1] - origin[1]) / tileResolution);
};


/**
 * @param {ol.events.Event} event Event.
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.handleFontsChanged_ = function(event) {
  var layer = this.getLayer();
  if (layer.getVisible() && this.renderedLayerRevision_ !== undefined) {
    layer.changed();
  }
};


/**
 * Handle changes in image style state.
 * @param {ol.events.Event} event Image style change event.
 * @private
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.handleStyleImageChange_ = function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.postCompose = function(context, frameState, layerState) {
  var layer = this.getLayer();
  var declutterReplays = layer.getDeclutter() ? {} : null;
  var source = /** @type {ol.source.VectorTile} */ (layer.getSource());
  var renderMode = layer.getRenderMode();
  var replayTypes = _ol_renderer_canvas_VectorTileLayer_.VECTOR_REPLAYS[renderMode];
  var pixelRatio = frameState.pixelRatio;
  var rotation = frameState.viewState.rotation;
  var size = frameState.size;
  var offsetX, offsetY;
  if (rotation) {
    offsetX = Math.round(pixelRatio * size[0] / 2);
    offsetY = Math.round(pixelRatio * size[1] / 2);
    _ol_render_canvas_.rotateAtOffset(context, -rotation, offsetX, offsetY);
  }
  if (declutterReplays) {
    this.declutterTree_.clear();
  }
  var tiles = this.renderedTiles;
  var tileGrid = source.getTileGridForProjection(frameState.viewState.projection);
  var clips = [];
  var zs = [];
  for (var i = tiles.length - 1; i >= 0; --i) {
    var tile = /** @type {ol.VectorImageTile} */ (tiles[i]);
    if (tile.getState() == _ol_TileState_.ABORT) {
      continue;
    }
    var tileCoord = tile.tileCoord;
    var worldOffset = tileGrid.getTileCoordExtent(tileCoord)[0] -
        tileGrid.getTileCoordExtent(tile.wrappedTileCoord)[0];
    var transform = undefined;
    for (var t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
      var sourceTile = tile.getTile(tile.tileKeys[t]);
      if (sourceTile.getState() == _ol_TileState_.ERROR) {
        continue;
      }
      var replayGroup = sourceTile.getReplayGroup(layer, tileCoord.toString());
      if (renderMode != _ol_layer_VectorTileRenderType_.VECTOR && !replayGroup.hasReplays(replayTypes)) {
        continue;
      }
      if (!transform) {
        transform = this.getTransform(frameState, worldOffset);
      }
      var currentZ = sourceTile.tileCoord[0];
      var currentClip = replayGroup.getClipCoords(transform);
      context.save();
      context.globalAlpha = layerState.opacity;
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
      replayGroup.replay(context, transform, rotation, {}, replayTypes, declutterReplays);
      context.restore();
      clips.push(currentClip);
      zs.push(currentZ);
    }
  }
  if (declutterReplays) {
    _ol_render_canvas_ReplayGroup_.replayDeclutter(declutterReplays, context, rotation);
  }
  if (rotation) {
    _ol_render_canvas_.rotateAtOffset(context, rotation,
        /** @type {number} */ (offsetX), /** @type {number} */ (offsetY));
  }
  _ol_renderer_canvas_TileLayer_.prototype.postCompose.apply(this, arguments);
};


/**
 * @param {ol.Feature|ol.render.Feature} feature Feature.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {(ol.style.Style|Array.<ol.style.Style>)} styles The style or array of
 *     styles.
 * @param {ol.render.canvas.ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.renderFeature = function(feature, squaredTolerance, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  var loading = false;
  if (Array.isArray(styles)) {
    for (var i = 0, ii = styles.length; i < ii; ++i) {
      loading = _ol_renderer_vector_.renderFeature(
          replayGroup, feature, styles[i], squaredTolerance,
          this.handleStyleImageChange_, this) || loading;
    }
  } else {
    loading = _ol_renderer_vector_.renderFeature(
        replayGroup, feature, styles, squaredTolerance,
        this.handleStyleImageChange_, this);
  }
  return loading;
};


/**
 * @param {ol.VectorImageTile} tile Tile.
 * @param {olx.FrameState} frameState Frame state.
 * @param {ol.LayerState} layerState Layer state.
 * @private
 */
_ol_renderer_canvas_VectorTileLayer_.prototype.renderTileImage_ = function(
    tile, frameState, layerState) {
  var layer = this.getLayer();
  var replayState = tile.getReplayState(layer);
  var revision = layer.getRevision();
  var replays = _ol_renderer_canvas_VectorTileLayer_.IMAGE_REPLAYS[layer.getRenderMode()];
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
      if (sourceTile.getState() == _ol_TileState_.ERROR) {
        continue;
      }
      var pixelScale = pixelRatio / resolution;
      var transform = _ol_transform_.reset(this.tmpTransform_);
      _ol_transform_.scale(transform, pixelScale, -pixelScale);
      _ol_transform_.translate(transform, -tileExtent[0], -tileExtent[3]);
      var replayGroup = sourceTile.getReplayGroup(layer, tile.tileCoord.toString());
      replayGroup.replay(context, transform, 0, {}, replays);
    }
  }
};
export default _ol_renderer_canvas_VectorTileLayer_;
