/**
 * @module ol/webgpu/ImageAtlas
 */
import {createCanvasContext2D} from '../dom.js';
import {getUid} from '../util.js';

/**
 * @typedef {Object} ImageAtlasEntry
 * @property {number} texX0 Left atlas texel.
 * @property {number} texY0 Top atlas texel.
 * @property {number} texX1 Right atlas texel.
 * @property {number} texY1 Bottom atlas texel.
 */

/**
 * A sprite rectangle waiting to be copied to the texture.
 * @typedef {Object} PendingImage
 * @property {GPUCopyExternalImageSource} source Source.
 * @property {number} sourceX Left source pixel.
 * @property {number} sourceY Top source pixel.
 * @property {number} x Left atlas texel.
 * @property {number} y Top atlas texel.
 * @property {number} width Width.
 * @property {number} height Height.
 */

/**
 * The atlas starts at this size and doubles as images arrive.
 * @type {number}
 */
const INITIAL_SIZE = 512;

/**
 * The atlas starts over instead of growing past this size.
 * @type {number}
 */
const MAX_SIZE = 4096;

/**
 * Larger images are scaled down to this size, so every image fits.
 * @type {number}
 */
const MAX_CELL_SIZE = MAX_SIZE - 2;

/**
 * Returned for an image that does not fit, so nothing is drawn for it.
 * @type {ImageAtlasEntry}
 */
const EMPTY_ENTRY = {texX0: 0, texY0: 0, texX1: 0, texY1: 0};

/**
 * @param {import("../DataTile.js").ImageLike} image Image.
 * @return {Array<number>} Width and height in pixels.
 */
function getImageSize(image) {
  if (image instanceof HTMLImageElement) {
    return [image.naturalWidth, image.naturalHeight];
  }
  if (image instanceof HTMLVideoElement) {
    return [image.videoWidth, image.videoHeight];
  }
  return [image.width, image.height];
}

/**
 * Shelf-packed full-color atlas for image styles. The atlas exists only on
 * the GPU: new sprite rectangles are copied from their images to the texture.
 * The texture is replaced only when the atlas grows, by a copy on the GPU.
 * The atlas grows up to 4096 and is then full, so its user has to start it
 * over. That ceiling keeps it to 64 MiB of texture per layer, which is what
 * mobile devices can afford. Images larger than that are scaled down.
 */
class ImageAtlas {
  constructor() {
    /**
     * @private
     * @type {number}
     */
    this.size_ = INITIAL_SIZE;

    /**
     * An image did not fit.
     * @private
     * @type {boolean}
     */
    this.full_ = false;

    /**
     * @private
     * @type {number}
     */
    this.shelfX_ = 1;

    /**
     * @private
     * @type {number}
     */
    this.shelfY_ = 1;

    /**
     * @private
     * @type {number}
     */
    this.shelfHeight_ = 0;

    /**
     * @private
     * @type {Map<string, ImageAtlasEntry>}
     */
    this.entries_ = new Map();

    /**
     * Rectangles added since the last upload.
     * @private
     * @type {Array<PendingImage>}
     */
    this.pending_ = [];

    /**
     * @private
     * @type {GPUTexture|null}
     */
    this.texture_ = null;

    /**
     * Texels taken by the entries.
     * @private
     * @type {number}
     */
    this.allocatedArea_ = 0;

    /**
     * Incremented by `clear()`, after which no earlier entry is valid.
     * @private
     * @type {number}
     */
    this.generation_ = 0;

    /**
     * Textures of generations that started over, kept until the batches that
     * sample them have been rebuilt.
     * @private
     * @type {Map<number, GPUTexture>}
     */
    this.retained_ = new Map();
  }

  /**
   * Add an image-style sprite rectangle.
   *
   * @param {import("../render/ImageStyle.js").ImageStyleData} data Image data.
   * @return {ImageAtlasEntry} Atlas entry, empty when the atlas is full. Its
   * size is smaller than the source rectangle when the image was scaled down.
   */
  add(data) {
    const key = `${getUid(data.image)}/${data.sourceX}/${data.sourceY}/${data.sourceWidth}/${data.sourceHeight}`;
    const existing = this.entries_.get(key);
    if (existing) {
      return existing;
    }
    let width = Math.max(1, Math.ceil(data.sourceWidth));
    let height = Math.max(1, Math.ceil(data.sourceHeight));
    const scale = MAX_CELL_SIZE / Math.max(width, height);
    if (scale < 1) {
      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));
    }
    if (!this.fit_(width, height)) {
      this.full_ = true;
      return EMPTY_ENTRY;
    }
    const x = this.shelfX_;
    const y = this.shelfY_;
    this.pending_.push({...this.getSource_(data, width, height), x, y});
    const entry = {
      texX0: x,
      texY0: y,
      texX1: x + width,
      texY1: y + height,
    };
    this.entries_.set(key, entry);
    this.allocatedArea_ += width * height;
    this.shelfX_ += width + 1;
    this.shelfHeight_ = Math.max(this.shelfHeight_, height);
    return entry;
  }

  /**
   * Whole-pixel rectangles inside the image are copied from the image itself.
   * Others are drawn to a canvas of the cell size, which scales and clips them.
   * @param {import("../render/ImageStyle.js").ImageStyleData} data Image data.
   * @param {number} width Cell width.
   * @param {number} height Cell height.
   * @return {Omit<PendingImage, 'x'|'y'>} Copy source.
   * @private
   */
  getSource_(data, width, height) {
    const image = data.image;
    const [imageWidth, imageHeight] = getImageSize(image);
    const {sourceX, sourceY} = data;
    if (
      Number.isInteger(sourceX) &&
      Number.isInteger(sourceY) &&
      data.sourceWidth === width &&
      data.sourceHeight === height &&
      sourceX >= 0 &&
      sourceY >= 0 &&
      sourceX + width <= imageWidth &&
      sourceY + height <= imageHeight
    ) {
      return {source: image, sourceX, sourceY, width, height};
    }
    const context = createCanvasContext2D(width, height);
    context.drawImage(
      /** @type {CanvasImageSource} */ (image),
      sourceX,
      sourceY,
      data.sourceWidth,
      data.sourceHeight,
      0,
      0,
      width,
      height,
    );
    return {source: context.canvas, sourceX: 0, sourceY: 0, width, height};
  }

  /**
   * @param {number} width Cell width.
   * @param {number} height Cell height.
   * @return {boolean} There is room for the cell, after growing if needed.
   * @private
   */
  fit_(width, height) {
    if (width + 2 > this.size_ || height + 2 > this.size_) {
      this.grow_(Math.max(width + 2, height + 2));
    }
    if (this.shelfX_ + width + 1 > this.size_) {
      this.shelfY_ += this.shelfHeight_ + 1;
      this.shelfX_ = 1;
      this.shelfHeight_ = 0;
    }
    if (this.shelfY_ + height + 1 <= this.size_) {
      return true;
    }
    if (this.size_ * 2 > MAX_SIZE) {
      return false;
    }
    this.grow_(this.size_ + 1);
    return this.fit_(width, height);
  }

  /**
   * @param {number} minimum Minimum new size.
   * @private
   */
  grow_(minimum) {
    let next = this.size_ * 2;
    while (next < minimum) {
      next *= 2;
    }
    this.size_ = next;
  }

  /**
   * Copy new rectangles to the texture. The texture is replaced only when the
   * atlas grew.
   * @param {import("./Helper.js").default} helper Helper.
   * @return {GPUTexture} Texture.
   */
  upload(helper) {
    const device = helper.getDevice();
    if (this.texture_?.width !== this.size_) {
      this.replaceTexture_(device);
    }
    const texture = /** @type {GPUTexture} */ (this.texture_);
    for (const pending of this.pending_) {
      device.queue.copyExternalImageToTexture(
        {
          source: pending.source,
          origin: {x: pending.sourceX, y: pending.sourceY},
        },
        {
          texture,
          origin: {x: pending.x, y: pending.y},
          premultipliedAlpha: false,
        },
        [pending.width, pending.height],
      );
    }
    this.pending_ = [];
    return texture;
  }

  /**
   * Create a texture of the atlas size, with the texels of the previous one.
   * @param {GPUDevice} device Device.
   * @private
   */
  replaceTexture_(device) {
    const texture = device.createTexture({
      size: [this.size_, this.size_],
      format: 'rgba8unorm',
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.COPY_SRC |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
    const previous = this.texture_;
    if (previous) {
      const encoder = device.createCommandEncoder();
      encoder.copyTextureToTexture({texture: previous}, {texture}, [
        previous.width,
        previous.height,
      ]);
      device.queue.submit([encoder.finish()]);
      previous.destroy();
    }
    this.texture_ = texture;
  }

  /**
   * @return {number} Atlas width and height in texels.
   */
  getSize() {
    return this.size_;
  }

  /**
   * @return {boolean} An image did not fit, and is not drawn until the atlas
   * starts over.
   */
  isFull() {
    return this.full_;
  }

  /**
   * @return {number} Texels taken by all entries, used or not.
   */
  getAllocatedArea() {
    return this.allocatedArea_;
  }

  /**
   * @return {number} Changes whenever the atlas starts over, so a user can
   * tell whether entries it holds still refer to this texture.
   */
  getGeneration() {
    return this.generation_;
  }

  /**
   * @param {number} [generation] Generation. The current one when omitted.
   * @return {GPUTexture|null} Texture, or null when that generation was not
   * uploaded or has been released.
   */
  getTexture(generation) {
    if (generation === undefined || generation === this.generation_) {
      return this.texture_;
    }
    return this.retained_.get(generation) || null;
  }

  /**
   * @param {number} generation Generation.
   * @return {boolean} The current generation, or a retained earlier one.
   */
  hasGeneration(generation) {
    return generation === this.generation_ || this.retained_.has(generation);
  }

  /**
   * Destroy retained textures no batch still samples.
   * @param {Set<number>} used Generations to keep, besides the current one.
   */
  releaseUnused(used) {
    for (const [generation, texture] of this.retained_) {
      if (!used.has(generation)) {
        texture.destroy();
        this.retained_.delete(generation);
      }
    }
  }

  /**
   * Release the texture and forget all entries. Their texels exist only in
   * the texture, so they are copied again when added again. A restart keeps
   * the texture for batches that still sample it; a new device cannot.
   * @param {boolean} [retainTextures] Keep the current texture addressable by
   * its generation until `releaseUnused()` drops it.
   */
  clear(retainTextures) {
    if (retainTextures && this.texture_) {
      this.retained_.set(this.generation_, this.texture_);
      this.texture_ = null;
    } else {
      this.texture_?.destroy();
      this.texture_ = null;
      for (const texture of this.retained_.values()) {
        texture.destroy();
      }
      this.retained_.clear();
    }
    this.size_ = INITIAL_SIZE;
    this.full_ = false;
    this.allocatedArea_ = 0;
    ++this.generation_;
    this.shelfX_ = 1;
    this.shelfY_ = 1;
    this.shelfHeight_ = 0;
    this.entries_.clear();
    this.pending_ = [];
  }
}

export default ImageAtlas;
