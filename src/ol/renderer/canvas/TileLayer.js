/**
 * @module ol/renderer/canvas/TileLayer
 */
import {getUid} from '../../util.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import {createEmpty, equals, getIntersection, getTopLeft} from '../../extent.js';
import CanvasLayerRenderer from './Layer.js';
import {apply as applyTransform, compose as composeTransform, makeInverse, toString as transformToString} from '../../transform.js';

/**
 * @classdesc
 * Canvas renderer for tile layers.
 * @api
 */
class CanvasTileLayerRenderer extends CanvasLayerRenderer {

  /**
   * @param {import("../../layer/Tile.js").default|import("../../layer/VectorTile.js").default} tileLayer Tile layer.
   */
  constructor(tileLayer) {
    super(tileLayer);

    /**
     * Rendered extent has changed since the previous `renderFrame()` call
     * @type {boolean}
     */
    this.extentChanged = true;

    /**
     * @private
     * @type {import("../../extent.js").Extent}
     */
    this.renderedExtent_ = null;

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
    this.tmpExtent = createEmpty();

    /**
     * @private
     * @type {import("../../TileRange.js").default}
     */
    this.tmpTileRange_ = new TileRange(0, 0, 0, 0);

    /**
     * @protected
     * @type {number}
     */
    this.zDirection = 0;
  }

  /**
   * @protected
   * @param {import("../../Tile.js").default} tile Tile.
   * @return {boolean} Tile is drawable.
   */
  isDrawableTile(tile) {
    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileState = tile.getState();
    const useInterimTilesOnError = tileLayer.getUseInterimTilesOnError();
    return tileState == TileState.LOADED ||
        tileState == TileState.EMPTY ||
        tileState == TileState.ERROR && !useInterimTilesOnError;
  }

  /**
   * @param {number} z Tile coordinate z.
   * @param {number} x Tile coordinate x.
   * @param {number} y Tile coordinate y.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @return {!import("../../Tile.js").default} Tile.
   */
  getTile(z, x, y, frameState) {
    const pixelRatio = frameState.pixelRatio;
    const projection = frameState.viewState.projection;
    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = tileLayer.getSource();
    let tile = tileSource.getTile(z, x, y, pixelRatio, projection);
    if (tile.getState() == TileState.ERROR) {
      if (!tileLayer.getUseInterimTilesOnError()) {
        // When useInterimTilesOnError is false, we consider the error tile as loaded.
        tile.setState(TileState.LOADED);
      } else if (tileLayer.getPreload() > 0) {
        // Preloaded tiles for lower resolutions might have finished loading.
        this.newTiles_ = true;
      }
    }
    if (!this.isDrawableTile(tile)) {
      tile = tile.getInterimTile();
    }
    return tile;
  }

  /**
   * @inheritDoc
   */
  loadedTileCallback(tiles, zoom, tile) {
    if (this.isDrawableTile(tile)) {
      return super.loadedTileCallback(tiles, zoom, tile);
    }
    return false;
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState) {
    return true;
  }

  /**
   * TODO: File a TypeScript issue about inheritDoc not being followed
   * all the way.  Without this explicit return type, the VectorTileLayer
   * renderFrame function does not pass.
   *
   * @inheritDoc
   * @returns {HTMLElement} The rendered element.
   */
  renderFrame(frameState, layerState) {
    const context = this.context;
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const viewResolution = viewState.resolution;
    const viewCenter = viewState.center;
    const rotation = viewState.rotation;
    const pixelRatio = frameState.pixelRatio;

    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = tileLayer.getSource();
    const sourceRevision = tileSource.getRevision();
    const tileGrid = tileSource.getTileGridForProjection(projection);
    const zDirection = tileSource.zDirection === undefined ? this.zDirection : tileSource.zDirection;
    const z = tileGrid.getZForResolution(viewResolution, zDirection);
    const tileResolution = tileGrid.getResolution(z);
    let extent = frameState.extent;

    if (layerState.extent) {
      extent = getIntersection(extent, layerState.extent);
    }

    const tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);

    // desired dimensions of the canvas in pixels
    let width = Math.round(frameState.size[0] * tilePixelRatio);
    let height = Math.round(frameState.size[1] * tilePixelRatio);

    if (rotation) {
      const size = Math.round(Math.sqrt(width * width + height * height));
      width = height = size;
    }

    const dx = tileResolution * width / 2 / tilePixelRatio;
    const dy = tileResolution * height / 2 / tilePixelRatio;
    const canvasExtent = [
      viewCenter[0] - dx,
      viewCenter[1] - dy,
      viewCenter[0] + dx,
      viewCenter[1] + dy
    ];

    const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);

    /**
     * @type {Object<number, Object<string, import("../../Tile.js").default>>}
     */
    const tilesToDrawByZ = {};
    tilesToDrawByZ[z] = {};

    const findLoadedTiles = this.createLoadedTileFinder(tileSource, projection, tilesToDrawByZ);

    const tmpExtent = this.tmpExtent;
    const tmpTileRange = this.tmpTileRange_;
    this.newTiles_ = false;
    for (let x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (let y = tileRange.minY; y <= tileRange.maxY; ++y) {
        const tile = this.getTile(z, x, y, frameState);
        if (this.isDrawableTile(tile)) {
          const uid = getUid(this);
          if (tile.getState() == TileState.LOADED) {
            tilesToDrawByZ[z][tile.tileCoord.toString()] = tile;
            const inTransition = tile.inTransition(uid);
            if (!this.newTiles_ && (inTransition || this.renderedTiles.indexOf(tile) === -1)) {
              this.newTiles_ = true;
            }
          }
          if (tile.getAlpha(uid, frameState.time) === 1) {
            // don't look for alt tiles if alpha is 1
            continue;
          }
        }

        const childTileRange = tileGrid.getTileCoordChildTileRange(tile.tileCoord, tmpTileRange, tmpExtent);

        let covered = false;
        if (childTileRange) {
          covered = findLoadedTiles(z + 1, childTileRange);
        }
        if (!covered) {
          tileGrid.forEachTileCoordParentTileRange(tile.tileCoord, findLoadedTiles, tmpTileRange, tmpExtent);
        }

      }
    }


    const canvas = context.canvas;
    const canvasScale = tileResolution / viewResolution;

    // set forward and inverse pixel transforms
    composeTransform(this.pixelTransform_,
      frameState.size[0] / 2, frameState.size[1] / 2,
      1 / tilePixelRatio, 1 / tilePixelRatio,
      rotation,
      -width / 2, -height / 2
    );
    makeInverse(this.inversePixelTransform_, this.pixelTransform_);

    // set scale transform for calculating tile positions on the canvas
    composeTransform(this.tempTransform_,
      width / 2, height / 2,
      canvasScale, canvasScale,
      0,
      -width / 2, -height / 2
    );

    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    } else {
      context.clearRect(0, 0, width, height);
    }

    if (layerState.extent) {
      this.clipUnrotated(context, frameState, layerState.extent);
    }

    this.preRender(context, frameState);

    this.renderedTiles.length = 0;
    /** @type {Array<number>} */
    const zs = Object.keys(tilesToDrawByZ).map(Number);
    zs.sort(function(a, b) {
      if (a === z) {
        return 1;
      } else if (b === z) {
        return -1;
      } else {
        return a > b ? 1 : a < b ? -1 : 0;
      }
    });

    for (let i = 0, ii = zs.length; i < ii; ++i) {
      const currentZ = zs[i];
      const currentTilePixelSize = tileSource.getTilePixelSize(currentZ, pixelRatio, projection);
      const currentResolution = tileGrid.getResolution(currentZ);
      const currentScale = currentResolution / tileResolution;
      const dx = currentTilePixelSize[0] * currentScale * canvasScale;
      const dy = currentTilePixelSize[1] * currentScale * canvasScale;
      const originTileCoord = tileGrid.getTileCoordForCoordAndZ(getTopLeft(canvasExtent), currentZ);
      const originTileExtent = tileGrid.getTileCoordExtent(originTileCoord);
      const origin = applyTransform(this.tempTransform_, [
        tilePixelRatio * (originTileExtent[0] - canvasExtent[0]) / tileResolution,
        tilePixelRatio * (canvasExtent[3] - originTileExtent[3]) / tileResolution
      ]);
      const tileGutter = tilePixelRatio * tileSource.getGutterForProjection(projection);
      const tilesToDraw = tilesToDrawByZ[currentZ];
      for (const tileCoordKey in tilesToDraw) {
        const tile = tilesToDraw[tileCoordKey];
        const tileCoord = tile.tileCoord;

        // Calculate integer positions and sizes so that tiles align
        const floatX = (origin[0] - (originTileCoord[1] - tileCoord[1]) * dx);
        const nextX = Math.round(floatX + dx);
        const floatY = (origin[1] - (originTileCoord[2] - tileCoord[2]) * dy);
        const nextY = Math.round(floatY + dy);
        const x = Math.round(floatX);
        const y = Math.round(floatY);
        const w = nextX - x;
        const h = nextY - y;

        this.drawTileImage(tile, frameState, x, y, w, h, tileGutter, z === currentZ);
        this.renderedTiles.push(tile);
        this.updateUsedTiles(frameState.usedTiles, tileSource, tile);
      }
    }


    this.renderedRevision = sourceRevision;
    this.renderedResolution = tileResolution;
    this.extentChanged = !this.renderedExtent_ || !equals(this.renderedExtent_, canvasExtent);
    this.renderedExtent_ = canvasExtent;

    this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
    this.updateCacheSize_(frameState, tileSource);
    this.scheduleExpireCache(frameState, tileSource);

    this.postRender(context, frameState);

    if (layerState.extent) {
      context.restore();
    }

    const opacity = layerState.opacity;
    if (opacity !== parseFloat(canvas.style.opacity)) {
      canvas.style.opacity = opacity;
    }

    const canvasTransform = transformToString(this.pixelTransform_);
    if (canvasTransform !== canvas.style.transform) {
      canvas.style.transform = canvasTransform;
    }

    return canvas;
  }

  /**
   * @param {import("../../Tile.js").default} tile Tile.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {number} x Left of the tile.
   * @param {number} y Top of the tile.
   * @param {number} w Width of the tile.
   * @param {number} h Height of the tile.
   * @param {number} gutter Tile gutter.
   * @param {boolean} transition Apply an alpha transition.
   */
  drawTileImage(tile, frameState, x, y, w, h, gutter, transition) {
    const image = this.getTileImage(tile);
    if (!image) {
      return;
    }
    const uid = getUid(this);
    const alpha = transition ? tile.getAlpha(uid, frameState.time) : 1;
    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = tileLayer.getSource();
    if (alpha === 1 && !tileSource.getOpaque(frameState.viewState.projection)) {
      this.context.clearRect(x, y, w, h);
    }
    const alphaChanged = alpha !== this.context.globalAlpha;
    if (alphaChanged) {
      this.context.save();
      this.context.globalAlpha = alpha;
    }
    this.context.drawImage(image, gutter, gutter,
      image.width - 2 * gutter, image.height - 2 * gutter, x, y, w, h);

    if (alphaChanged) {
      this.context.restore();
    }
    if (alpha !== 1) {
      frameState.animate = true;
    } else if (transition) {
      tile.endTransition(uid);
    }
  }

  /**
   * @inheritDoc
   */
  getImage() {
    const context = this.context;
    return context ? context.canvas : null;
  }

  /**
   * Get the image from a tile.
   * @param {import("../../Tile.js").default} tile Tile.
   * @return {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} Image.
   * @protected
   */
  getTileImage(tile) {
    return /** @type {import("../../ImageTile.js").default} */ (tile).getImage();
  }

  /**
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../source/Tile.js").default} tileSource Tile source.
   * @protected
   */
  scheduleExpireCache(frameState, tileSource) {
    if (tileSource.canExpireCache()) {
      /**
       * @param {import("../../source/Tile.js").default} tileSource Tile source.
       * @param {import("../../PluggableMap.js").default} map Map.
       * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
       */
      const postRenderFunction = function(tileSource, map, frameState) {
        const tileSourceKey = getUid(tileSource);
        if (tileSourceKey in frameState.usedTiles) {
          tileSource.expireCache(frameState.viewState.projection,
            frameState.usedTiles[tileSourceKey]);
        }
      }.bind(null, tileSource);

      frameState.postRenderFunctions.push(
        /** @type {import("../../PluggableMap.js").PostRenderFunction} */ (postRenderFunction)
      );
    }
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

  /**
   * Check if the cache is big enough, and increase its size if necessary.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../source/Tile.js").default} tileSource Tile source.
   * @private
   */
  updateCacheSize_(frameState, tileSource) {
    const tileSourceKey = getUid(tileSource);
    let size = 0;
    if (tileSourceKey in frameState.usedTiles) {
      size += Object.keys(frameState.usedTiles[tileSourceKey]).length;
    }
    if (tileSourceKey in frameState.wantedTiles) {
      size += Object.keys(frameState.wantedTiles[tileSourceKey]).length;
    }
    const tileCache = tileSource.tileCache;
    if (tileCache.highWaterMark < size) {
      tileCache.highWaterMark = size;
    }
  }

  /**
   * Manage tile pyramid.
   * This function performs a number of functions related to the tiles at the
   * current zoom and lower zoom levels:
   * - registers idle tiles in frameState.wantedTiles so that they are not
   *   discarded by the tile queue
   * - enqueues missing tiles
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../source/Tile.js").default} tileSource Tile source.
   * @param {import("../../tilegrid/TileGrid.js").default} tileGrid Tile grid.
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../proj/Projection.js").default} projection Projection.
   * @param {import("../../extent.js").Extent} extent Extent.
   * @param {number} currentZ Current Z.
   * @param {number} preload Load low resolution tiles up to 'preload' levels.
   * @param {function(import("../../Tile.js").default)=} opt_tileCallback Tile callback.
   * @protected
   */
  manageTilePyramid(
    frameState,
    tileSource,
    tileGrid,
    pixelRatio,
    projection,
    extent,
    currentZ,
    preload,
    opt_tileCallback
  ) {
    const tileSourceKey = getUid(tileSource);
    if (!(tileSourceKey in frameState.wantedTiles)) {
      frameState.wantedTiles[tileSourceKey] = {};
    }
    const wantedTiles = frameState.wantedTiles[tileSourceKey];
    const tileQueue = frameState.tileQueue;
    const minZoom = tileGrid.getMinZoom();
    let tile, tileRange, tileResolution, x, y, z;
    for (z = minZoom; z <= currentZ; ++z) {
      tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z, tileRange);
      tileResolution = tileGrid.getResolution(z);
      for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
        for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
          if (currentZ - z <= preload) {
            tile = tileSource.getTile(z, x, y, pixelRatio, projection);
            if (tile.getState() == TileState.IDLE) {
              wantedTiles[tile.getKey()] = true;
              if (!tileQueue.isKeyQueued(tile.getKey())) {
                tileQueue.enqueue([tile, tileSourceKey,
                  tileGrid.getTileCoordCenter(tile.tileCoord), tileResolution]);
              }
            }
            if (opt_tileCallback !== undefined) {
              opt_tileCallback(tile);
            }
          } else {
            tileSource.useTile(z, x, y, projection);
          }
        }
      }
    }
  }

}


/**
 * @function
 * @return {import("../../layer/Tile.js").default|import("../../layer/VectorTile.js").default}
 */
CanvasTileLayerRenderer.prototype.getLayer;


export default CanvasTileLayerRenderer;
