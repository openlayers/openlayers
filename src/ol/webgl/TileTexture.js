/**
 * @module ol/webgl/TileTexture
 */

import BaseTileRepresentation from './BaseTileRepresentation.js';
import DataTile, {asArrayLike, asImageLike} from '../DataTile.js';
import ImageTile from '../ImageTile.js';
import ReprojTile from '../reproj/Tile.js';
import WebGLArrayBuffer from './Buffer.js';
import {ARRAY_BUFFER, STATIC_DRAW} from '../webgl.js';
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
     * @type {Array<number>}
     */
    this.bandCounts = [];

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
    this.helper.flushBufferData(coords);

    /**
     * @type {WebGLArrayBuffer}
     */
    this.coords = coords;

    this.setTile(options.tile);
  }

  /**
   * @override
   * @param {import("./Helper.js").default} helper The WebGL helper.
   */
  setHelper(helper) {
    const gl = this.helper?.getGL();
    if (gl) {
      this.helper.deleteBuffer(this.coords);
      for (let i = 0; i < this.textures.length; ++i) {
        gl.deleteTexture(this.textures[i]);
      }
    }

    super.setHelper(helper);

    if (helper) {
      helper.flushBufferData(this.coords);
    }
  }

  /**
   * @override
   */
  uploadTile() {
    this.textures.length = 0;
    this.bandCounts = [];

    const tile = this.tile;
    const helper = this.helper;
    const gl = helper.getGL();

    let slots;
    if (tile instanceof DataTile) {
      slots = tile.getSlots();
    } else {
      slots = 1;
    }

    for (let slot = 0; slot < slots; slot++) {
      /**
       * @type {import("../DataTile.js").Data}
       */
      let data;
      if (tile instanceof ImageTile || tile instanceof ReprojTile) {
        data = tile.getImage();
      } else {
        data = tile.getData(slot);
      }

      const image = asImageLike(data);
      if (image) {
        const texture = gl.createTexture();
        this.textures.push(texture);
        this.bandCounts.push(4);
        uploadImageTexture(gl, texture, image, tile.interpolate);
        continue;
      }

      data = asArrayLike(data);

      const sourceTileSize = /** @type {DataTile} */ (tile).getSize();
      const pixelSize = [
        sourceTileSize[0] + 2 * this.gutter,
        sourceTileSize[1] + 2 * this.gutter,
      ];
      const isFloat = data instanceof Float32Array;
      const pixelCount = pixelSize[0] * pixelSize[1];
      const DataType = isFloat ? Float32Array : Uint8Array;
      const bytesPerElement = DataType.BYTES_PER_ELEMENT;
      const bytesPerRow = data.byteLength / pixelSize[1];

      const bandCount = Math.floor(
        bytesPerRow / bytesPerElement / pixelSize[0],
      );
      const textureCount = Math.ceil(bandCount / 4);

      this.bandCounts.push(bandCount);

      if (textureCount === 1) {
        const texture = gl.createTexture();
        this.textures.push(texture);
        uploadDataTexture(
          helper,
          texture,
          data,
          pixelSize,
          bandCount,
          tile.interpolate,
        );
        continue;
      }

      const textureIndexBase = this.textures.length;
      const textureDataArrays = new Array(textureCount);
      for (let textureIndex = 0; textureIndex < textureCount; ++textureIndex) {
        const texture = gl.createTexture();
        this.textures.push(texture);

        const textureBandCount =
          textureIndex < textureCount - 1 ? 4 : ((bandCount - 1) % 4) + 1;
        textureDataArrays[textureIndex] = new DataType(
          pixelCount * textureBandCount,
        );
      }

      let dataIndex = 0;
      let rowOffset = 0;
      const colCount = pixelSize[0] * bandCount;
      for (let rowIndex = 0; rowIndex < pixelSize[1]; ++rowIndex) {
        for (let colIndex = 0; colIndex < colCount; ++colIndex) {
          const dataValue = data[rowOffset + colIndex];

          const pixelIndex = Math.floor(dataIndex / bandCount);
          const bandIndex = colIndex % bandCount;
          const textureIndex = Math.floor(bandIndex / 4);
          const textureData = textureDataArrays[textureIndex];
          const textureBandCount = textureData.length / pixelCount;
          const textureBandIndex = bandIndex % 4;
          textureData[pixelIndex * textureBandCount + textureBandIndex] =
            dataValue;

          ++dataIndex;
        }
        rowOffset += bytesPerRow / bytesPerElement;
      }

      for (let textureIndex = 0; textureIndex < textureCount; ++textureIndex) {
        const texture = this.textures[textureIndexBase + textureIndex];
        const textureData = textureDataArrays[textureIndex];
        const textureBandCount = textureData.length / pixelCount;
        uploadDataTexture(
          helper,
          texture,
          textureData,
          pixelSize,
          textureBandCount,
          tile.interpolate,
        );
      }
    }

    this.setReady();
  }

  /**
   * Get data for a pixel.  If the tile is not loaded, null is returned.
   * @param {number} renderCol The column index (in rendered tile space).
   * @param {number} renderRow The row index (in rendered tile space).
   * @return {Uint8ClampedArray|Float32Array|null} The data.
   */
  getPixelData(renderCol, renderRow) {
    if (!this.loaded) {
      return null;
    }

    return this.tile.getPixelDataAt(
      renderCol,
      renderRow,
      this.renderSize_,
      this.gutter,
    );
  }
}

export default TileTexture;
