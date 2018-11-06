/**
 * @module ol/renderer/canvas/VectorTileLayer
 */
import {getUid} from '../../util.js';
import LayerType from '../../LayerType.js';
import TileState from '../../TileState.js';
import ViewHint from '../../ViewHint.js';
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
import CanvasTileLayerRenderer from './TileLayer.js';
import {getSquaredTolerance as getSquaredRenderTolerance, renderFeature} from '../vector.js';
import {
  create as createTransform,
  compose as composeTransform,
  reset as resetTransform,
  scale as scaleTransform,
  translate as translateTransform
} from '../../transform.js';


/**
 * @type {!Object<string, Array<import("../../render/ReplayType.js").default>>}
 */
const IMAGE_REPLAYS = {
  'image': [ReplayType.POLYGON, ReplayType.CIRCLE,
    ReplayType.LINE_STRING, ReplayType.IMAGE, ReplayType.TEXT],
  'hybrid': [ReplayType.POLYGON, ReplayType.LINE_STRING]
};


/**
 * @type {!Object<string, Array<import("../../render/ReplayType.js").default>>}
 */
const VECTOR_REPLAYS = {
  'image': [ReplayType.DEFAULT],
  'hybrid': [ReplayType.IMAGE, ReplayType.TEXT, ReplayType.DEFAULT],
  'vector': ORDER
};


/**
 * @classdesc
 * Canvas renderer for vector tile layers.
 * @api
 */
class CanvasVectorTileLayerRenderer extends CanvasTileLayerRenderer {

  /**
   * @param {import("../../layer/VectorTile.js").default} layer VectorTile layer.
   */
  constructor(layer) {

    super(layer, true);

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
     * @type {import("../../transform.js").Transform}
     */
    this.tmpTransform_ = createTransform();

    const renderMode = layer.getRenderMode();

    // Use lower resolution for pure vector rendering. Closest resolution otherwise.
    this.zDirection = renderMode === VectorTileRenderType.VECTOR ? 1 : 0;

    if (renderMode !== VectorTileRenderType.VECTOR) {
      this.context = createCanvasContext2D();
    }


    listen(labelCache, EventType.CLEAR, this.handleFontsChanged_, this);

  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    unlisten(labelCache, EventType.CLEAR, this.handleFontsChanged_, this);
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tile = super.getTile(z, x, y, pixelRatio, projection);
    if (tile.getState() === TileState.LOADED) {
      this.createReplayGroup_(/** @type {import("../../VectorImageTile.js").default} */ (tile), pixelRatio, projection);
      if (this.context) {
        this.renderTileImage_(/** @type {import("../../VectorImageTile.js").default} */ (tile), pixelRatio, projection);
      }
    }
    return tile;
  }

  /**
   * @inheritDoc
   */
  getTileImage(tile) {
    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    return /** @type {import("../../VectorImageTile.js").default} */ (tile).getImage(tileLayer);
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState) {
    const layer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const layerRevision = layer.getRevision();
    if (this.renderedLayerRevision_ != layerRevision) {
      this.renderedTiles.length = 0;
    }
    this.renderedLayerRevision_ = layerRevision;
    return super.prepareFrame(frameState, layerState);
  }

  /**
   * @param {import("../../VectorImageTile.js").default} tile Tile.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../proj/Projection.js").default} projection Projection.
   * @private
   */
  createReplayGroup_(tile, pixelRatio, projection) {
    const layer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const revision = layer.getRevision();
    const renderOrder = /** @type {import("../../render.js").OrderFunction} */ (layer.getRenderOrder()) || null;

    const replayState = tile.getReplayState(layer);
    if (!replayState.dirty && replayState.renderedRevision == revision &&
        replayState.renderedRenderOrder == renderOrder) {
      return;
    }

    const source = /** @type {import("../../source/VectorTile.js").default} */ (layer.getSource());
    const sourceTileGrid = source.getTileGrid();
    const tileGrid = source.getTileGridForProjection(projection);
    const resolution = tileGrid.getResolution(tile.tileCoord[0]);
    const tileExtent = tile.extent;

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
       * @param {import("../../Feature.js").FeatureLike} feature Feature.
       * @this {CanvasVectorTileLayerRenderer}
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
      sourceTile.setReplayGroup(layer, tile.tileCoord.toString(), replayGroup);
    }
    replayState.renderedRevision = revision;
    replayState.renderedRenderOrder = renderOrder;
  }

  /**
   * @inheritDoc
   */
  forEachFeatureAtCoordinate(coordinate, frameState, hitTolerance, callback, thisArg) {
    const resolution = frameState.viewState.resolution;
    const rotation = frameState.viewState.rotation;
    hitTolerance = hitTolerance == undefined ? 0 : hitTolerance;
    const layer = this.getLayer();
    /** @type {!Object<string, boolean>} */
    const features = {};

    const renderedTiles = /** @type {Array<import("../../VectorImageTile.js").default>} */ (this.renderedTiles);

    let bufferedExtent, found;
    let i, ii;
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
        const replayGroup = /** @type {CanvasReplayGroup} */ (sourceTile.getReplayGroup(layer,
          tile.tileCoord.toString()));
        found = found || replayGroup.forEachFeatureAtCoordinate(coordinate, resolution, rotation, hitTolerance, {},
          /**
           * @param {import("../../Feature.js").FeatureLike} feature Feature.
           * @return {?} Callback result.
           */
          function(feature) {
            const key = getUid(feature);
            if (!(key in features)) {
              features[key] = true;
              return callback.call(thisArg, feature, layer);
            }
          }, null);
      }
    }
    return found;
  }

  /**
   * @param {import("../../VectorTile.js").default} tile Tile.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {import("../../transform.js").Transform} transform Transform.
   * @private
   */
  getReplayTransform_(tile, frameState) {
    const layer = this.getLayer();
    const source = /** @type {import("../../source/VectorTile.js").default} */ (layer.getSource());
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
  }

  /**
   * @param {import("../../events/Event.js").default} event Event.
   */
  handleFontsChanged_(event) {
    const layer = this.getLayer();
    if (layer.getVisible() && this.renderedLayerRevision_ !== undefined) {
      layer.changed();
    }
  }

  /**
   * Handle changes in image style state.
   * @param {import("../../events/Event.js").default} event Image style change event.
   * @private
   */
  handleStyleImageChange_(event) {
    this.renderIfReadyAndVisible();
  }

  /**
   * @inheritDoc
   */
  postCompose(context, frameState, layerState) {
    const layer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const renderMode = layer.getRenderMode();
    if (renderMode != VectorTileRenderType.IMAGE) {
      const declutterReplays = layer.getDeclutter() ? {} : null;
      const source = /** @type {import("../../source/VectorTile.js").default} */ (layer.getSource());
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
      const viewHints = frameState.viewHints;
      const snapToPixel = !(viewHints[ViewHint.ANIMATING] || viewHints[ViewHint.INTERACTING]);
      const tiles = this.renderedTiles;
      const tileGrid = source.getTileGridForProjection(frameState.viewState.projection);
      const clips = [];
      const zs = [];
      for (let i = tiles.length - 1; i >= 0; --i) {
        const tile = /** @type {import("../../VectorImageTile.js").default} */ (tiles[i]);
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
          const replayGroup = /** @type {CanvasReplayGroup} */ (sourceTile.getReplayGroup(layer, tileCoord.toString()));
          if (!replayGroup || !replayGroup.hasReplays(replayTypes)) {
            // sourceTile was not yet loaded when this.createReplayGroup_() was
            // called, or it has no replays of the types we want to render
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
          replayGroup.replay(context, transform, rotation, {}, snapToPixel, replayTypes, declutterReplays);
          context.restore();
          clips.push(currentClip);
          zs.push(currentZ);
        }
      }
      if (declutterReplays) {
        replayDeclutter(declutterReplays, context, rotation, snapToPixel);
      }
      if (rotation) {
        rotateAtOffset(context, rotation,
          /** @type {number} */ (offsetX), /** @type {number} */ (offsetY));
      }
    }
    super.postCompose(context, frameState, layerState);
  }

  /**
   * @param {import("../../Feature.js").FeatureLike} feature Feature.
   * @param {number} squaredTolerance Squared tolerance.
   * @param {import("../../style/Style.js").default|Array<import("../../style/Style.js").default>} styles The style or array of styles.
   * @param {import("../../render/canvas/ReplayGroup.js").default} replayGroup Replay group.
   * @return {boolean} `true` if an image is loading.
   */
  renderFeature(feature, squaredTolerance, styles, replayGroup) {
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
  }

  /**
   * @param {import("../../VectorImageTile.js").default} tile Tile.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../proj/Projection.js").default} projection Projection.
   * @private
   */
  renderTileImage_(tile, pixelRatio, projection) {
    const layer = /** @type {import("../../layer/Vector.js").default} */ (this.getLayer());
    const replayState = tile.getReplayState(layer);
    const revision = layer.getRevision();
    const replays = IMAGE_REPLAYS[layer.getRenderMode()];
    if (replays && replayState.renderedTileRevision !== revision) {
      replayState.renderedTileRevision = revision;
      const tileCoord = tile.wrappedTileCoord;
      const z = tileCoord[0];
      const source = /** @type {import("../../source/VectorTile.js").default} */ (layer.getSource());
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
        const replayGroup = /** @type {CanvasReplayGroup} */ (sourceTile.getReplayGroup(layer,
          tile.tileCoord.toString()));
        replayGroup.replay(context, transform, 0, {}, true, replays);
      }
    }
  }
}


/**
 * Determine if this renderer handles the provided layer.
 * @param {import("../../layer/Layer.js").default} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
CanvasVectorTileLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.VECTOR_TILE;
};


/**
 * Create a layer renderer.
 * @param {import("../Map.js").default} mapRenderer The map renderer.
 * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
 * @return {CanvasVectorTileLayerRenderer} The layer renderer.
 */
CanvasVectorTileLayerRenderer['create'] = function(mapRenderer, layer) {
  return new CanvasVectorTileLayerRenderer(/** @type {import("../../layer/VectorTile.js").default} */ (layer));
};


export default CanvasVectorTileLayerRenderer;
