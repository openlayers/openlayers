/**
 * @module ol/renderer/canvas/TileLayer
 */
import CanvasLayerRenderer from './Layer.js';
import DataTile, {asImageLike} from '../../DataTile.js';
import ImageTile from '../../ImageTile.js';
import LRUCache from '../../structs/LRUCache.js';
import ReprojDataTile from '../../reproj/DataTile.js';
import ReprojTile from '../../reproj/Tile.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import {
  apply as applyTransform,
  compose as composeTransform,
  makeInverse,
  toString as toTransformString,
} from '../../transform.js';
import {ascending} from '../../array.js';
import {
  containsCoordinate,
  createEmpty,
  equals,
  getHeight,
  getIntersection,
  getTopLeft,
  getWidth,
  intersects,
} from '../../extent.js';
import {
  createOrUpdate as createTileCoord,
  getKeyZXY,
  getKey as getTileCoordKey,
} from '../../tilecoord.js';
import {fromUserExtent} from '../../proj.js';
import {getUid} from '../../util.js';
import {toSize} from '../../size.js';

/**
 * @param {import("../../source/Tile").default} source The source.
 * @param {number} z The tile z coordinate.
 * @param {number} x The tile x coordinate.
 * @param {number} y The tile y coordinate.
 * @return {string} The tile cache key.
 */
function getCacheKey(source, z, x, y) {
  return `${source.getKey()},${getKeyZXY(z, x, y)}`;
}

/**
 * Add a tile to the lookup.
 * @param {Object<number, Array<import("../../Tile.js").default>>} tilesByZ Lookup of
 * tiles by zoom level.
 * @param {import("../../Tile.js").default} tile A tile.
 * @param {number} z The zoom level.
 */
function addTileToLookup(tilesByZ, tile, z) {
  if (!(z in tilesByZ)) {
    tilesByZ[z] = [];
  }
  tilesByZ[z].push(tile);
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

/**
 * @type {Object<string, boolean>}
 */
const empty = {};

/**
 * @typedef {Object} Options
 * @property {number} [cacheSize=512] The texture cache size.
 */

/**
 * @classdesc
 * Canvas renderer for tile layers.
 * @api
 * @template {import("../../layer/Tile.js").default<import("../../source/Tile.js").default>|import("../../layer/VectorTile.js").default} [LayerType=import("../../layer/Tile.js").default<import("../../source/Tile.js").default>|import("../../layer/VectorTile.js").default]
 * @extends {CanvasLayerRenderer<LayerType>}
 */
class CanvasTileLayerRenderer extends CanvasLayerRenderer {
  /**
   * @param {LayerType} tileLayer Tile layer.
   * @param {Options} [options] Options.
   */
  constructor(tileLayer, options) {
    super(tileLayer);

    options = options || {};

    /**
     * Rendered extent has changed since the previous `renderFrame()` call
     * @type {boolean}
     */
    this.extentChanged = true;

    /**
     * The last call to `renderFrame` was completed with all tiles loaded
     * @type {boolean}
     */
    this.renderComplete = false;

    /**
     * @private
     * @type {?import("../../extent.js").Extent}
     */
    this.renderedExtent_ = null;

    /**
     * @protected
     * @type {number}
     */
    this.renderedPixelRatio;

    /**
     * @protected
     * @type {import("../../proj/Projection.js").default}
     */
    this.renderedProjection = null;

    /**
     * @protected
     * @type {number}
     */
    this.renderedRevision;

    /**
     * @protected
     * @type {!Array<import("../../Tile.js").default>}
     */
    this.renderedTiles = [];

    /**
     * @private
     * @type {boolean}
     */
    this.newTiles_ = false;

    /**
     * @protected
     * @type {import("../../extent.js").Extent}
     */
    this.tempExtent = createEmpty();

    /**
     * @private
     * @type {import("../../TileRange.js").default}
     */
    this.tempTileRange_ = new TileRange(0, 0, 0, 0);

    /**
     * @type {import("../../tilecoord.js").TileCoord}
     * @private
     */
    this.tempTileCoord_ = createTileCoord(0, 0, 0);

    const cacheSize = options.cacheSize !== undefined ? options.cacheSize : 512;

    /**
     * @type {import("../../structs/LRUCache.js").default<import("../../Tile.js").default>}
     * @private
     */
    this.tileCache_ = new LRUCache(cacheSize);
  }

  /**
   * @protected
   * @param {import("../../Tile.js").default} tile Tile.
   * @return {boolean} Tile is drawable.
   */
  isDrawableTile(tile) {
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
   * Get a tile from the cache or create one if needed.
   *
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {!import("../../Tile.js").default} Tile.
   * @protected
   */
  getOrCreateTile(z, x, y, frameState) {
    const tileCache = this.tileCache_;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    const cacheKey = getCacheKey(tileSource, z, x, y);

    /** @type {import("../../Tile.js").default} */
    let tile;

    if (tileCache.containsKey(cacheKey)) {
      tile = tileCache.get(cacheKey);
    }
    if (!tile || tile.key !== tileSource.getKey()) {
      tile = tileSource.getTile(
        z,
        x,
        y,
        frameState.pixelRatio,
        frameState.viewState.projection
      );
      tileCache.set(cacheKey, tile);
    }
    return tile;
  }

  /**
   * @param {import("../../Tile.js").default} tile A tile.
   * @return {import("../../Tile.js").default} A drawable tile.
   */
  getDrawableTile(tile) {
    const tileLayer = this.getLayer();
    if (tile.getState() == TileState.ERROR) {
      if (tileLayer.getUseInterimTilesOnError() && tileLayer.getPreload() > 0) {
        // Preloaded tiles for lower resolutions might have finished loading.
        // TODO: determine if this is needed
        this.newTiles_ = true;
      }
    }

    if (!this.isDrawableTile(tile)) {
      tile = tile.getInterimTile();
    }
    return tile;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {!import("../../Tile.js").default} Tile.
   * @protected
   */
  getTile(z, x, y, frameState) {
    const tile = this.getOrCreateTile(z, x, y, frameState);
    return this.getDrawableTile(tile);
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray} Data at the pixel location.
   */
  getData(pixel) {
    const frameState = this.frameState;
    if (!frameState) {
      return null;
    }

    const layer = this.getLayer();
    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform,
      pixel.slice()
    );

    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (!containsCoordinate(layerExtent, coordinate)) {
        return null;
      }
    }

    const pixelRatio = frameState.pixelRatio;
    const projection = frameState.viewState.projection;
    const viewState = frameState.viewState;
    const source = layer.getRenderSource();
    const tileGrid = source.getTileGridForProjection(viewState.projection);
    const tilePixelRatio = source.getTilePixelRatio(frameState.pixelRatio);

    for (
      let z = tileGrid.getZForResolution(viewState.resolution);
      z >= tileGrid.getMinZoom();
      --z
    ) {
      const tileCoord = tileGrid.getTileCoordForCoordAndZ(coordinate, z);
      const tile = source.getTile(
        z,
        tileCoord[1],
        tileCoord[2],
        pixelRatio,
        projection
      );
      if (
        !(tile instanceof ImageTile || tile instanceof ReprojTile) ||
        (tile instanceof ReprojTile && tile.getState() === TileState.EMPTY)
      ) {
        return null;
      }

      if (tile.getState() !== TileState.LOADED) {
        continue;
      }

      const tileOrigin = tileGrid.getOrigin(z);
      const tileSize = toSize(tileGrid.getTileSize(z));
      const tileResolution = tileGrid.getResolution(z);

      const col = Math.floor(
        tilePixelRatio *
          ((coordinate[0] - tileOrigin[0]) / tileResolution -
            tileCoord[1] * tileSize[0])
      );

      const row = Math.floor(
        tilePixelRatio *
          ((tileOrigin[1] - coordinate[1]) / tileResolution -
            tileCoord[2] * tileSize[1])
      );

      const gutter = Math.round(
        tilePixelRatio * source.getGutterForProjection(viewState.projection)
      );

      return this.getImageData(tile.getImage(), col + gutter, row + gutter);
    }

    return null;
  }

  /**
   * Determine whether render should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   */
  prepareFrame(frameState) {
    return !!this.getLayer().getSource();
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent The extent to be rendered.
   * @param {number} initialZ The zoom level.
   * @param {Object<number, Array<import("../../Tile.js").default>>} tilesByZ Tile lookup by zoom level.
   * @param {number} preload Number of additional levels to load.
   */
  enqueueTiles(frameState, extent, initialZ, tilesByZ, preload) {
    const viewState = frameState.viewState;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getRenderSource();
    const tileGrid = tileSource.getTileGridForProjection(viewState.projection);

    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }

    const wantedTiles = frameState.wantedTiles[tileSourceKey];

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
          const tile = this.getTile(z, x, y, frameState);
          addTileToLookup(tilesByZ, tile, z);

          const tileQueueKey = tile.getKey();
          wantedTiles[tileQueueKey] = true;

          if (tile.getState() === TileState.IDLE) {
            if (!frameState.tileQueue.isKeyQueued(tileQueueKey)) {
              const tileCoord = createTileCoord(z, x, y, this.tempTileCoord_);
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
   * Look for tiles covering the provided tile coordinate at an alternate
   * zoom level.  Loaded tiles will be added to the provided tile texture lookup.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid The tile grid.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
   * @param {number} altZ The alternate zoom level.
   * @param {Object<number, Array<import("../../Tile.js").default>>} tilesByZ Lookup of
   * tiles by zoom level.
   * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
   * @private
   */
  findAltTiles_(tileGrid, tileCoord, altZ, tilesByZ) {
    const tileRange = tileGrid.getTileRangeForTileCoordAndZ(
      tileCoord,
      altZ,
      this.tempTileRange_
    );

    if (!tileRange) {
      return false;
    }

    let covered = true;
    const tileCache = this.tileCache_;
    const source = this.getLayer().getRenderSource();
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getCacheKey(source, altZ, x, y);
        let loaded = false;
        if (tileCache.containsKey(cacheKey)) {
          const tile = tileCache.get(cacheKey);
          if (tile.getState() === TileState.LOADED) {
            addTileToLookup(tilesByZ, tile, altZ);
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

  /**
   * Render the layer.
   *
   * The frame rendering logic has three parts:
   *
   *  1. Enqueue tiles
   *  2. Find alt tiles for those that are not yet loaded
   *  3. Render loaded tiles
   *
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {HTMLElement} target Target that may be used to render content to.
   * @return {HTMLElement} The rendered element.
   */
  renderFrame(frameState, target) {
    this.renderComplete = true;

    /**
     * TODO:
     *  * decide if we still need this.newTiles_
     *  * maybe skip transition when not fully opaque
     *  * decide if this.renderComplete is useful
     *  * review use of getRenderExtent
     *  * remove alphaLookup if not useful
     */

    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const viewResolution = viewState.resolution;
    const viewCenter = viewState.center;
    const rotation = viewState.rotation;
    const pixelRatio = frameState.pixelRatio;

    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    const sourceRevision = tileSource.getRevision();
    const tileGrid = tileSource.getTileGridForProjection(projection);
    const z = tileGrid.getZForResolution(viewResolution, tileSource.zDirection);
    const tileResolution = tileGrid.getResolution(z);

    let extent = frameState.extent;
    const resolution = frameState.viewState.resolution;
    const tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);
    // desired dimensions of the canvas in pixels
    const width = Math.round((getWidth(extent) / resolution) * pixelRatio);
    const height = Math.round((getHeight(extent) / resolution) * pixelRatio);

    const layerExtent =
      layerState.extent && fromUserExtent(layerState.extent, projection);
    if (layerExtent) {
      extent = getIntersection(
        extent,
        fromUserExtent(layerState.extent, projection)
      );
    }

    const dx = (tileResolution * width) / 2 / tilePixelRatio;
    const dy = (tileResolution * height) / 2 / tilePixelRatio;
    const canvasExtent = [
      viewCenter[0] - dx,
      viewCenter[1] - dy,
      viewCenter[0] + dx,
      viewCenter[1] + dy,
    ];

    /**
     * @type {Object<number, Array<import("../../Tile.js").default>>}
     */
    const tilesByZ = {};

    /**
     * Part 1: Enqueue tiles
     */

    const preload = tileLayer.getPreload();
    if (frameState.nextExtent) {
      const targetZ = tileGrid.getZForResolution(
        viewState.nextResolution,
        tileSource.zDirection
      );
      const nextExtent = getRenderExtent(frameState, frameState.nextExtent);
      this.enqueueTiles(frameState, nextExtent, targetZ, tilesByZ, preload);
    }

    this.enqueueTiles(frameState, extent, z, tilesByZ, 0);
    if (preload > 0) {
      setTimeout(() => {
        this.enqueueTiles(frameState, extent, z - 1, tilesByZ, preload - 1);
      }, 0);
    }

    /**
     * Part 2: Find alt tiles for those that are not yet loaded
     */

    /**
     * A lookup of alpha values for tiles at the target rendering resolution
     * for tiles that are in transition.  If a tile coord key is absent from
     * this lookup, the tile should be rendered at alpha 1.
     * @type {Object<string, number>}
     */
    const alphaLookup = {};

    const uid = getUid(this);
    const time = frameState.time;

    // look for cached tiles to use if a target tile is not ready
    const tiles = tilesByZ[z];
    for (let i = 0, ii = tiles.length; i < ii; ++i) {
      const tile = tiles[i];
      const tileState = tile.getState();
      if (
        (tile instanceof ReprojTile || tile instanceof ReprojDataTile) &&
        tileState === TileState.EMPTY
      ) {
        continue;
      }
      const tileCoord = tile.tileCoord;

      if (tileState === TileState.LOADED) {
        const alpha = tile.getAlpha(uid, time);
        if (alpha === 1) {
          // no need to look for alt tiles
          tile.endTransition(uid);
          continue;
        }
        const tileCoordKey = getTileCoordKey(tileCoord);
        alphaLookup[tileCoordKey] = alpha;
      }
      this.renderComplete = false;

      // first look for child tiles (at z + 1)
      const coveredByChildren = this.findAltTiles_(
        tileGrid,
        tileCoord,
        z + 1,
        tilesByZ
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
          tilesByZ
        );

        if (coveredByParent) {
          break;
        }
      }
    }

    /**
     * Part 3: Render loaded tiles
     */

    const canvasScale =
      ((tileResolution / viewResolution) * pixelRatio) / tilePixelRatio;

    // set forward and inverse pixel transforms
    composeTransform(
      this.pixelTransform,
      frameState.size[0] / 2,
      frameState.size[1] / 2,
      1 / pixelRatio,
      1 / pixelRatio,
      rotation,
      -width / 2,
      -height / 2
    );

    const canvasTransform = toTransformString(this.pixelTransform);

    this.useContainer(target, canvasTransform, this.getBackground(frameState));
    const context = this.context;
    const canvas = context.canvas;

    makeInverse(this.inversePixelTransform, this.pixelTransform);

    // set scale transform for calculating tile positions on the canvas
    composeTransform(
      this.tempTransform,
      width / 2,
      height / 2,
      canvasScale,
      canvasScale,
      0,
      -width / 2,
      -height / 2
    );

    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    } else if (!this.containerReused) {
      context.clearRect(0, 0, width, height);
    }

    if (layerExtent) {
      this.clipUnrotated(context, frameState, layerExtent);
    }

    if (!tileSource.getInterpolate()) {
      context.imageSmoothingEnabled = false;
    }

    this.preRender(context, frameState);

    this.renderedTiles.length = 0;
    /** @type {Array<number>} */
    let zs = Object.keys(tilesByZ).map(Number);
    zs.sort(ascending);

    let clips, clipZs, currentClip;
    if (
      layerState.opacity === 1 &&
      (!this.containerReused ||
        tileSource.getOpaque(frameState.viewState.projection))
    ) {
      zs = zs.reverse();
    } else {
      clips = [];
      clipZs = [];
    }
    for (let i = zs.length - 1; i >= 0; --i) {
      const currentZ = zs[i];
      const currentTilePixelSize = tileSource.getTilePixelSize(
        currentZ,
        pixelRatio,
        projection
      );
      const currentResolution = tileGrid.getResolution(currentZ);
      const currentScale = currentResolution / tileResolution;
      const dx = currentTilePixelSize[0] * currentScale * canvasScale;
      const dy = currentTilePixelSize[1] * currentScale * canvasScale;
      const originTileCoord = tileGrid.getTileCoordForCoordAndZ(
        getTopLeft(canvasExtent),
        currentZ
      );
      const originTileExtent = tileGrid.getTileCoordExtent(originTileCoord);
      const origin = applyTransform(this.tempTransform, [
        (tilePixelRatio * (originTileExtent[0] - canvasExtent[0])) /
          tileResolution,
        (tilePixelRatio * (canvasExtent[3] - originTileExtent[3])) /
          tileResolution,
      ]);
      const tileGutter =
        tilePixelRatio * tileSource.getGutterForProjection(projection);
      for (const tile of tilesByZ[currentZ]) {
        if (tile.getState() !== TileState.LOADED) {
          continue;
        }
        const tileCoord = tile.tileCoord;

        // Calculate integer positions and sizes so that tiles align
        const xIndex = originTileCoord[1] - tileCoord[1];
        const nextX = Math.round(origin[0] - (xIndex - 1) * dx);
        const yIndex = originTileCoord[2] - tileCoord[2];
        const nextY = Math.round(origin[1] - (yIndex - 1) * dy);
        const x = Math.round(origin[0] - xIndex * dx);
        const y = Math.round(origin[1] - yIndex * dy);
        const w = nextX - x;
        const h = nextY - y;
        const transition = z === currentZ;

        const inTransition =
          transition && tile.getAlpha(getUid(this), frameState.time) !== 1;
        let contextSaved = false;
        if (!inTransition) {
          if (clips) {
            // Clip mask for regions in this tile that already filled by a higher z tile
            currentClip = [x, y, x + w, y, x + w, y + h, x, y + h];
            for (let i = 0, ii = clips.length; i < ii; ++i) {
              if (z !== currentZ && currentZ < clipZs[i]) {
                const clip = clips[i];
                if (
                  intersects(
                    [x, y, x + w, y + h],
                    [clip[0], clip[3], clip[4], clip[7]]
                  )
                ) {
                  if (!contextSaved) {
                    context.save();
                    contextSaved = true;
                  }
                  context.beginPath();
                  // counter-clockwise (outer ring) for current tile
                  context.moveTo(currentClip[0], currentClip[1]);
                  context.lineTo(currentClip[2], currentClip[3]);
                  context.lineTo(currentClip[4], currentClip[5]);
                  context.lineTo(currentClip[6], currentClip[7]);
                  // clockwise (inner ring) for higher z tile
                  context.moveTo(clip[6], clip[7]);
                  context.lineTo(clip[4], clip[5]);
                  context.lineTo(clip[2], clip[3]);
                  context.lineTo(clip[0], clip[1]);
                  context.clip();
                }
              }
            }
            clips.push(currentClip);
            clipZs.push(currentZ);
          } else {
            context.clearRect(x, y, w, h);
          }
        }
        this.drawTile(tile, frameState, x, y, w, h, tileGutter, transition);
        if (clips && !inTransition) {
          if (contextSaved) {
            context.restore();
          }
          this.renderedTiles.unshift(tile);
        } else {
          this.renderedTiles.push(tile);
        }
        // TODO: decide if this is necessary
        this.updateUsedTiles(frameState.usedTiles, tileSource, tile);
      }
    }

    this.renderedRevision = sourceRevision;
    this.renderedResolution = tileResolution;
    this.extentChanged =
      !this.renderedExtent_ || !equals(this.renderedExtent_, canvasExtent);
    this.renderedExtent_ = canvasExtent;
    this.renderedPixelRatio = pixelRatio;
    this.renderedProjection = projection;

    this.postRender(context, frameState);

    if (layerState.extent) {
      context.restore();
    }
    context.imageSmoothingEnabled = true;

    if (canvasTransform !== canvas.style.transform) {
      canvas.style.transform = canvasTransform;
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

    return this.container;
  }

  /**
   * @param {import("../../Tile.js").default} tile Tile.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {number} x Left of the tile.
   * @param {number} y Top of the tile.
   * @param {number} w Width of the tile.
   * @param {number} h Height of the tile.
   * @param {number} gutter Tile gutter.
   * @param {boolean} transition Apply an alpha transition.
   * @protected
   */
  drawTile(tile, frameState, x, y, w, h, gutter, transition) {
    let image;
    if (tile instanceof DataTile) {
      image = asImageLike(tile.getData());
      if (!image) {
        throw new Error('Rendering array data is not yet supported');
      }
    } else {
      // TODO: rework for vector tiles
      image = this.getTileImage(
        /** @type {import("../../ImageTile.js").default} */ (tile)
      );
    }
    if (!image) {
      return;
    }
    const uid = getUid(this);
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const alpha =
      layerState.opacity *
      (transition ? tile.getAlpha(uid, frameState.time) : 1);
    const alphaChanged = alpha !== this.context.globalAlpha;
    if (alphaChanged) {
      this.context.save();
      this.context.globalAlpha = alpha;
    }
    this.context.drawImage(
      image,
      gutter,
      gutter,
      image.width - 2 * gutter,
      image.height - 2 * gutter,
      x,
      y,
      w,
      h
    );

    if (alphaChanged) {
      this.context.restore();
    }
    if (alpha !== layerState.opacity) {
      frameState.animate = true;
    } else if (transition) {
      tile.endTransition(uid);
    }
  }

  /**
   * @return {HTMLCanvasElement} Image
   */
  getImage() {
    const context = this.context;
    return context ? context.canvas : null;
  }

  /**
   * Get the image from a tile.
   * @param {import("../../ImageTile.js").default} tile Tile.
   * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
   * @protected
   */
  getTileImage(tile) {
    return tile.getImage();
  }

  /**
   * @param {!Object<string, !Object<string, boolean>>} usedTiles Used tiles.
   * @param {import("../../source/Tile.js").default} tileSource Tile source.
   * @param {import('../../Tile.js').default} tile Tile.
   * @protected
   */
  updateUsedTiles(usedTiles, tileSource, tile) {
    // FIXME should we use tilesToDrawByZ instead?
    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in usedTiles)) {
      usedTiles[tileSourceKey] = {};
    }
    usedTiles[tileSourceKey][tile.getKey()] = true;
  }
}

export default CanvasTileLayerRenderer;
