/**
 * @module ol/renderer/canvas/TileLayer
 */
import {getUid} from '../../util.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import {createEmpty, getIntersection, getTopLeft} from '../../extent.js';
import {createCanvasContext2D} from '../../dom.js';
import CanvasLayerRenderer from './Layer.js';
import {create as createTransform, compose as composeTransform} from '../../transform.js';

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
     * @protected
     * @type {CanvasRenderingContext2D}
     */
    this.context = createCanvasContext2D();

    const canvas = this.context.canvas;
    canvas.style.position = 'absolute';

    /**
     * @protected
     * @type {import("../../transform.js").Transform}
     */
    this.coordinateToCanvasPixelTransform = createTransform();

    /**
     * @private
     * @type {number}
     */
    this.oversampling_;

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
     * @private
     * @type {import("../../transform.js").Transform}
     */
    this.imageTransform_ = createTransform();

    /**
     * @protected
     * @type {number}
     */
    this.zDirection = 0;

  }

  /**
   * @private
   * @param {import("../../Tile.js").default} tile Tile.
   * @return {boolean} Tile is drawable.
   */
  isDrawableTile_(tile) {
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
   * @param {number} pixelRatio Pixel ratio.
   * @param {import("../../proj/Projection.js").default} projection Projection.
   * @return {!import("../../Tile.js").default} Tile.
   */
  getTile(z, x, y, pixelRatio, projection) {
    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = /** @type {import("../../source/Tile.js").default} */ (tileLayer.getSource());
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
    if (!this.isDrawableTile_(tile)) {
      tile = tile.getInterimTile();
    }
    return tile;
  }

  /**
   * @inheritDoc
   */
  prepareFrame(frameState, layerState) {
    return true;
  }

  /**
   * @inheritDoc
   */
  renderFrame(frameState, layerState) {
    const context = this.context;
    const size = frameState.size;
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const viewResolution = viewState.resolution;
    const viewCenter = viewState.center;
    const rotation = viewState.rotation;
    const pixelRatio = frameState.pixelRatio;

    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = /** @type {import("../../source/Tile.js").default} */ (tileLayer.getSource());
    const sourceRevision = tileSource.getRevision();
    const tileGrid = tileSource.getTileGridForProjection(projection);
    const z = tileGrid.getZForResolution(viewResolution, this.zDirection);
    const tileResolution = tileGrid.getResolution(z);
    let extent = frameState.extent;

    if (layerState.extent !== undefined) {
      extent = getIntersection(extent, layerState.extent);
    }

    // TODO: clip by layer extent

    const tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);

    // desired dimensions of the canvas in pixels
    let width = Math.round(frameState.size[0] * tilePixelRatio);
    let height = Math.round(frameState.size[1] * tilePixelRatio);
    if (tileResolution < viewResolution) {
      // scale canvas so it covers the viewport until new tiles come it
      width *= 1.5;
      height *= 1.5;
    }

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

    const tileRange = tileGrid.getTileRangeForExtentAndZ(canvasExtent, z);

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
        const tile = this.getTile(z, x, y, pixelRatio, projection);
        if (this.isDrawableTile_(tile)) {
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
          tileGrid.forEachTileCoordParentTileRange(tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
        }

      }
    }

    const canvas = context.canvas;
    if (canvas.width != width || canvas.height != height) {
      canvas.width = width;
      canvas.height = height;
    } else {
      context.clearRect(0, 0, width, height);
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
      const w = currentTilePixelSize[0] * currentScale;
      const h = currentTilePixelSize[1] * currentScale;
      const originTileCoord = tileGrid.getTileCoordForCoordAndZ(getTopLeft(canvasExtent), currentZ);
      const originTileExtent = tileGrid.getTileCoordExtent(originTileCoord);
      const originX = Math.round(tilePixelRatio * (originTileExtent[0] - canvasExtent[0]) / tileResolution);
      const originY = Math.round(tilePixelRatio * (canvasExtent[3] - originTileExtent[3]) / tileResolution);
      const tileGutter = tilePixelRatio * tileSource.getGutterForProjection(projection);
      const tilesToDraw = tilesToDrawByZ[currentZ];
      for (const tileCoordKey in tilesToDraw) {
        const tile = tilesToDraw[tileCoordKey];
        const tileCoord = tile.tileCoord;
        const x = originX - (originTileCoord[1] - tileCoord[1]) * w;
        const y = originY + (originTileCoord[2] - tileCoord[2]) * h;
        this.drawTileImage(tile, frameState, layerState, x, y, w, h, tileGutter, z === currentZ);
        this.renderedTiles.push(tile);
      }
    }


    this.renderedRevision = sourceRevision;
    this.renderedResolution = tileResolution;
    this.renderedExtent_ = canvasExtent;

    const scale = this.renderedResolution / frameState.viewState.resolution;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // TODO: check where these are used and confirm they are correct
    const transform = composeTransform(
      this.imageTransform_,
      halfWidth, halfHeight,
      scale, scale,
      rotation,
      -halfWidth, -halfHeight
    );

    composeTransform(this.coordinateToCanvasPixelTransform,
      pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
      pixelRatio / viewResolution, -pixelRatio / viewResolution,
      0,
      -viewCenter[0], -viewCenter[1]);

    this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
    this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
    this.scheduleExpireCache(frameState, tileSource);

    this.postRender(context, frameState, layerState);

    const opacity = layerState.opacity;
    if (opacity !== canvas.style.opacity) {
      canvas.style.opacity = opacity;
    }

    const canvasScale = this.renderedResolution / frameState.viewState.resolution / tilePixelRatio;

    const canvasTransform = 'rotate(' + rotation + 'rad) scale(' + canvasScale + ')';
    if (canvasTransform !== canvas.style.transform) {
      canvas.style.transform = canvasTransform;
    }

    return canvas;
  }

  /**
   * @param {import("../../Tile.js").default} tile Tile.
   * @param {import("../../PluggableMap.js").FrameState} frameState Frame state.
   * @param {import("../../layer/Layer.js").State} layerState Layer state.
   * @param {number} x Left of the tile.
   * @param {number} y Top of the tile.
   * @param {number} w Width of the tile.
   * @param {number} h Height of the tile.
   * @param {number} gutter Tile gutter.
   * @param {boolean} transition Apply an alpha transition.
   */
  drawTileImage(tile, frameState, layerState, x, y, w, h, gutter, transition) {
    const image = this.getTileImage(tile);
    if (!image) {
      return;
    }
    const uid = getUid(this);
    const alpha = transition ? tile.getAlpha(uid, frameState.time) : 1;
    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = /** @type {import("../../source/Tile.js").default} */ (tileLayer.getSource());
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
   * @inheritDoc
   */
  getImageTransform() {
    return this.imageTransform_;
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
}


/**
 * @function
 * @return {import("../../layer/Tile.js").default|import("../../layer/VectorTile.js").default}
 */
CanvasTileLayerRenderer.prototype.getLayer;


export default CanvasTileLayerRenderer;
