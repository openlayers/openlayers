/**
 * @module ol/webgpu/TileTexture
 */
import DataTile, {asArrayLike, asImageLike} from '../DataTile.js';
import ImageTile from '../ImageTile.js';
import TileState from '../TileState.js';
import {createCanvasContext2D} from '../dom.js';
import EventType from '../events/EventType.js';
import EventTarget from '../events/Target.js';

/** @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D|null} */
let pixelContext = null;

function getPixelContext() {
  if (!pixelContext) {
    pixelContext = createCanvasContext2D(1, 1, undefined, {
      willReadFrequently: true,
    });
  }
  return pixelContext;
}

/**
 * Pack 3 or more source bands into RGBA. One- and two-band tiles are uploaded
 * in `r*` and `rg*` formats instead. Missing color channels stay 0 and a
 * missing alpha channel is opaque.
 * @param {Uint8Array|Uint8ClampedArray|Float32Array} array Interleaved samples.
 * @param {number} width Width.
 * @param {number} height Height.
 * @param {number} bands Source band count.
 * @return {Uint8Array|Uint8ClampedArray|Float32Array} RGBA samples.
 */
function expandToRgba(array, width, height, bands) {
  if (bands === 4) {
    return array;
  }
  const out = allocateLike(array, width * height * 4);
  const alpha = array instanceof Float32Array ? 1 : 255;
  const pixels = width * height;
  const used = Math.min(bands, 4);
  for (let i = 0; i < pixels; ++i) {
    const src = i * bands;
    const dst = i * 4;
    for (let b = 0; b < used; ++b) {
      out[dst + b] = array[src + b];
    }
    if (used < 4) {
      out[dst + 3] = alpha;
    }
  }
  return out;
}

/**
 * writeTexture requires bytesPerRow to be a multiple of 256.
 * @param {Uint8Array|Uint8ClampedArray|Float32Array} data Tightly packed rows.
 * @param {number} width Width.
 * @param {number} height Height.
 * @param {number} bytesPerPixel Bytes per pixel.
 * @return {{data: Uint8Array|Uint8ClampedArray|Float32Array, bytesPerRow: number}} Padded rows.
 */
function padRows(data, width, height, bytesPerPixel) {
  const unpadded = width * bytesPerPixel;
  const bytesPerRow = Math.ceil(unpadded / 256) * 256;
  if (bytesPerRow === unpadded) {
    return {data, bytesPerRow};
  }
  const bytes = data.BYTES_PER_ELEMENT;
  const srcStride = unpadded / bytes;
  const dstStride = bytesPerRow / bytes;
  const padded = allocateLike(data, dstStride * height);
  for (let y = 0; y < height; ++y) {
    padded.set(
      data.subarray(y * srcStride, y * srcStride + srcStride),
      y * dstStride,
    );
  }
  return {data: padded, bytesPerRow};
}

/**
 * Allocate a typed array of the same kind as `data`.
 * @param {Uint8Array|Uint8ClampedArray|Float32Array} data Sample array.
 * @param {number} length Element count.
 * @return {Uint8Array|Uint8ClampedArray|Float32Array} New array.
 */
function allocateLike(data, length) {
  if (data instanceof Float32Array) {
    return new Float32Array(length);
  }
  if (data instanceof Uint8ClampedArray) {
    return new Uint8ClampedArray(length);
  }
  return new Uint8Array(length);
}

/**
 * @typedef {Object} PackedTile
 * @property {Uint8Array|Uint8ClampedArray|Float32Array} data Samples to upload.
 * @property {'r8unorm'|'rg8unorm'|'rgba8unorm'|'r32float'|'rg32float'|'rgba32float'} format Texture format.
 * @property {number} bytesPerPixel Bytes per stored pixel.
 * @property {boolean} unfilterable True when the format cannot be sampled with a sampler.
 */

/**
 * One- and two-band tiles stay in `r*` and `rg*` formats. Sampled as vec4
 * they match an RGBA expansion (missing channels 0, alpha 1). Three or more
 * bands still use RGBA; WebGPU has no three-channel format.
 * @param {Uint8Array|Uint8ClampedArray|Float32Array} array Interleaved samples.
 * @param {number} width Width.
 * @param {number} height Height.
 * @param {number} bands Source band count.
 * @return {PackedTile} Upload description.
 */
export function packTileSamples(array, width, height, bands) {
  const floatData = array instanceof Float32Array;
  const narrow = bands === 1 || bands === 2;
  const storedBands = narrow ? bands : 4;
  /** @type {PackedTile['format']} */
  let format;
  if (bands === 1) {
    format = floatData ? 'r32float' : 'r8unorm';
  } else if (bands === 2) {
    format = floatData ? 'rg32float' : 'rg8unorm';
  } else {
    format = floatData ? 'rgba32float' : 'rgba8unorm';
  }
  return {
    data: narrow ? array : expandToRgba(array, width, height, bands),
    format,
    bytesPerPixel: (floatData ? 4 : 1) * storedBands,
    unfilterable: floatData,
  };
}

/**
 * @typedef {Object} Options
 * @property {import("../Tile.js").default} tile Tile.
 * @property {import("./Helper.js").default} helper Helper.
 * @property {number} [gutter=0] Gutter.
 */

/**
 * @classdesc
 * GPU texture representation of a raster tile.
 */
class TileTexture extends EventTarget {
  /**
   * @param {Options} options Options.
   */
  constructor(options) {
    super();

    /**
     * @type {import("../Tile.js").default}
     */
    this.tile;

    /**
     * @type {boolean}
     */
    this.ready = false;

    /**
     * @type {boolean}
     */
    this.loaded = false;

    /**
     * @type {GPUTexture|null}
     */
    this.texture = null;

    /**
     * @type {number}
     */
    this.bandCount = 4;

    /**
     * rgba32float tiles cannot be sampled with a filtering sampler.
     * @type {boolean}
     */
    this.unfilterable = false;

    /**
     * @protected
     * @type {import("./Helper.js").default}
     */
    this.helper = options.helper;

    /**
     * @protected
     * @type {number}
     */
    this.gutter = options.gutter || 0;

    /**
     * Uniform buffer, texture view, and bind groups reused across frames.
     * Dropped with the texture, and when a new device takes over.
     * @type {TileDrawResources|null}
     */
    this.drawResources_ = null;

    this.handleTileChange_ = this.handleTileChange_.bind(this);
    this.setTile(options.tile);
  }

  /**
   * Upload the tile image if it is loaded but has no GPU texture yet.
   */
  ensureUploaded() {
    if (this.loaded && !this.texture) {
      this.uploadTile();
    }
  }

  /**
   * @param {import("./Helper.js").default} helper Helper.
   */
  setHelper(helper) {
    this.releaseDrawResources_();
    this.helper = helper;
    if (this.loaded) {
      this.uploadTile();
    }
  }

  /**
   * Drop the uniform buffer and bind groups cached for this tile.
   * @private
   */
  releaseDrawResources_() {
    this.drawResources_?.dispose();
    this.drawResources_ = null;
  }

  /**
   * @param {import("../Tile.js").default} tile Tile.
   */
  setTile(tile) {
    if (tile === this.tile) {
      return;
    }
    if (this.tile) {
      this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
    }
    this.tile = tile;
    this.ready = false;
    this.loaded = tile.getState() === TileState.LOADED;
    if (this.loaded) {
      this.uploadTile();
    } else {
      if (this.texture) {
        this.texture.destroy();
        this.texture = null;
      }
      tile.addEventListener(EventType.CHANGE, this.handleTileChange_);
    }
  }

  /**
   * @private
   */
  handleTileChange_() {
    const state = this.tile.getState();
    if (state === TileState.LOADED) {
      this.loaded = true;
      this.uploadTile();
    } else if (state === TileState.ERROR || state === TileState.EMPTY) {
      this.ready = true;
      this.dispatchEvent(EventType.CHANGE);
    }
  }

  /**
   * @protected
   */
  uploadTile() {
    const helper = this.helper;
    if (!helper) {
      return;
    }
    const tile = this.tile;
    /** @type {import("../DataTile.js").Data|import("../DataTile.js").ImageLike|null} */
    let data = null;
    if (tile instanceof ImageTile) {
      data = tile.getImage();
    } else if (tile instanceof DataTile) {
      data = tile.getData();
    }
    if (!data) {
      return;
    }

    if (this.texture) {
      this.texture.destroy();
      this.texture = null;
    }

    const image = asImageLike(data);
    if (image) {
      this.texture = helper.createTextureFromImage(image, tile.interpolate);
      this.bandCount = 4;
      this.unfilterable = false;
      this.ready = true;
      this.dispatchEvent(EventType.CHANGE);
      return;
    }

    const array = asArrayLike(data);
    const floatData = array instanceof Float32Array;
    const byteData =
      array instanceof Uint8Array || array instanceof Uint8ClampedArray;
    if (!array || (!floatData && !byteData)) {
      return;
    }
    const size = tile instanceof DataTile ? tile.getSize() : [256, 256];
    const pixels = size[0] * size[1];
    const bands =
      pixels > 0 && array.length % pixels === 0 ? array.length / pixels : 4;
    this.bandCount = bands;
    const packed = packTileSamples(array, size[0], size[1], bands);
    const uploaded = padRows(
      packed.data,
      size[0],
      size[1],
      packed.bytesPerPixel,
    );
    const texture = helper.getDevice().createTexture({
      size: [size[0], size[1]],
      format: packed.format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    helper
      .getDevice()
      .queue.writeTexture(
        {texture},
        uploaded.data,
        {bytesPerRow: uploaded.bytesPerRow, rowsPerImage: size[1]},
        {width: size[0], height: size[1]},
      );
    this.texture = texture;
    this.unfilterable = packed.unfilterable;
    this.ready = true;
    this.dispatchEvent(EventType.CHANGE);
  }

  /**
   * Sample a pixel from the source tile (column/row in rendered tile space).
   *
   * @param {number} renderCol Column.
   * @param {number} renderRow Row.
   * @return {import("../DataTile.js").ArrayLike|null} Pixel values, or null.
   */
  getPixelData(renderCol, renderRow) {
    if (!this.loaded) {
      return null;
    }
    const col = Math.floor(renderCol);
    const row = Math.floor(renderRow);
    if (col < 0 || row < 0) {
      return null;
    }
    const tile = this.tile;
    if (tile instanceof DataTile) {
      const data = tile.getData();
      if (!data) {
        return null;
      }
      const arrayData = asArrayLike(data);
      if (arrayData) {
        const size = tile.getSize();
        const gutter = this.gutter;
        const width = size[0] + 2 * gutter;
        const sourceCol = gutter + col;
        const sourceRow = gutter + row;
        if (sourceCol >= width || sourceRow >= size[1] + 2 * gutter) {
          return null;
        }
        const bands = this.bandCount;
        const offset = bands * (sourceRow * width + sourceCol);
        if (arrayData instanceof DataView) {
          const height = size[1] + 2 * gutter;
          const bytesPerPixel = arrayData.byteLength / (width * height);
          const byteOffset = bytesPerPixel * (sourceRow * width + sourceCol);
          return new DataView(
            arrayData.buffer.slice(byteOffset, byteOffset + bytesPerPixel),
          );
        }
        if (offset + bands > arrayData.length) {
          return null;
        }
        return arrayData.slice(offset, offset + bands);
      }
      const image = asImageLike(data);
      if (!image) {
        return null;
      }
      return this.getImagePixelData_(image, col, row);
    }
    if (tile instanceof ImageTile) {
      const image = tile.getImage();
      if (!image) {
        return null;
      }
      return this.getImagePixelData_(image, col, row);
    }
    return null;
  }

  /**
   * @param {import("../DataTile.js").ImageLike} image Image.
   * @param {number} col Column.
   * @param {number} row Row.
   * @return {Uint8ClampedArray|null} RGBA.
   * @private
   */
  getImagePixelData_(image, col, row) {
    const context = getPixelContext();
    const gutter = this.gutter;
    try {
      context.clearRect(0, 0, 1, 1);
      context.drawImage(image, gutter + col, gutter + row, 1, 1, 0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data;
    } catch {
      pixelContext = null;
      return null;
    }
  }

  /**
   * @override
   */
  disposeInternal() {
    if (this.tile) {
      this.tile.removeEventListener(EventType.CHANGE, this.handleTileChange_);
    }
    this.releaseDrawResources_();
    if (this.texture) {
      this.texture.destroy();
      this.texture = null;
    }
    super.disposeInternal();
  }
}

/**
 * GPU state one tile draw reuses while its texture and pipeline stay valid.
 */
export class TileDrawResources {
  /**
   * @param {import("./Helper.js").default} helper Helper that owns the device.
   */
  constructor(helper) {
    /**
     * @type {import("./Helper.js").default}
     */
    this.helper = helper;

    /**
     * @type {GPUBuffer|null}
     */
    this.buffer = null;

    /**
     * @type {number}
     */
    this.size = 0;

    /**
     * @type {GPUTextureView|null}
     */
    this.view = null;

    /**
     * @type {GPUTexture|null}
     */
    this.viewTexture = null;

    /**
     * @type {Map<GPURenderPipeline, GPUBindGroup>}
     */
    this.groups = new Map();

    /**
     * @type {number}
     */
    this.styleGeneration = -1;
  }

  /**
   * Destroy the uniform buffer. Bind groups and views die with their texture.
   */
  dispose() {
    this.buffer?.destroy();
    this.buffer = null;
    this.view = null;
    this.viewTexture = null;
    this.groups.clear();
  }
}

export default TileTexture;
