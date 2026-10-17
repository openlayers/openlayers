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
 */
class ImageAtlas {
  constructor() {
    /**
     * @private
     * @type {number}
     */
    this.size_ = 512;

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
  }

  /**
   * Add an image-style sprite rectangle.
   *
   * @param {import("../render/ImageStyle.js").ImageStyleData} data Image data.
   * @return {ImageAtlasEntry} Atlas entry.
   */
  add(data) {
    const key = `${getUid(data.image)}/${data.sourceX}/${data.sourceY}/${data.sourceWidth}/${data.sourceHeight}`;
    const existing = this.entries_.get(key);
    if (existing) {
      return existing;
    }
    const width = Math.max(1, Math.ceil(data.sourceWidth));
    const height = Math.max(1, Math.ceil(data.sourceHeight));
    this.fit_(width, height);
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
    this.shelfX_ += width + 1;
    this.shelfHeight_ = Math.max(this.shelfHeight_, height);
    return entry;
  }

  /**
   * Whole-pixel rectangles inside the image are copied from the image itself.
   * Others are drawn to a canvas of the cell size, which scales and clips them
   * like before.
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
    if (this.shelfY_ + height + 1 > this.size_) {
      this.grow_(this.size_ + 1);
      this.fit_(width, height);
    }
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
   * Release the texture and forget all entries. Their texels exist only in
   * the texture, so they are copied again when added again.
   */
  dispose() {
    this.texture_?.destroy();
    this.texture_ = null;
    this.size_ = 512;
    this.shelfX_ = 1;
    this.shelfY_ = 1;
    this.shelfHeight_ = 0;
    this.entries_.clear();
    this.pending_ = [];
  }
}

export default ImageAtlas;
