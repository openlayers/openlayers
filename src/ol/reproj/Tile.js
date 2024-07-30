/**
 * @module ol/reproj/Tile
 */
import {ERROR_THRESHOLD} from './common.js';

import CompositeTile from '../CompositeTile.js';
import TileState from '../TileState.js';
import Triangulation from './Triangulation.js';
import {
  calculateSourceExtentResolution,
  canvasPool,
  render as renderReprojected,
} from '../reproj.js';
import {clamp} from '../math.js';
import {getArea, getIntersection, getWidth, wrapAndSliceX} from '../extent.js';
import {releaseCanvas} from '../dom.js';

/**
 * @typedef {function(number, number, number, number) : (import("../ImageTile.js").default)} FunctionType
 */

/**
 * @typedef {Object} TileOffset
 * @property {import("../ImageTile.js").default} tile Tile.
 * @property {number} offset Offset.
 */

/**
 * @classdesc
 * Class encapsulating single reprojected tile.
 * See {@link module:ol/source/TileImage~TileImage}.
 *
 * @extends {CompositeTile<import("../ImageTile.js").default, TileOffset>}
 */
class ReprojTile extends CompositeTile {
  /**
   * @param {import("../proj/Projection.js").default} sourceProj Source projection.
   * @param {import("../tilegrid/TileGrid.js").default} sourceTileGrid Source tile grid.
   * @param {import("../proj/Projection.js").default} targetProj Target projection.
   * @param {import("../tilegrid/TileGrid.js").default} targetTileGrid Target tile grid.
   * @param {import("../tilecoord.js").TileCoord} tileCoord Coordinate of the tile.
   * @param {import("../tilecoord.js").TileCoord} wrappedTileCoord Coordinate of the tile wrapped in X.
   * @param {number} pixelRatio Pixel ratio.
   * @param {number} gutter Gutter of the source tiles.
   * @param {FunctionType} getTileFunction
   *     Function returning source tiles (z, x, y, pixelRatio).
   * @param {number} [errorThreshold] Acceptable reprojection error (in px).
   * @param {boolean} [renderEdges] Render reprojection edges.
   * @param {import("../Tile.js").Options} [options] Tile options.
   */
  constructor(
    sourceProj,
    sourceTileGrid,
    targetProj,
    targetTileGrid,
    tileCoord,
    wrappedTileCoord,
    pixelRatio,
    gutter,
    getTileFunction,
    errorThreshold,
    renderEdges,
    options,
  ) {
    super({
      ...options,
      tileCoord,
      sourceTiles: [],
    });

    /**
     * @private
     * @type {boolean}
     */
    this.renderEdges_ = renderEdges !== undefined ? renderEdges : false;

    /**
     * @private
     * @type {number}
     */
    this.pixelRatio_ = pixelRatio;

    /**
     * @private
     * @type {number}
     */
    this.gutter_ = gutter;

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = null;

    /**
     * @private
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    this.sourceTileGrid_ = sourceTileGrid;

    /**
     * @private
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    this.targetTileGrid_ = targetTileGrid;

    /**
     * @private
     * @type {import("../tilecoord.js").TileCoord}
     */
    this.wrappedTileCoord_ = wrappedTileCoord ? wrappedTileCoord : tileCoord;

    /**
     * @private
     * @type {number}
     */
    this.sourceZ_ = 0;

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.clipExtent_ = sourceProj.canWrapX()
      ? sourceProj.getExtent()
      : undefined;

    const targetExtent = targetTileGrid.getTileCoordExtent(
      this.wrappedTileCoord_,
    );
    const maxTargetExtent = this.targetTileGrid_.getExtent();
    let maxSourceExtent = this.sourceTileGrid_.getExtent();

    const limitedTargetExtent = maxTargetExtent
      ? getIntersection(targetExtent, maxTargetExtent)
      : targetExtent;

    if (getArea(limitedTargetExtent) === 0) {
      // Tile is completely outside range -> EMPTY
      // TODO: is it actually correct that the source even creates the tile ?
      this.state = TileState.EMPTY;
      return;
    }

    const sourceProjExtent = sourceProj.getExtent();
    if (sourceProjExtent) {
      if (!maxSourceExtent) {
        maxSourceExtent = sourceProjExtent;
      } else {
        maxSourceExtent = getIntersection(maxSourceExtent, sourceProjExtent);
      }
    }

    const targetResolution = targetTileGrid.getResolution(
      this.wrappedTileCoord_[0],
    );

    const sourceResolution = calculateSourceExtentResolution(
      sourceProj,
      targetProj,
      limitedTargetExtent,
      targetResolution,
    );

    if (!isFinite(sourceResolution) || sourceResolution <= 0) {
      // invalid sourceResolution -> EMPTY
      // probably edges of the projections when no extent is defined
      this.state = TileState.EMPTY;
      return;
    }

    const errorThresholdInPixels =
      errorThreshold !== undefined ? errorThreshold : ERROR_THRESHOLD;

    /**
     * @private
     * @type {!import("./Triangulation.js").default}
     */
    this.triangulation_ = new Triangulation(
      sourceProj,
      targetProj,
      limitedTargetExtent,
      maxSourceExtent,
      sourceResolution * errorThresholdInPixels,
      targetResolution,
    );

    if (this.triangulation_.getTriangles().length === 0) {
      // no valid triangles -> EMPTY
      this.state = TileState.EMPTY;
      return;
    }

    this.sourceZ_ = sourceTileGrid.getZForResolution(sourceResolution);
    let sourceExtent = this.triangulation_.calculateSourceExtent();

    if (maxSourceExtent) {
      if (sourceProj.canWrapX()) {
        sourceExtent[1] = clamp(
          sourceExtent[1],
          maxSourceExtent[1],
          maxSourceExtent[3],
        );
        sourceExtent[3] = clamp(
          sourceExtent[3],
          maxSourceExtent[1],
          maxSourceExtent[3],
        );
      } else {
        sourceExtent = getIntersection(sourceExtent, maxSourceExtent);
      }
    }

    if (!getArea(sourceExtent)) {
      this.state = TileState.EMPTY;
    } else {
      let worldWidth = 0;
      let worldsAway = 0;
      if (sourceProj.canWrapX()) {
        worldWidth = getWidth(sourceProjExtent);
        worldsAway = Math.floor(
          (sourceExtent[0] - sourceProjExtent[0]) / worldWidth,
        );
      }

      const sourceExtents = wrapAndSliceX(
        sourceExtent.slice(),
        sourceProj,
        true,
      );
      sourceExtents.forEach((extent) => {
        const sourceRange = sourceTileGrid.getTileRangeForExtentAndZ(
          extent,
          this.sourceZ_,
        );

        for (let srcX = sourceRange.minX; srcX <= sourceRange.maxX; srcX++) {
          for (let srcY = sourceRange.minY; srcY <= sourceRange.maxY; srcY++) {
            const tile = getTileFunction(this.sourceZ_, srcX, srcY, pixelRatio);
            if (tile) {
              const offset = worldsAway * worldWidth;
              this.sourceTiles.push({tile, offset});
            }
          }
        }
        ++worldsAway;
      });

      if (this.sourceTiles.length === 0) {
        this.state = TileState.EMPTY;
      }
    }
  }

  /**
   * Get the HTML Canvas element for this tile.
   * @return {HTMLCanvasElement} Canvas.
   */
  getImage() {
    return this.canvas_;
  }

  /**
   * @private
   */
  reproject_() {
    const sources = [];
    this.sourceTiles.forEach((source) => {
      const tile = source.tile;
      if (tile && tile.getState() == TileState.LOADED) {
        const extent = this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord);
        extent[0] += source.offset;
        extent[2] += source.offset;
        const clipExtent = this.clipExtent_?.slice();
        if (clipExtent) {
          clipExtent[0] += source.offset;
          clipExtent[2] += source.offset;
        }
        sources.push({
          extent: extent,
          clipExtent: clipExtent,
          image: tile.getImage(),
        });
      }
    });
    this.sourceTiles.length = 0;

    if (sources.length === 0) {
      this.state = TileState.ERROR;
    } else {
      const z = this.wrappedTileCoord_[0];
      const size = this.targetTileGrid_.getTileSize(z);
      const width = typeof size === 'number' ? size : size[0];
      const height = typeof size === 'number' ? size : size[1];
      const targetResolution = this.targetTileGrid_.getResolution(z);
      const sourceResolution = this.sourceTileGrid_.getResolution(
        this.sourceZ_,
      );

      const targetExtent = this.targetTileGrid_.getTileCoordExtent(
        this.wrappedTileCoord_,
      );

      this.canvas_ = renderReprojected(
        width,
        height,
        this.pixelRatio_,
        sourceResolution,
        this.sourceTileGrid_.getExtent(),
        targetResolution,
        targetExtent,
        this.triangulation_,
        sources,
        this.gutter_,
        this.renderEdges_,
        this.interpolate,
      );

      this.state = TileState.LOADED;
    }
    this.changed();
  }

  /**
   * @override
   */
  loadEnd() {
    this.reproject_();
  }

  /**
   * Remove from the cache due to expiry
   * @override
   */
  release() {
    if (this.canvas_) {
      releaseCanvas(this.canvas_.getContext('2d'));
      canvasPool.push(this.canvas_);
      this.canvas_ = null;
    }
    super.release();
  }
}

export default ReprojTile;
