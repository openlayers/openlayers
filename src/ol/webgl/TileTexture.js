/**
 * @module ol/webgl/TileTexture
 */

import BaseTileRepresentation from './BaseTileRepresentation.js';
import DataTile, {asArrayLike, asImageLike} from '../DataTile.js';
import EventType from '../events/EventType.js';
import ImageTile from '../ImageTile.js';
import ReprojTile from '../reproj/Tile.js';
import WebGLArrayBuffer from './Buffer.js';
import {ARRAY_BUFFER, STATIC_DRAW} from '../webgl.js';
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
 * @param {import("../DataTile.js").ImageLike} image The image.
 * @param {boolean} interpolate Interpolate when resampling.
 */
function uploadImageTexture(gl, texture, image, interpolate) {
  bindAndConfigure(gl, texture, interpolate);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}

/**
 * @param {import("./Helper.js").default} helper The WebGL helper.
 * @param {WebGLTexture} texture The texture.
 * @param {import("../DataTile.js").ArrayLike} data The pixel data.
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
  interpolate,
) {
  const gl = helper.getGL();
  let textureType;
  let canInterpolate;
  if (data instanceof Float32Array) {
    textureType = gl.FLOAT;
    helper.getExtension('OES_texture_float');
    const extension = helper.getExtension('OES_texture_float_linear');
    canInterpolate = extension !== null;
  } else {
    textureType = gl.UNSIGNED_BYTE;
    canInterpolate = true;
  }
  bindAndConfigure(gl, texture, interpolate && canInterpolate);

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
    data,
  );
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, oldUnpackAlignment);
}

/**
 * @type {CanvasRenderingContext2D}
 */
let pixelContext = null;

function createPixelContext() {
  pixelContext = createCanvasContext2D(1, 1, undefined, {
    willReadFrequently: true,
  });
}

/**
 * @typedef {import("../DataTile.js").default|ImageTile|ReprojTile} TileType
 */

/**
 * @extends {BaseTileRepresentation<TileType>}
 */
class TileTexture extends BaseTileRepresentation {
  /**
   * @param {import("./BaseTileRepresentation.js").TileRepresentationOptions<TileType>} options The tile texture options.
   */
  constructor(options) {
    super(options);

    /**
     * @type {Array<WebGLTexture>}
     */
    this.textures = [];

    /**
     * @type {import("../size.js").Size}
     * @private
     */
    this.renderSize_ = toSize(
      options.grid.getTileSize(options.tile.tileCoord[0]),
    );

    /**
     * @type {number}
     */
    this.bandCount = NaN;

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

  uploadTile() {
    const helper = this.helper_;
    const gl = helper.getGL();
    const tile = this.tile;

    this.textures.length = 0;

    /**
     * @type {import("../DataTile.js").Data}
     */
    let data;

    if (tile instanceof ImageTile || tile instanceof ReprojTile) {
      data = tile.getImage();
    } else {
      data = tile.getData();
    }

    const image = asImageLike(data);
    if (image) {
      const texture = gl.createTexture();
      this.textures.push(texture);
      this.bandCount = 4;
      uploadImageTexture(gl, texture, image, tile.interpolate);
      this.setReady();
      return;
    }

    data = asArrayLike(data);

    const sourceTileSize = /** @type {DataTile} */ (tile).getSize();
    const pixelSize = [
      sourceTileSize[0] + 2 * this.gutter_,
      sourceTileSize[1] + 2 * this.gutter_,
    ];
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
        tile.interpolate,
      );
      this.setReady();
      return;
    }

    const textureDataArrays = new Array(textureCount);
    for (let textureIndex = 0; textureIndex < textureCount; ++textureIndex) {
      const texture = gl.createTexture();
      this.textures.push(texture);

      const bandCount =
        textureIndex < textureCount - 1 ? 4 : ((this.bandCount - 1) % 4) + 1;
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
        tile.interpolate,
      );
    }

    this.setReady();
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
   * @param {import("../DataTile.js").ImageLike} image The image.
   * @param {number} renderCol The column index (in rendered tile space).
   * @param {number} renderRow The row index (in rendered tile space).
   * @return {Uint8ClampedArray|null} The data.
   * @private
   */
  getImagePixelData_(image, renderCol, renderRow) {
    const gutter = this.gutter_;
    const renderWidth = this.renderSize_[0];
    const renderHeight = this.renderSize_[1];

    if (!pixelContext) {
      createPixelContext();
    }
    pixelContext.clearRect(0, 0, 1, 1);

    const sourceWidth = image.width;
    const sourceHeight = image.height;

    const sourceWidthWithoutGutter = sourceWidth - 2 * gutter;
    const sourceHeightWithoutGutter = sourceHeight - 2 * gutter;

    const sourceCol =
      gutter + Math.floor(sourceWidthWithoutGutter * (renderCol / renderWidth));

    const sourceRow =
      gutter +
      Math.floor(sourceHeightWithoutGutter * (renderRow / renderHeight));

    let data;
    try {
      pixelContext.drawImage(image, sourceCol, sourceRow, 1, 1, 0, 0, 1, 1);
      data = pixelContext.getImageData(0, 0, 1, 1).data;
    } catch (err) {
      pixelContext = null;
      return null;
    }
    return data;
  }

  /**
   * @param {import("../DataTile.js").ArrayLike} data The data.
   * @param {import("../size.js").Size} sourceSize The size.
   * @param {number} renderCol The column index (in rendered tile space).
   * @param {number} renderRow The row index (in rendered tile space).
   * @return {import("../DataTile.js").ArrayLike|null} The data.
   * @private
   */
  getArrayPixelData_(data, sourceSize, renderCol, renderRow) {
    const gutter = this.gutter_;
    const renderWidth = this.renderSize_[0];
    const renderHeight = this.renderSize_[1];

    const sourceWidthWithoutGutter = sourceSize[0];
    const sourceHeightWithoutGutter = sourceSize[1];
    const sourceWidth = sourceWidthWithoutGutter + 2 * gutter;
    const sourceHeight = sourceHeightWithoutGutter + 2 * gutter;

    const sourceCol =
      gutter + Math.floor(sourceWidthWithoutGutter * (renderCol / renderWidth));

    const sourceRow =
      gutter +
      Math.floor(sourceHeightWithoutGutter * (renderRow / renderHeight));

    if (data instanceof DataView) {
      const bytesPerPixel = data.byteLength / (sourceWidth * sourceHeight);
      const offset = bytesPerPixel * (sourceRow * sourceWidth + sourceCol);
      const buffer = data.buffer.slice(offset, offset + bytesPerPixel);
      return new DataView(buffer);
    }

    const offset = this.bandCount * (sourceRow * sourceWidth + sourceCol);
    return data.slice(offset, offset + this.bandCount);
  }

  /**
   * Get data for a pixel.  If the tile is not loaded, null is returned.
   * @param {number} renderCol The column index (in rendered tile space).
   * @param {number} renderRow The row index (in rendered tile space).
   * @return {import("../DataTile.js").ArrayLike|null} The data.
   */
  getPixelData(renderCol, renderRow) {
    if (!this.loaded) {
      return null;
    }

    if (this.tile instanceof DataTile) {
      const data = this.tile.getData();
      const arrayData = asArrayLike(data);
      if (arrayData) {
        const sourceSize = this.tile.getSize();
        return this.getArrayPixelData_(
          arrayData,
          sourceSize,
          renderCol,
          renderRow,
        );
      }
      return this.getImagePixelData_(asImageLike(data), renderCol, renderRow);
    }

    return this.getImagePixelData_(this.tile.getImage(), renderCol, renderRow);
  }
}

export default TileTexture;
