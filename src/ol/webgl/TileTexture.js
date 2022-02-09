/**
 * @module ol/webgl/TileTexture
 */

import DataTile from '../DataTile.js';
import EventTarget from '../events/Target.js';
import EventType from '../events/EventType.js';
import ImageTile from '../ImageTile.js';
import ReprojTile from '../reproj/Tile.js';
import TileState from '../TileState.js';
import WebGLArrayBuffer from './Buffer.js';
import {ARRAY_BUFFER, STATIC_DRAW} from '../webgl.js';
import {IMAGE_SMOOTHING_DISABLED} from '../renderer/canvas/common.js';
import {assign} from '../obj.js';
import {createCanvasContext2D} from '../dom.js';
import {toSize} from '../size.js';

/**
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {WebGLTexture} texture The texture.
 * @param {boolean} interpolate Interpolate when resampling.
 */
function bindAndConfigure(gl, texture, interpolate) {
  const resampleFilter = interpolate ? gl.LINEAR : gl.NEAREST;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, resampleFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, resampleFilter);
}

/**
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {WebGLTexture} texture The texture.
 * @param {HTMLImageElement|HTMLCanvasElement|HTMLVideoElement} image The image.
 * @param {boolean} interpolate Interpolate when resampling.
 */
function uploadImageTexture(gl, texture, image, interpolate) {
  bindAndConfigure(gl, texture, interpolate);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

/**
 * @param {import("./Helper.js").default} helper The WebGL helper.
 * @param {WebGLTexture} texture The texture.
 * @param {import("../DataTile.js").Data} data The pixel data.
 * @param {import("../size.js").Size} size The pixel size.
 * @param {number} bandCount The band count.
 * @param {boolean} interpolate Interpolate when resampling.
 */
function uploadDataTexture(
  helper,
  texture,
  data,
  size,
  bandCount,
  interpolate
) {
  const gl = helper.getGL();
  bindAndConfigure(gl, texture, interpolate);

  const bytesPerRow = data.byteLength / size[1];
  let unpackAlignment = 1;
  if (bytesPerRow % 8 === 0) {
    unpackAlignment = 8;
  } else if (bytesPerRow % 4 === 0) {
    unpackAlignment = 4;
  } else if (bytesPerRow % 2 === 0) {
    unpackAlignment = 2;
  }

  let format;
  switch (bandCount) {
    case 1: {
      format = gl.LUMINANCE;
      break;
    }
    case 2: {
      format = gl.LUMINANCE_ALPHA;
      break;
    }
    case 3: {
      format = gl.RGB;
      break;
    }
    case 4: {
      format = gl.RGBA;
      break;
    }
    default: {
      throw new Error(`Unsupported number of bands: ${bandCount}`);
    }
  }

  let textureType;
  if (data instanceof Float32Array) {
    textureType = gl.FLOAT;
    helper.getExtension('OES_texture_float');
    helper.getExtension('OES_texture_float_linear');
  } else {
    textureType = gl.UNSIGNED_BYTE;
  }

  const oldUnpackAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    format,
    size[0],
    size[1],
    0,
    format,
    textureType,
    data
  );
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, oldUnpackAlignment);
}

/**
 * @type {CanvasRenderingContext2D}
 */
let pixelContext = null;

function createPixelContext() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  pixelContext = canvas.getContext('2d');
}

/**
 * @typedef {import("../DataTile.js").default|ImageTile|ReprojTile} TileType
 */

/**
 * @typedef {Object} Options
 * @property {TileType} tile The tile.
 * @property {import("../tilegrid/TileGrid.js").default} grid Tile grid.
 * @property {import("../webgl/Helper.js").default} helper WebGL helper.
 * @property {number} [tilePixelRatio=1] Tile pixel ratio.
 * @property {number} [gutter=0] The size in pixels of the gutter around image tiles to ignore.
 */

class TileTexture extends EventTarget {
  /**
   * @param {Options} options The tile texture options.
   */
  constructor(options) {
    super();

    /**
     * @type {TileType}
     */
    this.tile;

    /**
     * @type {Array<WebGLTexture>}
     */
    this.textures = [];
    this.handleTileChange_ = this.handleTileChange_.bind(this);

    /**
     * @type {import("../size.js").Size}
     */
    this.size = toSize(options.grid.getTileSize(options.tile.tileCoord[0]));

    /**
     * @type {number}
     * @private
     */
    this.tilePixelRatio_ = options.tilePixelRatio || 1;

    /**
     * @type {number}
     * @private
     */
    this.gutter_ = options.gutter || 0;

    /**
     * @type {number}
     */
    this.bandCount = NaN;

    /**
     * @type {import("../webgl/Helper.js").default}
     * @private
     */
    this.helper_ = options.helper;

    const coords = new WebGLArrayBuffer(ARRAY_BUFFER, STATIC_DRAW);
    coords.fromArray([
      0, // P0
      1,
      1, // P1
      1,
      1, // P2
      0,
      0, // P3
      0,
    ]);
    this.helper_.flushBufferData(coords);

    /**
     * @type {WebGLArrayBuffer}
     */
    this.coords = coords;

    this.setTile(options.tile);
  }

  /**
   * @param {TileType} tile Tile.
   */
  setTile(tile) {
    if (tile !== this.tile) {
      if (this.tile) {
        this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
      }
      this.tile = tile;
      this.textures.length = 0;
      this.loaded = tile.getState() === TileState.LOADED;
      if (this.loaded) {
        this.uploadTile_();
      } else {
        if (tile instanceof ImageTile) {
          const image = tile.getImage();
          if (image instanceof Image && !image.crossOrigin) {
            image.crossOrigin = 'anonymous';
          }
        }
        tile.addEventListener(EventType.CHANGE, this.handleTileChange_);
      }
    }
  }

  uploadTile_() {
    const helper = this.helper_;
    const gl = helper.getGL();
    const tile = this.tile;

    if (tile instanceof ImageTile || tile instanceof ReprojTile) {
      let image = tile.getImage();
      if (this.gutter_ !== 0) {
        const gutter = this.tilePixelRatio_ * this.gutter_;
        const width = Math.round(image.width - 2 * gutter);
        const height = Math.round(image.height - 2 * gutter);
        const context = createCanvasContext2D(width, height);
        if (!tile.interpolate) {
          assign(context, IMAGE_SMOOTHING_DISABLED);
        }
        context.drawImage(
          image,
          gutter,
          gutter,
          width,
          height,
          0,
          0,
          width,
          height
        );
        image = context.canvas;
      }
      const texture = gl.createTexture();
      this.textures.push(texture);
      this.bandCount = 4;
      uploadImageTexture(gl, texture, image, tile.interpolate);
      return;
    }

    const pixelSize = [
      this.size[0] * this.tilePixelRatio_,
      this.size[1] * this.tilePixelRatio_,
    ];
    const data = tile.getData();
    const isFloat = data instanceof Float32Array;
    const pixelCount = pixelSize[0] * pixelSize[1];
    const DataType = isFloat ? Float32Array : Uint8Array;
    const bytesPerElement = DataType.BYTES_PER_ELEMENT;
    const bytesPerRow = data.byteLength / pixelSize[1];

    this.bandCount = Math.floor(bytesPerRow / bytesPerElement / pixelSize[0]);
    const textureCount = Math.ceil(this.bandCount / 4);

    if (textureCount === 1) {
      const texture = gl.createTexture();
      this.textures.push(texture);
      uploadDataTexture(
        helper,
        texture,
        data,
        pixelSize,
        this.bandCount,
        tile.interpolate
      );
      return;
    }

    const textureDataArrays = new Array(textureCount);
    for (let textureIndex = 0; textureIndex < textureCount; ++textureIndex) {
      const texture = gl.createTexture();
      this.textures.push(texture);

      const bandCount =
        textureIndex < textureCount - 1 ? 4 : this.bandCount % 4;
      textureDataArrays[textureIndex] = new DataType(pixelCount * bandCount);
    }

    let dataIndex = 0;
    let rowOffset = 0;
    const colCount = pixelSize[0] * this.bandCount;
    for (let rowIndex = 0; rowIndex < pixelSize[1]; ++rowIndex) {
      for (let colIndex = 0; colIndex < colCount; ++colIndex) {
        const dataValue = data[rowOffset + colIndex];

        const pixelIndex = Math.floor(dataIndex / this.bandCount);
        const bandIndex = colIndex % this.bandCount;
        const textureIndex = Math.floor(bandIndex / 4);
        const textureData = textureDataArrays[textureIndex];
        const bandCount = textureData.length / pixelCount;
        const textureBandIndex = bandIndex % 4;
        textureData[pixelIndex * bandCount + textureBandIndex] = dataValue;

        ++dataIndex;
      }
      rowOffset += bytesPerRow / bytesPerElement;
    }

    for (let textureIndex = 0; textureIndex < textureCount; ++textureIndex) {
      const texture = this.textures[textureIndex];
      const textureData = textureDataArrays[textureIndex];
      const bandCount = textureData.length / pixelCount;
      uploadDataTexture(
        helper,
        texture,
        textureData,
        pixelSize,
        bandCount,
        tile.interpolate
      );
    }
  }

  handleTileChange_() {
    if (this.tile.getState() === TileState.LOADED) {
      this.loaded = true;
      this.uploadTile_();
      this.dispatchEvent(EventType.CHANGE);
    }
  }

  disposeInternal() {
    const gl = this.helper_.getGL();
    this.helper_.deleteBuffer(this.coords);
    for (let i = 0; i < this.textures.length; ++i) {
      gl.deleteTexture(this.textures[i]);
    }
    this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
  }

  /**
   * Get data for a pixel.  If the tile is not loaded, null is returned.
   * @param {number} col The column index.
   * @param {number} row The row index.
   * @return {import("../DataTile.js").Data|null} The data.
   */
  getPixelData(col, row) {
    if (!this.loaded) {
      return null;
    }

    col = Math.floor(this.tilePixelRatio_ * col);
    row = Math.floor(this.tilePixelRatio_ * row);

    if (this.tile instanceof DataTile) {
      const data = this.tile.getData();
      const pixelsPerRow = Math.floor(this.tilePixelRatio_ * this.size[0]);
      if (data instanceof DataView) {
        const bytesPerPixel = data.byteLength / (this.size[0] * this.size[1]);
        const offset = row * pixelsPerRow * bytesPerPixel + col * bytesPerPixel;
        const buffer = data.buffer.slice(offset, offset + bytesPerPixel);
        return new DataView(buffer);
      }

      const offset = row * pixelsPerRow * this.bandCount + col * this.bandCount;
      return data.slice(offset, offset + this.bandCount);
    }

    if (!pixelContext) {
      createPixelContext();
    }
    pixelContext.clearRect(0, 0, 1, 1);

    let data;
    const image = this.tile.getImage();
    try {
      pixelContext.drawImage(image, col, row, 1, 1, 0, 0, 1, 1);
      data = pixelContext.getImageData(0, 0, 1, 1).data;
    } catch (err) {
      return null;
    }
    return data;
  }
}

export default TileTexture;
