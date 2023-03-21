/**
 * @module ol/renderer/webgl/TileLayerBase
 */
import LRUCache from '../../structs/LRUCache.js';
import ReprojDataTile from '../../reproj/DataTile.js';
import ReprojTile from '../../reproj/Tile.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import TileTexture from '../../webgl/TileTexture.js';
import WebGLLayerRenderer from './Layer.js';
import {abstract, getUid} from '../../util.js';
import {ascending} from '../../array.js';
import {create as createMat4} from '../../vec/mat4.js';
import {
  createOrUpdate as createTileCoord,
  getKey as getTileCoordKey,
} from '../../tilecoord.js';
import {
  create as createTransform,
  reset as resetTransform,
  rotate as rotateTransform,
  scale as scaleTransform,
  translate as translateTransform,
} from '../../transform.js';
import {fromUserExtent} from '../../proj.js';
import {getIntersection, isEmpty} from '../../extent.js';
import {toSize} from '../../size.js';

export const Uniforms = {
  TILE_TRANSFORM: 'u_tileTransform',
  TRANSITION_ALPHA: 'u_transitionAlpha',
  DEPTH: 'u_depth',
  RENDER_EXTENT: 'u_renderExtent', // intersection of layer, source, and view extent
  RESOLUTION: 'u_resolution',
  ZOOM: 'u_zoom',
  GLOBAL_ALPHA: 'u_globalAlpha',
  PROJECTION_MATRIX: 'u_projectionMatrix',
  SCREEN_TO_WORLD_MATRIX: 'u_screenToWorldMatrix',
};

/**
 * @type {Object<string, boolean>}
 */
const empty = {};

/**
 * Transform a zoom level into a depth value ranging from -1 to 1.
 * @param {number} z A zoom level.
 * @return {number} A depth value.
 */
function depthForZ(z) {
  return 2 * (1 - 1 / (z + 1)) - 1;
}

/**
 * @typedef {Object} TileTextureLookup
 * @property {Set<string>} tileIds The set of tile ids in the lookup.
 * @property {Object<number, Set<TileTexture>>} texturesByZ Tile textures by zoom level.
 */

/**
 * @return {TileTextureLookup} A new tile texture lookup.
 */
export function newTileTextureLookup() {
  return {tileIds: new Set(), texturesByZ: {}};
}

/**
 * Check if a tile is already in the tile texture lookup.
 * @param {TileTextureLookup} tileTextureLookup Lookup of tile textures by zoom level.
 * @param {import("../../Tile.js").default} tile A tile.
 * @return {boolean} The tile is already in the lookup.
 */
function lookupHasTile(tileTextureLookup, tile) {
  return tileTextureLookup.tileIds.has(getUid(tile));
}

/**
 * Add a tile texture to the lookup.
 * @param {TileTextureLookup} tileTextureLookup Lookup of tile textures by zoom level.
 * @param {TileTexture} tileTexture A tile texture.
 * @param {number} z The zoom level.
 */
function addTileTextureToLookup(tileTextureLookup, tileTexture, z) {
  const texturesByZ = tileTextureLookup.texturesByZ;
  if (!(z in texturesByZ)) {
    texturesByZ[z] = new Set();
  }
  texturesByZ[z].add(tileTexture);
  tileTextureLookup.tileIds.add(getUid(tileTexture.tile));
}

/**
 * @param {import("../../Map.js").FrameState} frameState Frame state.
 * @param {import("../../extent.js").Extent} extent The frame extent.
 * @return {import("../../extent.js").Extent} Frame extent intersected with layer extents.
 */
function getRenderExtent(frameState, extent) {
  const layerState = frameState.layerStatesArray[frameState.layerIndex];
  if (layerState.extent) {
    extent = getIntersection(
      extent,
      fromUserExtent(layerState.extent, frameState.viewState.projection)
    );
  }
  const source = /** @type {import("../../source/Tile.js").default} */ (
    layerState.layer.getRenderSource()
  );
  if (!source.getWrapX()) {
    const gridExtent = source
      .getTileGridForProjection(frameState.viewState.projection)
      .getExtent();
    if (gridExtent) {
      extent = getIntersection(extent, gridExtent);
    }
  }
  return extent;
}

export function getCacheKey(source, tileCoord) {
  return `${source.getKey()},${getTileCoordKey(tileCoord)}`;
}

/**
 * @typedef {Object} Options
 * @property {Object<string, import("../../webgl/Helper").UniformValue>} [uniforms] Additional uniforms
 * made available to shaders.
 * @property {number} [cacheSize=512] The tile texture cache size.
 */

/**
 * @typedef {import("../../layer/BaseTile.js").default} BaseLayerType
 */

/**
 * @classdesc
 * Base WebGL renderer for tile layers.
 * @template {BaseLayerType} LayerType
 * @template {import("../../webgl/TileTexture.js").default} TileTexture
 * @extends {WebGLLayerRenderer<LayerType>}
 */
class WebGLBaseTileLayerRenderer extends WebGLLayerRenderer {
  /**
   * @param {LayerType} tileLayer Tile layer.
   * @param {Options} options Options.
   */
  constructor(tileLayer, options) {
    super(tileLayer, {
      uniforms: options.uniforms,
    });

    /**
     * The last call to `renderFrame` was completed with all tiles loaded
     * @type {boolean}
     */
    this.renderComplete = false;

    /**
     * This transform converts texture coordinates to screen coordinates.
     * @type {import("../../transform.js").Transform}
     * @private
     */
    this.tileTransform_ = createTransform();

    /**
     * @type {Array<number>}
     * @protected
     */
    this.tempMat4_ = createMat4();

    /**
     * @type {import("../../TileRange.js").default}
     * @private
     */
    this.tempTileRange_ = new TileRange(0, 0, 0, 0);

    /**
     * @type {import("../../tilecoord.js").TileCoord}
     * @private
     */
    this.tempTileCoord_ = createTileCoord(0, 0, 0);

    /**
     * @type {import("../../size.js").Size}
     * @private
     */
    this.tempSize_ = [0, 0];

    const cacheSize = options.cacheSize !== undefined ? options.cacheSize : 512;
    /**
     * @type {import("../../structs/LRUCache.js").default<TileTexture>}
     * @protected
     */
    this.tileTextureCache_ = new LRUCache(cacheSize);

    /**
     * @protected
     * @type {import("../../Map.js").FrameState|null}
     */
    this.frameState_ = null;

    /**
     * @private
     * @type {import("../../proj/Projection.js").default}
     */
    this.projection_ = undefined;
  }

  /**
   * @param {Options} options Options.
   */
  reset(options) {
    super.reset({
      uniforms: options.uniforms,
    });
  }

  /**
   * @param {import("../../webgl/TileTexture").TileType} tile Tile.
   * @return {boolean} Tile is drawable.
   * @private
   */
  isDrawableTile_(tile) {
    const tileLayer = this.getLayer();
    const tileState = tile.getState();
    const useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
    return (
      tileState == TileState.LOADED ||
      tileState == TileState.EMPTY ||
      (tileState == TileState.ERROR && !useInterimTilesOnError)
    );
  }

  /**
   * Determine whether renderFrame should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrameInternal(frameState) {
    if (!this.projection_) {
      this.projection_ = frameState.viewState.projection;
    } else if (frameState.viewState.projection !== this.projection_) {
      this.clearCache();
      this.projection_ = frameState.viewState.projection;
    }

    const layer = this.getLayer();
    const source = layer.getRenderSource();
    if (!source) {
      return false;
    }

    if (isEmpty(getRenderExtent(frameState, frameState.extent))) {
      return false;
    }
    return source.getState() === 'ready';
  }

  /**
   * @abstract
   * @param {import("../../webgl/TileTexture.js").default} options tile texture options
   * @return {TileTexture} A new tile texture
   * @protected
   */
  createTileTexture_(options) {
    return abstract();
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent The extent to be rendered.
   * @param {number} initialZ The zoom level.
   * @param {TileTextureLookup} tileTextureLookup The zoom level.
   * @param {number} preload Number of additional levels to load.
   */
  enqueueTiles(frameState, extent, initialZ, tileTextureLookup, preload) {
    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const gutter = tileSource.getGutterForProjection(viewState.projection);

    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }

    const wantedTiles = frameState.wantedTiles[tileSourceKey];
    const tileTextureCache = this.tileTextureCache_;

    const map = tileLayer.getMapInternal();
    const minZ = Math.max(
      initialZ - preload,
      tileGrid.getMinZoom(),
      tileGrid.getZForResolution(
        Math.min(
          tileLayer.getMaxResolution(),
          map
            ? map
                .getView()
                .getResolutionForZoom(Math.max(tileLayer.getMinZoom(), 0))
            : tileGrid.getResolution(0)
        ),
        tileSource.zDirection
      )
    );
    for (let z = initialZ; z >= minZ; --z) {
      const tileRange = tileGrid.getTileRangeForExtentAndZ(
        extent,
        z,
        this.tempTileRange_
      );

      const tileResolution = tileGrid.getResolution(z);

      for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
        for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
          const tileCoord = createTileCoord(z, x, y, this.tempTileCoord_);
          const cacheKey = getCacheKey(tileSource, tileCoord);

          /** @type {TileTexture} */
          let tileTexture;

          /** @type {import("../../webgl/TileTexture").TileType} */
          let tile;

          if (tileTextureCache.containsKey(cacheKey)) {
            tileTexture = tileTextureCache.get(cacheKey);
            tile = tileTexture.tile;
          }
          if (!tileTexture || tileTexture.tile.key !== tileSource.getKey()) {
            tile = tileSource.getTile(
              z,
              x,
              y,
              frameState.pixelRatio,
              viewState.projection
            );
          }

          if (lookupHasTile(tileTextureLookup, tile)) {
            continue;
          }

          if (!tileTexture) {
            tileTexture = this.createTileTexture_({
              tile: tile,
              grid: tileGrid,
              helper: this.helper,
              gutter: gutter,
            });
            tileTextureCache.set(cacheKey, tileTexture);
          } else {
            if (this.isDrawableTile_(tile)) {
              tileTexture.setTile(tile);
            } else {
              const interimTile =
                /** @type {import("../../webgl/TileTexture").TileType} */ (
                  tile.getInterimTile()
                );
              tileTexture.setTile(interimTile);
            }
          }

          addTileTextureToLookup(tileTextureLookup, tileTexture, z);

          const tileQueueKey = tile.getKey();
          wantedTiles[tileQueueKey] = true;

          if (tile.getState() === TileState.IDLE) {
            if (!frameState.tileQueue.isKeyQueued(tileQueueKey)) {
              frameState.tileQueue.enqueue([
                tile,
                tileSourceKey,
                tileGrid.getTileCoordCenter(tileCoord),
                tileResolution,
              ]);
            }
          }
        }
      }
    }
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {boolean} tilesWithAlpha True if at least one of the rendered tiles has alpha
   * @protected
   */
  beforeTilesRender_(frameState, tilesWithAlpha) {
    this.helper.prepareDraw(this.frameState_, !tilesWithAlpha);
  }

  /**
   * @param {TileTexture} tileTexture Tile texture
   * @param {import("../../transform.js").Transform} tileTransform Tile transform
   * @param {import("../../Map.js").FrameState} frameState Frame state
   * @param {import("../../extent.js").Extent} renderExtent Render extent
   * @param {number} tileResolution Tile resolution
   * @param {import("../../size.js").Size} tileSize Tile size
   * @param {import("../../coordinate.js").Coordinate} tileOrigin Tile origin
   * @param {import("../../extent.js").Extent} tileExtent tile Extent
   * @param {number} depth Depth
   * @param {number} gutter Gutter
   * @param {number} alpha Alpha
   * @protected
   */
  renderTile_(
    tileTexture,
    tileTransform,
    frameState,
    renderExtent,
    tileResolution,
    tileSize,
    tileOrigin,
    tileExtent,
    depth,
    gutter,
    alpha
  ) {}

  /**
   * Render the layer.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState) {
    this.frameState_ = frameState;
    this.renderComplete = true;
    const gl = this.helper.getGL();
    this.preRender(gl, frameState);

    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);
    const gutter = tileSource.getGutterForProjection(viewState.projection);
    const extent = getRenderExtent(frameState, frameState.extent);
    const z = tileGrid.getZForResolution(
      viewState.resolution,
      tileSource.zDirection
    );

    /**
     * @type {TileTextureLookup}
     */
    const tileTextureLookup = newTileTextureLookup();

    const preload = tileLayer.getPreload();
    if (frameState.nextExtent) {
      const targetZ = tileGrid.getZForResolution(
        viewState.nextResolution,
        tileSource.zDirection
      );
      const nextExtent = getRenderExtent(frameState, frameState.nextExtent);
      this.enqueueTiles(
        frameState,
        nextExtent,
        targetZ,
        tileTextureLookup,
        preload
      );
    }

    this.enqueueTiles(frameState, extent, z, tileTextureLookup, 0);
    if (preload > 0) {
      setTimeout(() => {
        this.enqueueTiles(
          frameState,
          extent,
          z - 1,
          tileTextureLookup,
          preload - 1
        );
      }, 0);
    }

    /**
     * A lookup of alpha values for tiles at the target rendering resolution
     * for tiles that are in transition.  If a tile coord key is absent from
     * this lookup, the tile should be rendered at alpha 1.
     * @type {Object<string, number>}
     */
    const alphaLookup = {};

    const uid = getUid(this);
    const time = frameState.time;
    let blend = false;

    // look for cached tiles to use if a target tile is not ready
    for (const tileTexture of tileTextureLookup.texturesByZ[z]) {
      const tile = tileTexture.tile;
      if (
        (tile instanceof ReprojTile || tile instanceof ReprojDataTile) &&
        tile.getState() === TileState.EMPTY
      ) {
        continue;
      }
      const tileCoord = tile.tileCoord;

      if (tileTexture.loaded) {
        const alpha = tile.getAlpha(uid, time);
        if (alpha === 1) {
          // no need to look for alt tiles
          tile.endTransition(uid);
          continue;
        }
        blend = true;
        const tileCoordKey = getTileCoordKey(tileCoord);
        alphaLookup[tileCoordKey] = alpha;
      }
      this.renderComplete = false;

      // first look for child tiles (at z + 1)
      const coveredByChildren = this.findAltTiles_(
        tileGrid,
        tileCoord,
        z + 1,
        tileTextureLookup
      );

      if (coveredByChildren) {
        continue;
      }

      // next look for parent tiles
      const minZoom = tileGrid.getMinZoom();
      for (let parentZ = z - 1; parentZ >= minZoom; --parentZ) {
        const coveredByParent = this.findAltTiles_(
          tileGrid,
          tileCoord,
          parentZ,
          tileTextureLookup
        );

        if (coveredByParent) {
          break;
        }
      }
    }

    this.beforeTilesRender_(frameState, blend);

    const texturesByZ = tileTextureLookup.texturesByZ;
    const zs = Object.keys(texturesByZ).map(Number).sort(ascending);

    for (let j = 0, jj = zs.length; j < jj; ++j) {
      const tileZ = zs[j];
      for (const tileTexture of texturesByZ[tileZ]) {
        if (!tileTexture.loaded) {
          continue;
        }
        const tile = tileTexture.tile;
        const tileCoord = tile.tileCoord;
        const tileCoordKey = getTileCoordKey(tileCoord);
        const alpha =
          tileCoordKey in alphaLookup ? alphaLookup[tileCoordKey] : 1;

        if (alpha < 1) {
          frameState.animate = true;
        }

        const tileResolution = tileGrid.getResolution(tileZ);
        const tileSize = toSize(tileGrid.getTileSize(tileZ), this.tempSize_);
        const tileOrigin = tileGrid.getOrigin(tileZ);
        const tileExtent = tileGrid.getTileCoordExtent(tileCoord);
        const depth = depthForZ(tileZ);

        const viewState = frameState.viewState;
        const centerX = viewState.center[0];
        const centerY = viewState.center[1];

        const tileWidthWithGutter = tileSize[0] + 2 * gutter;
        const tileHeightWithGutter = tileSize[1] + 2 * gutter;

        const aspectRatio = tileWidthWithGutter / tileHeightWithGutter;

        const centerI =
          (centerX - tileOrigin[0]) / (tileSize[0] * tileResolution);
        const centerJ =
          (tileOrigin[1] - centerY) / (tileSize[1] * tileResolution);

        const tileScale = viewState.resolution / tileResolution;

        const tileCenterI = tileCoord[1];
        const tileCenterJ = tileCoord[2];

        resetTransform(this.tileTransform_);
        scaleTransform(
          this.tileTransform_,
          2 / ((frameState.size[0] * tileScale) / tileWidthWithGutter),
          -2 / ((frameState.size[1] * tileScale) / tileWidthWithGutter)
        );
        rotateTransform(this.tileTransform_, viewState.rotation);
        scaleTransform(this.tileTransform_, 1, 1 / aspectRatio);
        translateTransform(
          this.tileTransform_,
          (tileSize[0] * (tileCenterI - centerI) - gutter) /
            tileWidthWithGutter,
          (tileSize[1] * (tileCenterJ - centerJ) - gutter) /
            tileHeightWithGutter
        );

        this.renderTile_(
          tileTexture,
          this.tileTransform_,
          frameState,
          extent,
          tileResolution,
          tileSize,
          tileOrigin,
          tileExtent,
          depth,
          gutter,
          alpha
        );
      }
    }

    this.helper.finalizeDraw(
      frameState,
      this.dispatchPreComposeEvent,
      this.dispatchPostComposeEvent
    );

    const canvas = this.helper.getCanvas();

    const tileTextureCache = this.tileTextureCache_;
    while (tileTextureCache.canExpireCache()) {
      const tileTexture = tileTextureCache.pop();
      tileTexture.dispose();
    }

    // TODO: let the renderers manage their own cache instead of managing the source cache
    /**
     * Here we unconditionally expire the source cache since the renderer maintains
     * its own cache.
     * @param {import("../../Map.js").default} map Map.
     * @param {import("../../Map.js").FrameState} frameState Frame state.
     */
    const postRenderFunction = function (map, frameState) {
      tileSource.updateCacheSize(0.1, frameState.viewState.projection);
      tileSource.expireCache(frameState.viewState.projection, empty);
    };

    frameState.postRenderFunctions.push(postRenderFunction);

    this.postRender(gl, frameState);
    return canvas;
  }

  /**
   * Look for tiles covering the provided tile coordinate at an alternate
   * zoom level.  Loaded tiles will be added to the provided tile texture lookup.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid The tile grid.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
   * @param {number} altZ The alternate zoom level.
   * @param {TileTextureLookup} tileTextureLookup Lookup of
   * tile textures by zoom level.
   * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
   * @private
   */
  findAltTiles_(tileGrid, tileCoord, altZ, tileTextureLookup) {
    const tileRange = tileGrid.getTileRangeForTileCoordAndZ(
      tileCoord,
      altZ,
      this.tempTileRange_
    );

    if (!tileRange) {
      return false;
    }

    let covered = true;
    const tileTextureCache = this.tileTextureCache_;
    const source = this.getLayer().getRenderSource();
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getCacheKey(source, [altZ, x, y]);
        let loaded = false;
        if (tileTextureCache.containsKey(cacheKey)) {
          const tileTexture = tileTextureCache.get(cacheKey);
          if (
            tileTexture.loaded &&
            !lookupHasTile(tileTextureLookup, tileTexture.tile)
          ) {
            addTileTextureToLookup(tileTextureLookup, tileTexture, altZ);
            loaded = true;
          }
        }
        if (!loaded) {
          covered = false;
        }
      }
    }
    return covered;
  }

  clearCache() {
    const tileTextureCache = this.tileTextureCache_;
    tileTextureCache.forEach((tileTexture) => tileTexture.dispose());
    tileTextureCache.clear();
  }

  removeHelper() {
    if (this.helper) {
      this.clearCache();
    }

    super.removeHelper();
  }

  /**
   * Clean up.
   */
  disposeInternal() {
    super.disposeInternal();
    delete this.frameState_;
  }
}

export default WebGLBaseTileLayerRenderer;
