/**
 * @module ol/reproj/DataTile
 */

import DataTile, {asArrayLike, asImageLike, toArray} from '../DataTile.js';
import TileState from '../TileState.js';
import {createCanvasContext2D} from '../dom.js';
import EventType from '../events/EventType.js';
import {listen, unlistenByKey} from '../events.js';
import {getArea, getIntersection, getWidth, wrapAndSliceX} from '../extent.js';
import {clamp} from '../math.js';
import {calculateSourceExtentResolution} from '../reproj.js';
import Triangulation from './Triangulation.js';
import {ERROR_THRESHOLD} from './common.js';
import {
  canvasGLPool,
  createCanvasContextWebGL,
  releaseGLCanvas,
  render as renderReprojected,
} from './glreproj.js';

/**
 * @typedef {function(number, number, number, number) : import("../DataTile.js").default} TileGetter
 */

/**
 * @typedef {Object} TileOffset
 * @property {DataTile} tile Tile.
 * @property {number} offset Offset.
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
 * @property {import("../transform.js").Transform} [transformMatrix] Source transform matrix.
 * @property {boolean} [renderEdges] Render reprojection edges.
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
      loader: () => Promise.resolve(new Uint8ClampedArray(4)),
      interpolate: options.interpolate,
      transition: options.transition,
    });

    /**
     * @private
     * @type {boolean | Array<number>}
     */
    this.renderEdges_ =
      options.renderEdges !== undefined ? options.renderEdges : false;

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
     * @type {!Array<TileOffset>}
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

    const sourceProj = options.sourceProj;
    const sourceProjExtent = sourceProj.getExtent();
    const sourceTileGridExtent = options.sourceTileGrid.getExtent();

    /**
     * @private
     * @type {import("../extent.js").Extent}
     */
    this.clipExtent_ = sourceProj.canWrapX()
      ? sourceTileGridExtent
        ? getIntersection(sourceProjExtent, sourceTileGridExtent)
        : sourceProjExtent
      : sourceTileGridExtent;

    const targetExtent = this.targetTileGrid_.getTileCoordExtent(
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

    if (sourceProjExtent) {
      if (!maxSourceExtent) {
        maxSourceExtent = sourceProjExtent;
      } else {
        maxSourceExtent = getIntersection(maxSourceExtent, sourceProjExtent);
      }
    }

    const targetResolution = this.targetTileGrid_.getResolution(
      this.wrappedTileCoord_[0],
    );

    const targetProj = options.targetProj;
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
      targetResolution,
      options.transformMatrix,
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
        const sourceRange = this.sourceTileGrid_.getTileRangeForExtentAndZ(
          extent,
          this.sourceZ_,
        );
        const getTile = options.getTileFunction;
        for (let srcX = sourceRange.minX; srcX <= sourceRange.maxX; srcX++) {
          for (let srcY = sourceRange.minY; srcY <= sourceRange.maxY; srcY++) {
            const tile = getTile(this.sourceZ_, srcX, srcY, this.pixelRatio_);
            if (tile) {
              const offset = worldsAway * worldWidth;
              this.sourceTiles_.push({tile, offset});
            }
          }
        }
        ++worldsAway;
      });

      if (this.sourceTiles_.length === 0) {
        this.state = TileState.EMPTY;
      }
    }
  }

  /**
   * Get the tile size.
   * @return {import('../size.js').Size} Tile size.
   * @override
   */
  getSize() {
    return this.reprojSize_;
  }

  /**
   * Get the data for the tile.
   * @return {import("../DataTile.js").Data} Tile data.
   * @override
   */
  getData() {
    return this.reprojData_;
  }

  /**
   * Get any loading error.
   * @return {Error} Loading error.
   * @override
   */
  getError() {
    return this.reprojError_;
  }

  /**
   * @private
   */
  reproject_() {
    const dataSources = [];
    let imageLike = false;
    this.sourceTiles_.forEach((source) => {
      const tile = source.tile;
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
        imageLike = true;
        tileData = toArray(asImageLike(tile.getData()));
      }
      const pixelSize = [size[0] + 2 * gutter, size[1] + 2 * gutter];
      const isFloat = tileData instanceof Float32Array;
      const pixelCount = pixelSize[0] * pixelSize[1];
      const DataType = isFloat ? Float32Array : Uint8ClampedArray;
      const tileDataR = new DataType(tileData.buffer);
      const bytesPerElement = DataType.BYTES_PER_ELEMENT;
      const bytesPerPixel = (bytesPerElement * tileDataR.length) / pixelCount;
      const bytesPerRow = tileDataR.byteLength / pixelSize[1];
      const bandCount = Math.floor(
        bytesPerRow / bytesPerElement / pixelSize[0],
      );
      const extent = this.sourceTileGrid_.getTileCoordExtent(tile.tileCoord);
      extent[0] += source.offset;
      extent[2] += source.offset;
      const clipExtent = this.clipExtent_?.slice();
      if (clipExtent) {
        clipExtent[0] += source.offset;
        clipExtent[2] += source.offset;
      }
      dataSources.push({
        extent: extent,
        clipExtent: clipExtent,
        data: tileDataR,
        dataType: DataType,
        bytesPerPixel: bytesPerPixel,
        pixelSize: pixelSize,
        bandCount: bandCount,
      });
    });
    this.sourceTiles_.length = 0;

    if (dataSources.length === 0) {
      this.state = TileState.ERROR;
      this.changed();
      return;
    }

    const z = this.wrappedTileCoord_[0];
    const size = this.targetTileGrid_.getTileSize(z);
    const targetWidth = typeof size === 'number' ? size : size[0];
    const targetHeight = typeof size === 'number' ? size : size[1];
    const outWidth = targetWidth * this.pixelRatio_;
    const outHeight = targetHeight * this.pixelRatio_;
    const targetResolution = this.targetTileGrid_.getResolution(z);
    const sourceResolution = this.sourceTileGrid_.getResolution(this.sourceZ_);

    const targetExtent = this.targetTileGrid_.getTileCoordExtent(
      this.wrappedTileCoord_,
    );

    const bandCount = dataSources[0].bandCount;
    const dataR = new dataSources[0].dataType(bandCount * outWidth * outHeight);

    const gl = createCanvasContextWebGL(outWidth, outHeight, canvasGLPool, {
      premultipliedAlpha: false,
      antialias: false,
    });

    let willInterpolate;
    const format = gl.RGBA;
    let textureType;
    if (dataSources[0].dataType == Float32Array) {
      textureType = gl.FLOAT;
      gl.getExtension('WEBGL_color_buffer_float');
      gl.getExtension('OES_texture_float');
      gl.getExtension('EXT_float_blend');
      const extension = gl.getExtension('OES_texture_float_linear');
      const canInterpolate = extension !== null;
      willInterpolate = canInterpolate && this.interpolate;
    } else {
      textureType = gl.UNSIGNED_BYTE;
      willInterpolate = this.interpolate;
    }

    const BANDS_PR_REPROJ = 4;
    const reprojs = Math.ceil(bandCount / BANDS_PR_REPROJ);
    for (let reproj = reprojs - 1; reproj >= 0; --reproj) {
      const sources = [];
      for (let i = 0, len = dataSources.length; i < len; ++i) {
        const dataSource = dataSources[i];

        const pixelSize = dataSource.pixelSize;
        const width = pixelSize[0];
        const height = pixelSize[1];

        const data = new dataSource.dataType(BANDS_PR_REPROJ * width * height);
        const dataS = dataSource.data;
        let offset = reproj * BANDS_PR_REPROJ;
        for (let j = 0, len = data.length; j < len; j += BANDS_PR_REPROJ) {
          data[j] = dataS[offset];
          data[j + 1] = dataS[offset + 1];
          data[j + 2] = dataS[offset + 2];
          data[j + 3] = dataS[offset + 3];
          offset += bandCount;
        }

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        if (willInterpolate) {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        } else {
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          format,
          width,
          height,
          0,
          format,
          textureType,
          data,
        );

        sources.push({
          extent: dataSource.extent,
          clipExtent: dataSource.clipExtent,
          texture: texture,
          width: width,
          height: height,
        });
      }

      const {framebuffer, width, height} = renderReprojected(
        gl,
        targetWidth,
        targetHeight,
        this.pixelRatio_,
        sourceResolution,
        targetResolution,
        targetExtent,
        this.triangulation_,
        sources,
        this.gutter_,
        textureType,
        this.renderEdges_,
        willInterpolate,
      );

      // The texture is always RGBA.
      const rows = width;
      const cols = height * BANDS_PR_REPROJ;
      const data = new dataSources[0].dataType(rows * cols);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.readPixels(0, 0, width, height, gl.RGBA, textureType, data);

      let offset = reproj * BANDS_PR_REPROJ;
      for (let i = 0, len = data.length; i < len; i += BANDS_PR_REPROJ) {
        // The data read by `readPixels` is flipped in the y-axis so flip it again.
        const flipY = (rows - 1 - ((i / cols) | 0)) * cols + (i % cols);
        dataR[offset] = data[flipY];
        dataR[offset + 1] = data[flipY + 1];
        dataR[offset + 2] = data[flipY + 2];
        dataR[offset + 3] = data[flipY + 3];
        offset += bandCount;
      }
    }

    releaseGLCanvas(gl);
    canvasGLPool.push(gl.canvas);

    if (imageLike) {
      const context = createCanvasContext2D(targetWidth, targetHeight);
      const imageData = new ImageData(dataR, targetWidth);
      context.putImageData(imageData, 0, 0);
      this.reprojData_ = context.canvas;
    } else {
      this.reprojData_ = dataR;
    }
    this.reprojSize_ = [Math.round(outWidth), Math.round(outHeight)];
    this.state = TileState.LOADED;
    this.changed();
  }

  /**
   * Load not yet loaded URI.
   * @override
   */
  load() {
    if (this.state !== TileState.IDLE && this.state !== TileState.ERROR) {
      return;
    }
    this.state = TileState.LOADING;
    this.changed();

    let leftToLoad = 0;

    this.sourcesListenerKeys_ = [];
    this.sourceTiles_.forEach(({tile}) => {
      const state = tile.getState();
      if (state !== TileState.IDLE && state !== TileState.LOADING) {
        return;
      }
      leftToLoad++;

      const sourceListenKey = listen(tile, EventType.CHANGE, () => {
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
      });
      this.sourcesListenerKeys_.push(sourceListenKey);
    });

    if (leftToLoad === 0) {
      setTimeout(this.reproject_.bind(this), 0);
    } else {
      this.sourceTiles_.forEach(function ({tile}) {
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
