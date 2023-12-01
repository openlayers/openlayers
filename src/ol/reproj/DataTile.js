/**
 * @module ol/reproj/DataTile
 */
import {ERROR_THRESHOLD} from './common.js';

import DataTile, {asArrayLike, asImageLike, toArray} from '../DataTile.js';
import EventType from '../events/EventType.js';
import TileState from '../TileState.js';
import Triangulation from './Triangulation.js';
import {
  calculateSourceExtentResolution,
  canvasPool,
  render as renderReprojected,
} from '../reproj.js';
import {clamp} from '../math.js';
import {createCanvasContext2D, releaseCanvas} from '../dom.js';
import {getArea, getIntersection} from '../extent.js';
import {listen, unlistenByKey} from '../events.js';

/**
 * @typedef {function(number, number, number, number) : import("../DataTile.js").default} TileGetter
 */

/**
 * @typedef {Object} Options
 * @property {import("../proj/Projection.js").default} sourceProj Source projection.
 * @property {import("../tilegrid/TileGrid.js").default} sourceTileGrid Source tile grid.
 * @property {import("../proj/Projection.js").default} targetProj Target projection.
 * @property {import("../tilegrid/TileGrid.js").default} targetTileGrid Target tile grid.
 * @property {import("../tilecoord.js").TileCoord} tileCoord Coordinate of the tile.
 * @property {import("../tilecoord.js").TileCoord} [wrappedTileCoord] Coordinate of the tile wrapped in X.
 * @property {number} pixelRatio Pixel ratio.
 * @property {number} gutter Gutter of the source tiles.
 * @property {TileGetter} getTileFunction Function returning source tiles (z, x, y, pixelRatio).
 * @property {boolean} [interpolate=false] Use interpolated values when resampling.  By default,
 * the nearest neighbor is used when resampling.
 * @property {number} [errorThreshold] Acceptable reprojection error (in px).
 * @property {number} [transition=250] A duration for tile opacity
 * transitions in milliseconds. A duration of 0 disables the opacity transition.
 */

/**
 * @classdesc
 * Class encapsulating single reprojected data tile.
 * See {@link module:ol/source/DataTile~DataTileSource}.
 *
 */
class ReprojDataTile extends DataTile {
  /**
   * @param {Options} options Tile options.
   */
  constructor(options) {
    super({
      tileCoord: options.tileCoord,
      loader: () => Promise.resolve(new Uint8Array(4)),
      interpolate: options.interpolate,
      transition: options.transition,
    });

    /**
     * @private
     * @type {number}
     */
    this.pixelRatio_ = options.pixelRatio;

    /**
     * @private
     * @type {number}
     */
    this.gutter_ = options.gutter;

    /**
     * @type {import("../DataTile.js").Data}
     * @private
     */
    this.reprojData_ = null;

    /**
     * @type {Error}
     * @private
     */
    this.reprojError_ = null;

    /**
     * @type {import('../size.js').Size}
     * @private
     */
    this.reprojSize_ = undefined;

    /**
     * @private
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    this.sourceTileGrid_ = options.sourceTileGrid;

    /**
     * @private
     * @type {import("../tilegrid/TileGrid.js").default}
     */
    this.targetTileGrid_ = options.targetTileGrid;

    /**
     * @private
     * @type {import("../tilecoord.js").TileCoord}
     */
    this.wrappedTileCoord_ = options.wrappedTileCoord || options.tileCoord;

    /**
     * @private
     * @type {!Array<DataTile>}
     */
    this.sourceTiles_ = [];

    /**
     * @private
     * @type {?Array<import("../events.js").EventsKey>}
     */
    this.sourcesListenerKeys_ = null;

    /**
     * @private
     * @type {number}
     */
    this.sourceZ_ = 0;

    const targetExtent = this.targetTileGrid_.getTileCoordExtent(
      this.wrappedTileCoord_
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

    const sourceProj = options.sourceProj;
    const sourceProjExtent = sourceProj.getExtent();
    if (sourceProjExtent) {
      if (!maxSourceExtent) {
        maxSourceExtent = sourceProjExtent;
      } else {
        maxSourceExtent = getIntersection(maxSourceExtent, sourceProjExtent);
      }
    }

    const targetResolution = this.targetTileGrid_.getResolution(
      this.wrappedTileCoord_[0]
    );

    const targetProj = options.targetProj;
    const sourceResolution = calculateSourceExtentResolution(
      sourceProj,
      targetProj,
      limitedTargetExtent,
      targetResolution
    );

    if (!isFinite(sourceResolution) || sourceResolution <= 0) {
      // invalid sourceResolution -> EMPTY
      // probably edges of the projections when no extent is defined
      this.state = TileState.EMPTY;
      return;
    }

    const errorThresholdInPixels =
      options.errorThreshold !== undefined
        ? options.errorThreshold
        : ERROR_THRESHOLD;

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
      targetResolution
    );

    if (this.triangulation_.getTriangles().length === 0) {
      // no valid triangles -> EMPTY
      this.state = TileState.EMPTY;
      return;
    }

    this.sourceZ_ = this.sourceTileGrid_.getZForResolution(sourceResolution);
    let sourceExtent = this.triangulation_.calculateSourceExtent();

    if (maxSourceExtent) {
      if (sourceProj.canWrapX()) {
        sourceExtent[1] = clamp(
          sourceExtent[1],
          maxSourceExtent[1],
          maxSourceExtent[3]
        );
        sourceExtent[3] = clamp(
          sourceExtent[3],
          maxSourceExtent[1],
          maxSourceExtent[3]
        );
      } else {
        sourceExtent = getIntersection(sourceExtent, maxSourceExtent);
      }
    }

    if (!getArea(sourceExtent)) {
      this.state = TileState.EMPTY;
    } else {
      const sourceRange = this.sourceTileGrid_.getTileRangeForExtentAndZ(
        sourceExtent,
        this.sourceZ_
      );
      const getTile = options.getTileFunction;
      for (let srcX = sourceRange.minX; srcX <= sourceRange.maxX; srcX++) {
        for (let srcY = sourceRange.minY; srcY <= sourceRange.maxY; srcY++) {
          const tile = getTile(this.sourceZ_, srcX, srcY, this.pixelRatio_);
          if (tile) {
            this.sourceTiles_.push(tile);
          }
        }
      }

      if (this.sourceTiles_.length === 0) {
        this.state = TileState.EMPTY;
      }
    }
  }

  /**
   * Get the tile size.
   * @return {import('../size.js').Size} Tile size.
   */
  getSize() {
    return this.reprojSize_;
  }

  /**
   * Get the data for the tile.
   * @return {import("../DataTile.js").Data} Tile data.
   */
  getData() {
    return this.reprojData_;
  }

  /**
   * Get any loading error.
   * @return {Error} Loading error.
   */
  getError() {
    return this.reprojError_;
  }

  /**
   * @private
   */
  reproject_() {
    const dataSources = [];
    this.sourceTiles_.forEach((tile) => {
      if (!tile || tile.getState() !== TileState.LOADED) {
        return;
      }
      const size = tile.getSize();
      const gutter = this.gutter_;
      /**
       * @type {import("../DataTile.js").ArrayLike}
       */
      let tileData;
      const arrayData = asArrayLike(tile.getData());
      if (arrayData) {
        tileData = arrayData;
      } else {
        tileData = toArray(asImageLike(tile.getData()));
      }
      const pixelSize = [size[0] + 2 * gutter, size[1] + 2 * gutter];
      const isFloat = tileData instanceof Float32Array;
      const pixelCount = pixelSize[0] * pixelSize[1];
      const DataType = isFloat ? Float32Array : Uint8Array;
      const tileDataR = new DataType(tileData.buffer);
      const bytesPerElement = DataType.BYTES_PER_ELEMENT;
      const bytesPerPixel = (bytesPerElement * tileDataR.length) / pixelCount;
      const bytesPerRow = tileDataR.byteLength / pixelSize[1];
      const bandCount = Math.floor(
        bytesPerRow / bytesPerElement / pixelSize[0]
      );
      const packedLength = pixelCount * bandCount;
      let packedData = tileDataR;
      if (tileDataR.length !== packedLength) {
        packedData = new DataType(packedLength);
        let dataIndex = 0;
        let rowOffset = 0;
        const colCount = pixelSize[0] * bandCount;
        for (let rowIndex = 0; rowIndex < pixelSize[1]; ++rowIndex) {
          for (let colIndex = 0; colIndex < colCount; ++colIndex) {
            packedData[dataIndex++] = tileDataR[rowOffset + colIndex];
          }
          rowOffset += bytesPerRow / bytesPerElement;
        }
      }
      dataSources.push({
        extent: this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord),
        data: new Uint8Array(packedData.buffer),
        dataType: DataType,
        bytesPerPixel: bytesPerPixel,
        pixelSize: pixelSize,
      });
    });
    this.sourceTiles_.length = 0;

    if (dataSources.length === 0) {
      this.state = TileState.ERROR;
    } else {
      const z = this.wrappedTileCoord_[0];
      const size = this.targetTileGrid_.getTileSize(z);
      const targetWidth = typeof size === 'number' ? size : size[0];
      const targetHeight = typeof size === 'number' ? size : size[1];
      const targetResolution = this.targetTileGrid_.getResolution(z);
      const sourceResolution = this.sourceTileGrid_.getResolution(
        this.sourceZ_
      );

      const targetExtent = this.targetTileGrid_.getTileCoordExtent(
        this.wrappedTileCoord_
      );

      let dataR, dataU;

      const bytesPerPixel = dataSources[0].bytesPerPixel;

      const reprojs = Math.ceil(bytesPerPixel / 3);
      for (let reproj = reprojs - 1; reproj >= 0; --reproj) {
        const sources = [];
        for (let i = 0, len = dataSources.length; i < len; ++i) {
          const dataSource = dataSources[i];
          const buffer = dataSource.data;
          const pixelSize = dataSource.pixelSize;
          const width = pixelSize[0];
          const height = pixelSize[1];
          const context = createCanvasContext2D(width, height, canvasPool);
          const imageData = context.createImageData(width, height);
          const data = imageData.data;
          let offset = reproj * 3;
          for (let j = 0, len = data.length; j < len; j += 4) {
            data[j] = buffer[offset];
            data[j + 1] = buffer[offset + 1];
            data[j + 2] = buffer[offset + 2];
            data[j + 3] = 255;
            offset += bytesPerPixel;
          }
          context.putImageData(imageData, 0, 0);
          sources.push({
            extent: dataSource.extent,
            image: context.canvas,
          });
        }

        const canvas = renderReprojected(
          targetWidth,
          targetHeight,
          this.pixelRatio_,
          sourceResolution,
          this.sourceTileGrid_.getExtent(),
          targetResolution,
          targetExtent,
          this.triangulation_,
          sources,
          this.gutter_,
          false,
          false
        );

        for (let i = 0, len = sources.length; i < len; ++i) {
          const canvas = sources[i].image;
          const context = canvas.getContext('2d');
          releaseCanvas(context);
          canvasPool.push(context.canvas);
        }

        const context = canvas.getContext('2d');
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        releaseCanvas(context);
        canvasPool.push(canvas);

        if (!dataR) {
          dataU = new Uint8Array(
            bytesPerPixel * imageData.width * imageData.height
          );
          dataR = new dataSources[0].dataType(dataU.buffer);
        }

        const data = imageData.data;
        let offset = reproj * 3;
        for (let i = 0, len = data.length; i < len; i += 4) {
          if (data[i + 3] === 255) {
            dataU[offset] = data[i];
            dataU[offset + 1] = data[i + 1];
            dataU[offset + 2] = data[i + 2];
          } else {
            dataU[offset] = 0;
            dataU[offset + 1] = 0;
            dataU[offset + 2] = 0;
          }
          offset += bytesPerPixel;
        }
      }

      this.reprojData_ = dataR;
      this.reprojSize_ = [
        Math.round(targetWidth * this.pixelRatio_),
        Math.round(targetHeight * this.pixelRatio_),
      ];
      this.state = TileState.LOADED;
    }
    this.changed();
  }

  /**
   * Load not yet loaded URI.
   */
  load() {
    if (this.state !== TileState.IDLE && this.state !== TileState.ERROR) {
      return;
    }
    this.state = TileState.LOADING;
    this.changed();

    let leftToLoad = 0;

    this.sourcesListenerKeys_ = [];
    this.sourceTiles_.forEach((tile) => {
      const state = tile.getState();
      if (state !== TileState.IDLE && state !== TileState.LOADING) {
        return;
      }
      leftToLoad++;

      const sourceListenKey = listen(
        tile,
        EventType.CHANGE,
        function () {
          const state = tile.getState();
          if (
            state == TileState.LOADED ||
            state == TileState.ERROR ||
            state == TileState.EMPTY
          ) {
            unlistenByKey(sourceListenKey);
            leftToLoad--;
            if (leftToLoad === 0) {
              this.unlistenSources_();
              this.reproject_();
            }
          }
        },
        this
      );
      this.sourcesListenerKeys_.push(sourceListenKey);
    });

    if (leftToLoad === 0) {
      setTimeout(this.reproject_.bind(this), 0);
    } else {
      this.sourceTiles_.forEach(function (tile) {
        const state = tile.getState();
        if (state == TileState.IDLE) {
          tile.load();
        }
      });
    }
  }

  /**
   * @private
   */
  unlistenSources_() {
    this.sourcesListenerKeys_.forEach(unlistenByKey);
    this.sourcesListenerKeys_ = null;
  }
}

export default ReprojDataTile;
