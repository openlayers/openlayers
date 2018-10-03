/**
 * @module ol/renderer/canvas/TileLayer
 */
import {getUid} from '../../util.js';
import LayerType from '../../LayerType.js';
import TileRange from '../../TileRange.js';
import TileState from '../../TileState.js';
import ViewHint from '../../ViewHint.js';
import {createCanvasContext2D} from '../../dom.js';
import {containsExtent, createEmpty, equals, getIntersection, isEmpty} from '../../extent.js';
import IntermediateCanvasRenderer from '../canvas/IntermediateCanvas.js';
import {create as createTransform, compose as composeTransform} from '../../transform.js';

/**
 * @classdesc
 * Canvas renderer for tile layers.
 * @api
 */
class CanvasTileLayerRenderer extends IntermediateCanvasRenderer {

  /**
   * @param {import("../../layer/Tile.js").default|import("../../layer/VectorTile.js").default} tileLayer Tile layer.
   * @param {boolean=} opt_noContext Skip the context creation.
   */
  constructor(tileLayer, opt_noContext) {

    super(tileLayer);

    /**
     * @protected
     * @type {CanvasRenderingContext2D}
     */
    this.context = opt_noContext ? null : createCanvasContext2D();

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

    const pixelRatio = frameState.pixelRatio;
    const size = frameState.size;
    const viewState = frameState.viewState;
    const projection = viewState.projection;
    const viewResolution = viewState.resolution;
    const viewCenter = viewState.center;

    const tileLayer = /** @type {import("../../layer/Tile.js").default} */ (this.getLayer());
    const tileSource = /** @type {import("../../source/Tile.js").default} */ (tileLayer.getSource());
    const sourceRevision = tileSource.getRevision();
    const tileGrid = tileSource.getTileGridForProjection(projection);
    const z = tileGrid.getZForResolution(viewResolution, this.zDirection);
    const tileResolution = tileGrid.getResolution(z);
    let oversampling = Math.round(viewResolution / tileResolution) || 1;
    let extent = frameState.extent;

    if (layerState.extent !== undefined) {
      extent = getIntersection(extent, layerState.extent);
    }
    if (isEmpty(extent)) {
      // Return false to prevent the rendering of the layer.
      return false;
    }

    const tileRange = tileGrid.getTileRangeForExtentAndZ(extent, z);
    const imageExtent = tileGrid.getTileRangeExtent(z, tileRange);

    const tilePixelRatio = tileSource.getTilePixelRatio(pixelRatio);

    /**
     * @type {Object<number, Object<string, import("../../Tile.js").default>>}
     */
    const tilesToDrawByZ = {};
    tilesToDrawByZ[z] = {};

    const findLoadedTiles = this.createLoadedTileFinder(
      tileSource, projection, tilesToDrawByZ);

    const hints = frameState.viewHints;
    const animatingOrInteracting = hints[ViewHint.ANIMATING] || hints[ViewHint.INTERACTING];

    const tmpExtent = this.tmpExtent;
    const tmpTileRange = this.tmpTileRange_;
    this.newTiles_ = false;
    let tile, x, y;
    for (x = tileRange.minX; x <= tileRange.maxX; ++x) {
      for (y = tileRange.minY; y <= tileRange.maxY; ++y) {
        if (Date.now() - frameState.time > 16 && animatingOrInteracting) {
          continue;
        }
        tile = this.getTile(z, x, y, pixelRatio, projection);
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

        const childTileRange = tileGrid.getTileCoordChildTileRange(
          tile.tileCoord, tmpTileRange, tmpExtent);
        let covered = false;
        if (childTileRange) {
          covered = findLoadedTiles(z + 1, childTileRange);
        }
        if (!covered) {
          tileGrid.forEachTileCoordParentTileRange(
            tile.tileCoord, findLoadedTiles, null, tmpTileRange, tmpExtent);
        }

      }
    }

    const renderedResolution = tileResolution * pixelRatio / tilePixelRatio * oversampling;
    if (!(this.renderedResolution && Date.now() - frameState.time > 16 && animatingOrInteracting) && (
      this.newTiles_ ||
          !(this.renderedExtent_ && containsExtent(this.renderedExtent_, extent)) ||
          this.renderedRevision != sourceRevision ||
          oversampling != this.oversampling_ ||
          !animatingOrInteracting && renderedResolution != this.renderedResolution
    )) {

      const context = this.context;
      if (context) {
        const tilePixelSize = tileSource.getTilePixelSize(z, pixelRatio, projection);
        const width = Math.round(tileRange.getWidth() * tilePixelSize[0] / oversampling);
        const height = Math.round(tileRange.getHeight() * tilePixelSize[1] / oversampling);
        const canvas = context.canvas;
        if (canvas.width != width || canvas.height != height) {
          this.oversampling_ = oversampling;
          canvas.width = width;
          canvas.height = height;
        } else {
          if (this.renderedExtent_ && !equals(imageExtent, this.renderedExtent_)) {
            context.clearRect(0, 0, width, height);
          }
          oversampling = this.oversampling_;
        }
      }

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
      let currentResolution, currentScale, currentTilePixelSize, currentZ, i, ii;
      let tileExtent, tileGutter, tilesToDraw, w, h;
      for (i = 0, ii = zs.length; i < ii; ++i) {
        currentZ = zs[i];
        currentTilePixelSize = tileSource.getTilePixelSize(currentZ, pixelRatio, projection);
        currentResolution = tileGrid.getResolution(currentZ);
        currentScale = currentResolution / tileResolution;
        tileGutter = tilePixelRatio * tileSource.getGutterForProjection(projection);
        tilesToDraw = tilesToDrawByZ[currentZ];
        for (const tileCoordKey in tilesToDraw) {
          tile = tilesToDraw[tileCoordKey];
          tileExtent = tileGrid.getTileCoordExtent(tile.getTileCoord(), tmpExtent);
          x = (tileExtent[0] - imageExtent[0]) / tileResolution * tilePixelRatio / oversampling;
          y = (imageExtent[3] - tileExtent[3]) / tileResolution * tilePixelRatio / oversampling;
          w = currentTilePixelSize[0] * currentScale / oversampling;
          h = currentTilePixelSize[1] * currentScale / oversampling;
          this.drawTileImage(tile, frameState, layerState, x, y, w, h, tileGutter, z === currentZ);
          this.renderedTiles.push(tile);
        }
      }

      this.renderedRevision = sourceRevision;
      this.renderedResolution = tileResolution * pixelRatio / tilePixelRatio * oversampling;
      this.renderedExtent_ = imageExtent;
    }

    const scale = this.renderedResolution / viewResolution;
    const transform = composeTransform(this.imageTransform_,
      pixelRatio * size[0] / 2, pixelRatio * size[1] / 2,
      scale, scale,
      0,
      (this.renderedExtent_[0] - viewCenter[0]) / this.renderedResolution * pixelRatio,
      (viewCenter[1] - this.renderedExtent_[3]) / this.renderedResolution * pixelRatio);
    composeTransform(this.coordinateToCanvasPixelTransform,
      pixelRatio * size[0] / 2 - transform[4], pixelRatio * size[1] / 2 - transform[5],
      pixelRatio / viewResolution, -pixelRatio / viewResolution,
      0,
      -viewCenter[0], -viewCenter[1]);


    this.updateUsedTiles(frameState.usedTiles, tileSource, z, tileRange);
    this.manageTilePyramid(frameState, tileSource, tileGrid, pixelRatio,
      projection, extent, z, tileLayer.getPreload());
    this.scheduleExpireCache(frameState, tileSource);

    return this.renderedTiles.length > 0;
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
 * Determine if this renderer handles the provided layer.
 * @param {import("../../layer/Layer.js").default} layer The candidate layer.
 * @return {boolean} The renderer can render the layer.
 */
CanvasTileLayerRenderer['handles'] = function(layer) {
  return layer.getType() === LayerType.TILE;
};


/**
 * Create a layer renderer.
 * @param {import("../Map.js").default} mapRenderer The map renderer.
 * @param {import("../../layer/Layer.js").default} layer The layer to be rendererd.
 * @return {CanvasTileLayerRenderer} The layer renderer.
 */
CanvasTileLayerRenderer['create'] = function(mapRenderer, layer) {
  return new CanvasTileLayerRenderer(/** @type {import("../../layer/Tile.js").default} */ (layer));
};


/**
 * @function
 * @return {import("../../layer/Tile.js").default|import("../../layer/VectorTile.js").default}
 */
CanvasTileLayerRenderer.prototype.getLayer;


export default CanvasTileLayerRenderer;
