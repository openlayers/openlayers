/**
 * @module ol/renderer/canvas/TileLayer
 */
import DataTile, {asImageLike} from '../../DataTile.js';
import ImageTile from '../../ImageTile.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import {ascending} from '../../array.js';
import {
  containsCoordinate,
  createEmpty,
  equals,
  getIntersection,
  getRotatedViewport,
  getTopLeft,
  intersects,
} from '../../extent.js';
import {fromUserExtent} from '../../proj.js';
import ReprojTile from '../../reproj/Tile.js';
import {toSize} from '../../size.js';
import LRUCache from '../../structs/LRUCache.js';
import {createOrUpdate as createTileCoord, getKeyZXY} from '../../tilecoord.js';
import {
  apply as applyTransform,
  compose as composeTransform,
} from '../../transform.js';
import {getUid} from '../../util.js';
import CanvasLayerRenderer from './Layer.js';

/**
 * @param {string} sourceKey The source key.
 * @param {number} z The tile z level.
 * @param {number} x The tile x level.
 * @param {number} y The tile y level.
 * @return {string} The cache key.
 */
function getCacheKey(sourceKey, z, x, y) {
  return `${sourceKey},${getKeyZXY(z, x, y)}`;
}

/**
 * @typedef {Object<number, Set<import("../../Tile.js").default>>} TileLookup
 */

/**
 * Add a tile to the lookup.
 * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
 * @param {import("../../Tile.js").default} tile A tile.
 * @param {number} z The zoom level.
 * @return {boolean} The tile was added to the lookup.
 */
function addTileToLookup(tilesByZ, tile, z) {
  if (!(z in tilesByZ)) {
    tilesByZ[z] = new Set([tile]);
    return true;
  }
  const set = tilesByZ[z];
  const existing = set.has(tile);
  if (!existing) {
    set.add(tile);
  }
  return !existing;
}

/**
 * Remove a tile from the lookup.
 * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
 * @param {import("../../Tile.js").default} tile A tile.
 * @param {number} z The zoom level.
 * @return {boolean} The tile was removed from the lookup.
 */
function removeTileFromLookup(tilesByZ, tile, z) {
  const set = tilesByZ[z];
  if (set) {
    return set.delete(tile);
  }
  return false;
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
      fromUserExtent(layerState.extent, frameState.viewState.projection),
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
 * @typedef {Object} Options
 * @property {number} [cacheSize=512] The cache size.
 */

/**
 * @classdesc
 * Canvas renderer for tile layers.
 * @api
 * @template {import("../../layer/Tile.js").default|import("../../layer/VectorTile.js").default} [LayerType=import("../../layer/Tile.js").default<import("../../source/Tile.js").default>|import("../../layer/VectorTile.js").default]
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
     * @type {import("../../proj/Projection.js").default|null}
     */
    this.renderedProjection = null;

    /**
     * @private
     * @type {number}
     */
    this.renderedRevision_;

    /**
     * @protected
     * @type {!Array<import("../../Tile.js").default>}
     */
    this.renderedTiles = [];

    /**
     * @private
     * @type {string}
     */
    this.renderedSourceKey_;

    /**
     * @private
     * @type {number}
     */
    this.renderedSourceRevision_;

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

    this.maxStaleKeys = cacheSize * 0.5;
  }

  /**
   * @return {LRUCache} Tile cache.
   */
  getTileCache() {
    return this.tileCache_;
  }

  /**
   * Get a tile from the cache or create one if needed.
   *
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {import("../../Tile.js").default|null} Tile (or null if outside source extent).
   * @protected
   */
  getOrCreateTile(z, x, y, frameState) {
    const tileCache = this.tileCache_;
    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    const cacheKey = getCacheKey(tileSource.getKey(), z, x, y);

    /** @type {import("../../Tile.js").default} */
    let tile;

    if (tileCache.containsKey(cacheKey)) {
      tile = tileCache.get(cacheKey);
    } else {
      tile = tileSource.getTile(
        z,
        x,
        y,
        frameState.pixelRatio,
        frameState.viewState.projection,
      );
      if (!tile) {
        return null;
      }
      tileCache.set(cacheKey, tile);
    }
    return tile;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {import("../../Tile.js").default|null} Tile (or null if outside source extent).
   * @protected
   */
  getTile(z, x, y, frameState) {
    const tile = this.getOrCreateTile(z, x, y, frameState);
    if (!tile) {
      return null;
    }
    return tile;
  }

  /**
   * @param {import("../../pixel.js").Pixel} pixel Pixel.
   * @return {Uint8ClampedArray} Data at the pixel location.
   * @override
   */
  getData(pixel) {
    const frameState = this.frameState;
    if (!frameState) {
      return null;
    }

    const layer = this.getLayer();
    const coordinate = applyTransform(
      frameState.pixelToCoordinateTransform,
      pixel.slice(),
    );

    const layerExtent = layer.getExtent();
    if (layerExtent) {
      if (!containsCoordinate(layerExtent, coordinate)) {
        return null;
      }
    }

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
      const tile = this.getTile(z, tileCoord[1], tileCoord[2], frameState);
      if (!tile || tile.getState() !== TileState.LOADED) {
        continue;
      }

      const tileOrigin = tileGrid.getOrigin(z);
      const tileSize = toSize(tileGrid.getTileSize(z));
      const tileResolution = tileGrid.getResolution(z);

      /**
       * @type {import('../../DataTile.js').ImageLike}
       */
      let image;
      if (tile instanceof ImageTile || tile instanceof ReprojTile) {
        image = tile.getImage();
      } else if (tile instanceof DataTile) {
        image = asImageLike(tile.getData());
        if (!image) {
          continue;
        }
      } else {
        continue;
      }

      const col = Math.floor(
        tilePixelRatio *
          ((coordinate[0] - tileOrigin[0]) / tileResolution -
            tileCoord[1] * tileSize[0]),
      );

      const row = Math.floor(
        tilePixelRatio *
          ((tileOrigin[1] - coordinate[1]) / tileResolution -
            tileCoord[2] * tileSize[1]),
      );

      const gutter = Math.round(
        tilePixelRatio * source.getGutterForProjection(viewState.projection),
      );

      return this.getImageData(image, col + gutter, row + gutter);
    }

    return null;
  }

  /**
   * Determine whether render should be called.
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @return {boolean} Layer is ready to be rendered.
   * @override
   */
  prepareFrame(frameState) {
    if (!this.renderedProjection) {
      this.renderedProjection = frameState.viewState.projection;
    } else if (frameState.viewState.projection !== this.renderedProjection) {
      this.tileCache_.clear();
      this.renderedProjection = frameState.viewState.projection;
    }

    const source = this.getLayer().getSource();
    if (!source) {
      return false;
    }
    const sourceRevision = source.getRevision();
    if (!this.renderedRevision_) {
      this.renderedRevision_ = sourceRevision;
    } else if (this.renderedRevision_ !== sourceRevision) {
      this.renderedRevision_ = sourceRevision;
      if (this.renderedSourceKey_ === source.getKey()) {
        this.tileCache_.clear();
      }
    }
    return true;
  }

  /**
   * @param {import("../../Map.js").FrameState} frameState Frame state.
   * @param {import("../../extent.js").Extent} extent The extent to be rendered.
   * @param {number} initialZ The zoom level.
   * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
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
            : tileGrid.getResolution(0),
        ),
        tileSource.zDirection,
      ),
    );
    const rotation = viewState.rotation;
    const viewport = rotation
      ? getRotatedViewport(
          viewState.center,
          viewState.resolution,
          rotation,
          frameState.size,
        )
      : undefined;
    for (let z = initialZ; z >= minZ; --z) {
      const tileRange = tileGrid.getTileRangeForExtentAndZ(
        extent,
        z,
        this.tempTileRange_,
      );

      const tileResolution = tileGrid.getResolution(z);

      for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
        for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
          if (
            rotation &&
            !tileGrid.tileCoordIntersectsViewport([z, x, y], viewport)
          ) {
            continue;
          }
          const tile = this.getTile(z, x, y, frameState);
          if (!tile) {
            continue;
          }
          const added = addTileToLookup(tilesByZ, tile, z);
          if (!added) {
            continue;
          }

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
   * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
   * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
   * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
   * @private
   */
  findStaleTile_(tileCoord, tilesByZ) {
    const tileCache = this.tileCache_;
    const z = tileCoord[0];
    const x = tileCoord[1];
    const y = tileCoord[2];
    const staleKeys = this.getStaleKeys();
    for (let i = 0; i < staleKeys.length; ++i) {
      const cacheKey = getCacheKey(staleKeys[i], z, x, y);
      if (tileCache.containsKey(cacheKey)) {
        const tile = tileCache.peek(cacheKey);
        if (tile.getState() === TileState.LOADED) {
          tile.endTransition(getUid(this));
          addTileToLookup(tilesByZ, tile, z);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Look for tiles covering the provided tile coordinate at an alternate
   * zoom level.  Loaded tiles will be added to the provided tile texture lookup.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid The tile grid.
   * @param {import("../../tilecoord.js").TileCoord} tileCoord The target tile coordinate.
   * @param {number} altZ The alternate zoom level.
   * @param {TileLookup} tilesByZ Lookup of tiles by zoom level.
   * @return {boolean} The tile coordinate is covered by loaded tiles at the alternate zoom level.
   * @private
   */
  findAltTiles_(tileGrid, tileCoord, altZ, tilesByZ) {
    const tileRange = tileGrid.getTileRangeForTileCoordAndZ(
      tileCoord,
      altZ,
      this.tempTileRange_,
    );

    if (!tileRange) {
      return false;
    }

    let covered = true;
    const tileCache = this.tileCache_;
    const source = this.getLayer().getRenderSource();
    const sourceKey = source.getKey();
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const cacheKey = getCacheKey(sourceKey, altZ, x, y);
        let loaded = false;
        if (tileCache.containsKey(cacheKey)) {
          const tile = tileCache.peek(cacheKey);
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
   * @override
   */
  renderFrame(frameState, target) {
    this.renderComplete = true;

    /**
     * TODO:
     *  maybe skip transition when not fully opaque
     *  decide if this.renderComplete is useful
     */

    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const viewResolution = viewState.resolution;
    const viewCenter = viewState.center;
    const pixelRatio = frameState.pixelRatio;

    const tileLayer = this.getLayer();
    const tileSource = tileLayer.getSource();
    const tileGrid = tileSource.getTileGridForProjection(projection);
    const z = tileGrid.getZForResolution(viewResolution, tileSource.zDirection);
    const tileResolution = tileGrid.getResolution(z);

    const sourceKey = tileSource.getKey();
    if (!this.renderedSourceKey_) {
      this.renderedSourceKey_ = sourceKey;
    } else if (this.renderedSourceKey_ !== sourceKey) {
      this.prependStaleKey(this.renderedSourceKey_);
      this.renderedSourceKey_ = sourceKey;
    }

    let frameExtent = frameState.extent;
    const tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);

    this.prepareContainer(frameState, target);

    // desired dimensions of the canvas in pixels
    const width = this.context.canvas.width;
    const height = this.context.canvas.height;

    const layerExtent =
      layerState.extent && fromUserExtent(layerState.extent, projection);
    if (layerExtent) {
      frameExtent = getIntersection(
        frameExtent,
        fromUserExtent(layerState.extent, projection),
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
     * @type {TileLookup}
     */
    const tilesByZ = {};

    this.renderedTiles.length = 0;

    /**
     * Part 1: Enqueue tiles
     */

    const preload = tileLayer.getPreload();
    if (frameState.nextExtent) {
      const targetZ = tileGrid.getZForResolution(
        viewState.nextResolution,
        tileSource.zDirection,
      );
      const nextExtent = getRenderExtent(frameState, frameState.nextExtent);
      this.enqueueTiles(frameState, nextExtent, targetZ, tilesByZ, preload);
    }

    const renderExtent = getRenderExtent(frameState, frameExtent);
    this.enqueueTiles(frameState, renderExtent, z, tilesByZ, 0);
    if (preload > 0) {
      setTimeout(() => {
        this.enqueueTiles(
          frameState,
          renderExtent,
          z - 1,
          tilesByZ,
          preload - 1,
        );
      }, 0);
    }

    if (!(z in tilesByZ)) {
      return this.container;
    }

    /**
     * Part 2: Find alt tiles for those that are not yet loaded
     */

    const uid = getUid(this);
    const time = frameState.time;

    // look for cached tiles to use if a target tile is not ready
    for (const tile of tilesByZ[z]) {
      const tileState = tile.getState();
      if (tileState === TileState.EMPTY) {
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
      }
      if (tileState !== TileState.ERROR) {
        this.renderComplete = false;
      }

      const hasStaleTile = this.findStaleTile_(tileCoord, tilesByZ);
      if (hasStaleTile) {
        // use the stale tile before the new tile's transition has completed
        removeTileFromLookup(tilesByZ, tile, z);
        frameState.animate = true;
        continue;
      }

      // first look for child tiles (at z + 1)
      const coveredByChildren = this.findAltTiles_(
        tileGrid,
        tileCoord,
        z + 1,
        tilesByZ,
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
          tilesByZ,
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

    const context = this.getRenderContext(frameState);

    // set scale transform for calculating tile positions on the canvas
    composeTransform(
      this.tempTransform,
      width / 2,
      height / 2,
      canvasScale,
      canvasScale,
      0,
      -width / 2,
      -height / 2,
    );

    if (layerState.extent) {
      this.clipUnrotated(context, frameState, layerExtent);
    }

    if (!tileSource.getInterpolate()) {
      context.imageSmoothingEnabled = false;
    }

    this.preRender(context, frameState);

    /** @type {Array<number>} */
    const zs = Object.keys(tilesByZ).map(Number);
    zs.sort(ascending);

    let currentClip;
    const clips = [];
    const clipZs = [];
    for (let i = zs.length - 1; i >= 0; --i) {
      const currentZ = zs[i];
      const currentTilePixelSize = tileSource.getTilePixelSize(
        currentZ,
        pixelRatio,
        projection,
      );
      const currentResolution = tileGrid.getResolution(currentZ);
      const currentScale = currentResolution / tileResolution;
      const dx = currentTilePixelSize[0] * currentScale * canvasScale;
      const dy = currentTilePixelSize[1] * currentScale * canvasScale;
      const originTileCoord = tileGrid.getTileCoordForCoordAndZ(
        getTopLeft(canvasExtent),
        currentZ,
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
        const transition = zs.length === 1;

        let contextSaved = false;

        // Clip mask for regions in this tile that already filled by a higher z tile
        currentClip = [x, y, x + w, y, x + w, y + h, x, y + h];
        for (let i = 0, ii = clips.length; i < ii; ++i) {
          if (!transition && currentZ < clipZs[i]) {
            const clip = clips[i];
            if (
              intersects(
                [x, y, x + w, y + h],
                [clip[0], clip[3], clip[4], clip[7]],
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

        this.drawTile(tile, frameState, x, y, w, h, tileGutter, transition);
        if (contextSaved) {
          context.restore();
        }
        this.renderedTiles.unshift(tile);

        // TODO: decide if this is necessary
        this.updateUsedTiles(frameState.usedTiles, tileSource, tile);
      }
    }

    this.renderedResolution = tileResolution;
    this.extentChanged =
      !this.renderedExtent_ || !equals(this.renderedExtent_, canvasExtent);
    this.renderedExtent_ = canvasExtent;
    this.renderedPixelRatio = pixelRatio;

    this.postRender(this.context, frameState);

    if (layerState.extent) {
      context.restore();
    }
    context.imageSmoothingEnabled = true;

    if (this.renderComplete) {
      /**
       * @param {import("../../Map.js").default} map Map.
       * @param {import("../../Map.js").FrameState} frameState Frame state.
       */
      const postRenderFunction = (map, frameState) => {
        const tileSourceKey = getUid(tileSource);
        const wantedTiles = frameState.wantedTiles[tileSourceKey];
        const tilesCount = wantedTiles ? Object.keys(wantedTiles).length : 0;
        this.updateCacheSize(tilesCount);
        this.tileCache_.expireCache();
      };

      frameState.postRenderFunctions.push(postRenderFunction);
    }

    return this.container;
  }

  /**
   * Increases the cache size if needed
   * @param {number} tileCount Minimum number of tiles needed.
   */
  updateCacheSize(tileCount) {
    this.tileCache_.highWaterMark = Math.max(
      this.tileCache_.highWaterMark,
      tileCount * 2,
    );
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
      image = this.getTileImage(
        /** @type {import("../../ImageTile.js").default} */ (tile),
      );
    }
    if (!image) {
      return;
    }
    const context = this.getRenderContext(frameState);
    const uid = getUid(this);
    const layerState = frameState.layerStatesArray[frameState.layerIndex];
    const alpha =
      layerState.opacity *
      (transition ? tile.getAlpha(uid, frameState.time) : 1);
    const alphaChanged = alpha !== context.globalAlpha;
    if (alphaChanged) {
      context.save();
      context.globalAlpha = alpha;
    }
    context.drawImage(
      image,
      gutter,
      gutter,
      image.width - 2 * gutter,
      image.height - 2 * gutter,
      x,
      y,
      w,
      h,
    );

    if (alphaChanged) {
      context.restore();
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
