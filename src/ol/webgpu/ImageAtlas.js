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
 * Shelf-packed full-color atlas for image styles.
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
     * @type {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D}
     */
    this.context_ = createCanvasContext2D(this.size_, this.size_, undefined, {
      alpha: true,
    });

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
     * @private
     * @type {boolean}
     */
    this.dirty_ = true;

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
    this.context_.drawImage(
      /** @type {CanvasImageSource} */ (data.image),
      data.sourceX,
      data.sourceY,
      data.sourceWidth,
      data.sourceHeight,
      x,
      y,
      width,
      height,
    );
    const entry = {
      texX0: x,
      texY0: y,
      texX1: x + width,
      texY1: y + height,
    };
    this.entries_.set(key, entry);
    this.shelfX_ += width + 1;
    this.shelfHeight_ = Math.max(this.shelfHeight_, height);
    this.dirty_ = true;
    return entry;
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
    const context = createCanvasContext2D(next, next, undefined, {
      alpha: true,
    });
    context.drawImage(this.context_.canvas, 0, 0);
    this.context_ = context;
    this.size_ = next;
    this.dirty_ = true;
  }

  /**
   * @param {import("./Helper.js").default} helper Helper.
   * @return {GPUTexture} Texture.
   */
  upload(helper) {
    if (!this.texture_ || this.dirty_) {
      this.texture_?.destroy();
      this.texture_ = helper.createTextureFromImage(this.context_.canvas);
      this.dirty_ = false;
    }
    return this.texture_;
  }

  /**
   * @return {HTMLCanvasElement|OffscreenCanvas} Atlas canvas.
   */
  getCanvas() {
    return this.context_.canvas;
  }

  dispose() {
    this.texture_?.destroy();
    this.texture_ = null;
  }
}

export default ImageAtlas;
