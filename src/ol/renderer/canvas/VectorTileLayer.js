/**
 * @module ol/renderer/canvas/VectorTileLayer
 */
import {getUid, inherits} from '../../util.js';
import LayerType from '../../LayerType.js';
import TileState from '../../TileState.js';
import {createCanvasContext2D} from '../../dom.js';
import {listen, unlisten} from '../../events.js';
import EventType from '../../events/EventType.js';
import rbush from 'rbush';
import {buffer, containsCoordinate, equals, getIntersection, getTopLeft, intersects} from '../../extent.js';
import VectorTileRenderType from '../../layer/VectorTileRenderType.js';
import {equivalent as equivalentProjection} from '../../proj.js';
import Units from '../../proj/Units.js';
import ReplayType from '../../render/ReplayType.js';
import {labelCache, rotateAtOffset} from '../../render/canvas.js';
import CanvasReplayGroup, {replayDeclutter} from '../../render/canvas/ReplayGroup.js';
import {ORDER} from '../../render/replay.js';
import CanvasTileLayerRenderer from '../canvas/TileLayer.js';
import {getSquaredTolerance as getSquaredRenderTolerance, renderFeature} from '../vector.js';
import {
  create as createTransform,
  compose as composeTransform,
  reset as resetTransform,
  scale as scaleTransform,
  translate as translateTransform
} from '../../transform.js';


/**
 * @type {!Object.<string, Array.<module:ol/render/ReplayType>>}
 */
const IMAGE_REPLAYS = {
  'image': [ReplayType.POLYGON, ReplayType.CIRCLE,
    ReplayType.LINE_STRING, ReplayType.IMAGE, ReplayType.TEXT],
  'hybrid': [ReplayType.POLYGON, ReplayType.LINE_STRING]
};


/**
 * @type {!Object.<string, Array.<module:ol/render/ReplayType>>}
 */
const VECTOR_REPLAYS = {
  'image': [ReplayType.DEFAULT],
  'hybrid': [ReplayType.IMAGE, ReplayType.TEXT, ReplayType.DEFAULT],
  'vector': ORDER
};


/**
 * @constructor
 * @extends {module:ol/renderer/canvas/TileLayer}
 * @param {module:ol/layer/VectorTile} layer VectorTile layer.
 * @api
 */
const CanvasVectorTileLayerRenderer = function(layer) {

  /**
   * @type {CanvasRenderingContext2D}
   */
  this.context = null;

  CanvasTileLayerRenderer.call(this, layer);

  /**
   * Declutter tree.
   * @private
   */
  this.declutterTree_ = layer.getDeclutter() ? rbush(9, undefined) : null;

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
   * @type {module:ol/transform~Transform}
   */
  this.tmpTransform_ = createTransform();

  // Use lower resolution for pure vector rendering. Closest resolution otherwise.
  this.zDirection = layer.getRenderMode() == VectorTileRenderType.VECTOR ? 1 : 0;

  listen(labelCache, EventType.CLEAR, this.handleFontsChanged_, this);

};

inherits(CanvasVectorTileLayerRenderer, CanvasTileLayerRenderer);


/**
 * Determine if this renderer handles the provided layer.
 * @param {module:ol/layer/Layer} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
CanvasVectorTileLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.VECTOR_TILE;
};


/**
 * Create a layer renderer.
 * @param {module:ol/renderer/Map} mapRenderer The map renderer.
 * @param {module:ol/layer/Layer} layer The layer to be rendererd.
 * @return {module:ol/renderer/canvas/VectorTileLayer} The layer renderer.
 */
CanvasVectorTileLayerRenderer['create'] = function(mapRenderer, layer) {
  return new CanvasVectorTileLayerRenderer(/** @type {module:ol/layer/VectorTile} */ (layer));
};


/**
 * @inheritDoc
 */
CanvasVectorTileLayerRenderer.prototype.disposeInternal = function() {
  unlisten(labelCache, EventType.CLEAR, this.handleFontsChanged_, this);
  CanvasTileLayerRenderer.prototype.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
CanvasVectorTileLayerRenderer.prototype.getTile = function(z, x, y, pixelRatio, projection) {
  const tile = CanvasTileLayerRenderer.prototype.getTile.call(this, z, x, y, pixelRatio, projection);
  if (tile.getState() === TileState.LOADED) {
    this.createReplayGroup_(tile, pixelRatio, projection);
    if (this.context) {
      this.renderTileImage_(tile, pixelRatio, projection);
    }
  }
  return tile;
};


/**
 * @inheritDoc
 */
CanvasVectorTileLayerRenderer.prototype.prepareFrame = function(frameState, layerState) {
  const layer = this.getLayer();
  const layerRevision = layer.getRevision();
  if (this.renderedLayerRevision_ != layerRevision) {
    this.renderedTiles.length = 0;
    const renderMode = layer.getRenderMode();
    if (!this.context && renderMode != VectorTileRenderType.VECTOR) {
      this.context = createCanvasContext2D();
    }
    if (this.context && renderMode == VectorTileRenderType.VECTOR) {
      this.context = null;
    }
  }
  this.renderedLayerRevision_ = layerRevision;
  return CanvasTileLayerRenderer.prototype.prepareFrame.apply(this, arguments);
};


/**
 * @param {module:ol/VectorImageTile} tile Tile.
 * @param {number} pixelRatio Pixel ratio.
 * @param {module:ol/proj/Projection} projection Projection.
 * @private
 */
CanvasVectorTileLayerRenderer.prototype.createReplayGroup_ = function(tile, pixelRatio, projection) {
  const layer = this.getLayer();
  const revision = layer.getRevision();
  const renderOrder = /** @type {module:ol/render~OrderFunction} */ (layer.getRenderOrder()) || null;

  const replayState = tile.getReplayState(layer);
  if (!replayState.dirty && replayState.renderedRevision == revision &&
      replayState.renderedRenderOrder == renderOrder) {
    return;
  }

  const source = /** @type {module:ol/source/VectorTile} */ (layer.getSource());
  const sourceTileGrid = source.getTileGrid();
  const tileGrid = source.getTileGridForProjection(projection);
  const resolution = tileGrid.getResolution(tile.tileCoord[0]);
  const tileExtent = tile.extent;

  const zIndexKeys = {};
  for (let t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
    const sourceTile = tile.getTile(tile.tileKeys[t]);
    if (sourceTile.getState() != TileState.LOADED) {
      continue;
    }

    const sourceTileCoord = sourceTile.tileCoord;
    const sourceTileExtent = sourceTileGrid.getTileCoordExtent(sourceTileCoord);
    const sharedExtent = getIntersection(tileExtent, sourceTileExtent);
    const bufferedExtent = equals(sourceTileExtent, sharedExtent) ? null :
      buffer(sharedExtent, layer.getRenderBuffer() * resolution, this.tmpExtent);
    const tileProjection = sourceTile.getProjection();
    let reproject = false;
    if (!equivalentProjection(projection, tileProjection)) {
      reproject = true;
      sourceTile.setProjection(projection);
    }
    replayState.dirty = false;
    const replayGroup = new CanvasReplayGroup(0, sharedExtent, resolution,
      pixelRatio, source.getOverlaps(), this.declutterTree_, layer.getRenderBuffer());
    const squaredTolerance = getSquaredRenderTolerance(resolution, pixelRatio);

    /**
     * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
     * @this {module:ol/renderer/canvas/VectorTileLayer}
     */
    const render = function(feature) {
      let styles;
      const styleFunction = feature.getStyleFunction() || layer.getStyleFunction();
      if (styleFunction) {
        styles = styleFunction(feature, resolution);
      }
      if (styles) {
        const dirty = this.renderFeature(feature, squaredTolerance, styles, replayGroup);
        this.dirty_ = this.dirty_ || dirty;
        replayState.dirty = replayState.dirty || dirty;
      }
    };

    const features = sourceTile.getFeatures();
    if (renderOrder && renderOrder !== replayState.renderedRenderOrder) {
      features.sort(renderOrder);
    }
    for (let i = 0, ii = features.length; i < ii; ++i) {
      const feature = features[i];
      if (reproject) {
        if (tileProjection.getUnits() == Units.TILE_PIXELS) {
          // projected tile extent
          tileProjection.setWorldExtent(sourceTileExtent);
          // tile extent in tile pixel space
          tileProjection.setExtent(sourceTile.getExtent());
        }
        feature.getGeometry().transform(tileProjection, projection);
      }
      if (!bufferedExtent || intersects(bufferedExtent, feature.getGeometry().getExtent())) {
        render.call(this, feature);
      }
    }
    replayGroup.finish();
    for (const r in replayGroup.getReplays()) {
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
CanvasVectorTileLayerRenderer.prototype.forEachFeatureAtCoordinate = function(coordinate, frameState, hitTolerance, callback, thisArg) {
  const resolution = frameState.viewState.resolution;
  const rotation = frameState.viewState.rotation;
  hitTolerance = hitTolerance == undefined ? 0 : hitTolerance;
  const layer = this.getLayer();
  /** @type {!Object.<string, boolean>} */
  const features = {};

  /** @type {Array.<module:ol/VectorImageTile>} */
  const renderedTiles = this.renderedTiles;

  let bufferedExtent, found;
  let i, ii, replayGroup;
  for (i = 0, ii = renderedTiles.length; i < ii; ++i) {
    const tile = renderedTiles[i];
    bufferedExtent = buffer(tile.extent, hitTolerance * resolution, bufferedExtent);
    if (!containsCoordinate(bufferedExtent, coordinate)) {
      continue;
    }
    for (let t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
      const sourceTile = tile.getTile(tile.tileKeys[t]);
      if (sourceTile.getState() != TileState.LOADED) {
        continue;
      }
      replayGroup = sourceTile.getReplayGroup(layer, tile.tileCoord.toString());
      found = found || replayGroup.forEachFeatureAtCoordinate(coordinate, resolution, rotation, hitTolerance, {},
        /**
         * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
         * @return {?} Callback result.
         */
        function(feature) {
          const key = getUid(feature).toString();
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
 * @param {module:ol/VectorTile} tile Tile.
 * @param {module:ol/PluggableMap~FrameState} frameState Frame state.
 * @return {module:ol/transform~Transform} transform Transform.
 * @private
 */
CanvasVectorTileLayerRenderer.prototype.getReplayTransform_ = function(tile, frameState) {
  const layer = this.getLayer();
  const source = /** @type {module:ol/source/VectorTile} */ (layer.getSource());
  const tileGrid = source.getTileGrid();
  const tileCoord = tile.tileCoord;
  const tileResolution = tileGrid.getResolution(tileCoord[0]);
  const viewState = frameState.viewState;
  const pixelRatio = frameState.pixelRatio;
  const renderResolution = viewState.resolution / pixelRatio;
  const tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent);
  const center = viewState.center;
  const origin = getTopLeft(tileExtent);
  const size = frameState.size;
  const offsetX = Math.round(pixelRatio * size[0] / 2);
  const offsetY = Math.round(pixelRatio * size[1] / 2);
  return composeTransform(this.tmpTransform_,
    offsetX, offsetY,
    tileResolution / renderResolution, tileResolution / renderResolution,
    viewState.rotation,
    (origin[0] - center[0]) / tileResolution,
    (center[1] - origin[1]) / tileResolution);
};


/**
 * @param {module:ol/events/Event} event Event.
 */
CanvasVectorTileLayerRenderer.prototype.handleFontsChanged_ = function(event) {
  const layer = this.getLayer();
  if (layer.getVisible() && this.renderedLayerRevision_ !== undefined) {
    layer.changed();
  }
};


/**
 * Handle changes in image style state.
 * @param {module:ol/events/Event} event Image style change event.
 * @private
 */
CanvasVectorTileLayerRenderer.prototype.handleStyleImageChange_ = function(event) {
  this.renderIfReadyAndVisible();
};


/**
 * @inheritDoc
 */
CanvasVectorTileLayerRenderer.prototype.postCompose = function(context, frameState, layerState) {
  const layer = this.getLayer();
  const renderMode = layer.getRenderMode();
  if (renderMode != VectorTileRenderType.IMAGE) {
    const declutterReplays = layer.getDeclutter() ? {} : null;
    const source = /** @type {module:ol/source/VectorTile} */ (layer.getSource());
    const replayTypes = VECTOR_REPLAYS[renderMode];
    const pixelRatio = frameState.pixelRatio;
    const rotation = frameState.viewState.rotation;
    const size = frameState.size;
    let offsetX, offsetY;
    if (rotation) {
      offsetX = Math.round(pixelRatio * size[0] / 2);
      offsetY = Math.round(pixelRatio * size[1] / 2);
      rotateAtOffset(context, -rotation, offsetX, offsetY);
    }
    if (declutterReplays) {
      this.declutterTree_.clear();
    }
    const tiles = this.renderedTiles;
    const tileGrid = source.getTileGridForProjection(frameState.viewState.projection);
    const clips = [];
    const zs = [];
    for (let i = tiles.length - 1; i >= 0; --i) {
      const tile = /** @type {module:ol/VectorImageTile} */ (tiles[i]);
      if (tile.getState() == TileState.ABORT) {
        continue;
      }
      const tileCoord = tile.tileCoord;
      const worldOffset = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent)[0] - tile.extent[0];
      let transform = undefined;
      for (let t = 0, tt = tile.tileKeys.length; t < tt; ++t) {
        const sourceTile = tile.getTile(tile.tileKeys[t]);
        if (sourceTile.getState() != TileState.LOADED) {
          continue;
        }
        const replayGroup = sourceTile.getReplayGroup(layer, tileCoord.toString());
        if (renderMode != VectorTileRenderType.VECTOR && !replayGroup.hasReplays(replayTypes)) {
          continue;
        }
        if (!transform) {
          transform = this.getTransform(frameState, worldOffset);
        }
        const currentZ = sourceTile.tileCoord[0];
        const currentClip = replayGroup.getClipCoords(transform);
        context.save();
        context.globalAlpha = layerState.opacity;
        // Create a clip mask for regions in this low resolution tile that are
        // already filled by a higher resolution tile
        for (let j = 0, jj = clips.length; j < jj; ++j) {
          const clip = clips[j];
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
      replayDeclutter(declutterReplays, context, rotation);
    }
    if (rotation) {
      rotateAtOffset(context, rotation,
        /** @type {number} */ (offsetX), /** @type {number} */ (offsetY));
    }
  }
  CanvasTileLayerRenderer.prototype.postCompose.apply(this, arguments);
};


/**
 * @param {module:ol/Feature|module:ol/render/Feature} feature Feature.
 * @param {number} squaredTolerance Squared tolerance.
 * @param {(module:ol/style/Style|Array.<module:ol/style/Style>)} styles The style or array of styles.
 * @param {module:ol/render/canvas/ReplayGroup} replayGroup Replay group.
 * @return {boolean} `true` if an image is loading.
 */
CanvasVectorTileLayerRenderer.prototype.renderFeature = function(feature, squaredTolerance, styles, replayGroup) {
  if (!styles) {
    return false;
  }
  let loading = false;
  if (Array.isArray(styles)) {
    for (let i = 0, ii = styles.length; i < ii; ++i) {
      loading = renderFeature(
        replayGroup, feature, styles[i], squaredTolerance,
        this.handleStyleImageChange_, this) || loading;
    }
  } else {
    loading = renderFeature(
      replayGroup, feature, styles, squaredTolerance,
      this.handleStyleImageChange_, this);
  }
  return loading;
};


/**
 * @param {module:ol/VectorImageTile} tile Tile.
 * @param {number} pixelRatio Pixel ratio.
 * @param {module:ol/proj/Projection} projection Projection.
 * @private
 */
CanvasVectorTileLayerRenderer.prototype.renderTileImage_ = function(
  tile, pixelRatio, projection) {
  const layer = this.getLayer();
  const replayState = tile.getReplayState(layer);
  const revision = layer.getRevision();
  const replays = IMAGE_REPLAYS[layer.getRenderMode()];
  if (replays && replayState.renderedTileRevision !== revision) {
    replayState.renderedTileRevision = revision;
    const tileCoord = tile.wrappedTileCoord;
    const z = tileCoord[0];
    const source = /** @type {module:ol/source/VectorTile} */ (layer.getSource());
    const tileGrid = source.getTileGridForProjection(projection);
    const resolution = tileGrid.getResolution(z);
    const context = tile.getContext(layer);
    const size = source.getTilePixelSize(z, pixelRatio, projection);
    context.canvas.width = size[0];
    context.canvas.height = size[1];
    const tileExtent = tileGrid.getTileCoordExtent(tileCoord, this.tmpExtent);
    for (let i = 0, ii = tile.tileKeys.length; i < ii; ++i) {
      const sourceTile = tile.getTile(tile.tileKeys[i]);
      if (sourceTile.getState() != TileState.LOADED) {
        continue;
      }
      const pixelScale = pixelRatio / resolution;
      const transform = resetTransform(this.tmpTransform_);
      scaleTransform(transform, pixelScale, -pixelScale);
      translateTransform(transform, -tileExtent[0], -tileExtent[3]);
      const replayGroup = sourceTile.getReplayGroup(layer, tile.tileCoord.toString());
      replayGroup.replay(context, transform, 0, {}, replays);
    }
  }
};

export default CanvasVectorTileLayerRenderer;
