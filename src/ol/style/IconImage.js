/**
 * @module ol/style/IconImage
 */

import EventTarget from '../events/Target.js';
import EventType from '../events/EventType.js';
import ImageState from '../ImageState.js';
import {asString} from '../color.js';
import {createCanvasContext2D} from '../dom.js';
import {decodeFallback} from '../Image.js';
import {shared as iconImageCache} from './IconImageCache.js';

/**
 * @type {CanvasRenderingContext2D}
 */
let taintedTestContext = null;

class IconImage extends EventTarget {
  /**
   * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap|null} image Image.
   * @param {string|undefined} src Src.
   * @param {?string} crossOrigin Cross origin.
   * @param {import("../ImageState.js").default|undefined} imageState Image state.
   * @param {import("../color.js").Color|string|null} color Color.
   */
  constructor(image, src, crossOrigin, imageState, color) {
    super();

    /**
     * @private
     * @type {HTMLImageElement|HTMLCanvasElement|ImageBitmap}
     */
    this.hitDetectionImage_ = null;

    /**
     * @private
     * @type {HTMLImageElement|HTMLCanvasElement|ImageBitmap|null}
     */
    this.image_ = image;

    /**
     * @private
     * @type {string|null}
     */
    this.crossOrigin_ = crossOrigin;

    /**
     * @private
     * @type {Object<number, HTMLCanvasElement>}
     */
    this.canvas_ = {};

    /**
     * @private
     * @type {import("../color.js").Color|string|null}
     */
    this.color_ = color;

    /**
     * @private
     * @type {import("../ImageState.js").default}
     */
    this.imageState_ = imageState === undefined ? ImageState.IDLE : imageState;

    /**
     * @private
     * @type {import("../size.js").Size|null}
     */
    this.size_ =
      image && image.width && image.height ? [image.width, image.height] : null;

    /**
     * @private
     * @type {string|undefined}
     */
    this.src_ = src;

    /**
     * @private
     */
    this.tainted_;

    /**
     * @private
     * @type {Promise<void>|null}
     */
    this.ready_ = null;
  }

  /**
   * @private
   */
  initializeImage_() {
    this.image_ = new Image();
    if (this.crossOrigin_ !== null) {
      this.image_.crossOrigin = this.crossOrigin_;
    }
  }

  /**
   * @private
   * @return {boolean} The image canvas is tainted.
   */
  isTainted_() {
    if (this.tainted_ === undefined && this.imageState_ === ImageState.LOADED) {
      if (!taintedTestContext) {
        taintedTestContext = createCanvasContext2D(1, 1, undefined, {
          willReadFrequently: true,
        });
      }
      taintedTestContext.drawImage(this.image_, 0, 0);
      try {
        taintedTestContext.getImageData(0, 0, 1, 1);
        this.tainted_ = false;
      } catch (e) {
        taintedTestContext = null;
        this.tainted_ = true;
      }
    }
    return this.tainted_ === true;
  }

  /**
   * @private
   */
  dispatchChangeEvent_() {
    this.dispatchEvent(EventType.CHANGE);
  }

  /**
   * @private
   */
  handleImageError_() {
    this.imageState_ = ImageState.ERROR;
    this.dispatchChangeEvent_();
  }

  /**
   * @private
   */
  handleImageLoad_() {
    this.imageState_ = ImageState.LOADED;
    this.size_ = [this.image_.width, this.image_.height];
    this.dispatchChangeEvent_();
  }

  /**
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image or Canvas element or image bitmap.
   */
  getImage(pixelRatio) {
    if (!this.image_) {
      this.initializeImage_();
    }
    this.replaceColor_(pixelRatio);
    return this.canvas_[pixelRatio] ? this.canvas_[pixelRatio] : this.image_;
  }

  /**
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} Image or Canvas element.
   */
  getPixelRatio(pixelRatio) {
    this.replaceColor_(pixelRatio);
    return this.canvas_[pixelRatio] ? pixelRatio : 1;
  }

  /**
   * @return {import("../ImageState.js").default} Image state.
   */
  getImageState() {
    return this.imageState_;
  }

  /**
   * @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image element.
   */
  getHitDetectionImage() {
    if (!this.image_) {
      this.initializeImage_();
    }
    if (!this.hitDetectionImage_) {
      if (this.isTainted_()) {
        const width = this.size_[0];
        const height = this.size_[1];
        const context = createCanvasContext2D(width, height);
        context.fillRect(0, 0, width, height);
        this.hitDetectionImage_ = context.canvas;
      } else {
        this.hitDetectionImage_ = this.image_;
      }
    }
    return this.hitDetectionImage_;
  }

  /**
   * Get the size of the icon (in pixels).
   * @return {import("../size.js").Size} Image size.
   */
  getSize() {
    return this.size_;
  }

  /**
   * @return {string|undefined} Image src.
   */
  getSrc() {
    return this.src_;
  }

  /**
   * Load not yet loaded URI.
   */
  load() {
    if (this.imageState_ !== ImageState.IDLE) {
      return;
    }
    if (!this.image_) {
      this.initializeImage_();
    }

    this.imageState_ = ImageState.LOADING;
    try {
      if (this.src_ !== undefined) {
        /** @type {HTMLImageElement} */ (this.image_).src = this.src_;
      }
    } catch (e) {
      this.handleImageError_();
    }
    if (this.image_ instanceof HTMLImageElement) {
      decodeFallback(this.image_, this.src_)
        .then((image) => {
          this.image_ = image;
          this.handleImageLoad_();
        })
        .catch(this.handleImageError_.bind(this));
    }
  }

  /**
   * @param {number} pixelRatio Pixel ratio.
   * @private
   */
  replaceColor_(pixelRatio) {
    if (
      !this.color_ ||
      this.canvas_[pixelRatio] ||
      this.imageState_ !== ImageState.LOADED
    ) {
      return;
    }

    const image = this.image_;
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(image.width * pixelRatio);
    canvas.height = Math.ceil(image.height * pixelRatio);

    const ctx = canvas.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.drawImage(image, 0, 0);

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = asString(this.color_);
    ctx.fillRect(0, 0, canvas.width / pixelRatio, canvas.height / pixelRatio);

    ctx.globalCompositeOperation = 'destination-in';
    ctx.drawImage(image, 0, 0);

    this.canvas_[pixelRatio] = canvas;
  }

  /**
   * @return {Promise<void>} Promise that resolves when the image is loaded.
   */
  ready() {
    if (!this.ready_) {
      this.ready_ = new Promise((resolve) => {
        if (
          this.imageState_ === ImageState.LOADED ||
          this.imageState_ === ImageState.ERROR
        ) {
          resolve();
        } else {
          this.addEventListener(EventType.CHANGE, function onChange() {
            if (
              this.imageState_ === ImageState.LOADED ||
              this.imageState_ === ImageState.ERROR
            ) {
              this.removeEventListener(EventType.CHANGE, onChange);
              resolve();
            }
          });
        }
      });
    }
    return this.ready_;
  }
}

/**
 * @param {HTMLImageElement|HTMLCanvasElement|ImageBitmap|null} image Image.
 * @param {string|undefined} cacheKey Src.
 * @param {?string} crossOrigin Cross origin.
 * @param {import("../ImageState.js").default|undefined} imageState Image state.
 * @param {import("../color.js").Color|string|null} color Color.
 * @param {boolean} [pattern] Also cache a `repeat` pattern with the icon image.
 * @return {IconImage} Icon image.
 */
export function get(image, cacheKey, crossOrigin, imageState, color, pattern) {
  let iconImage =
    cacheKey === undefined
      ? undefined
      : iconImageCache.get(cacheKey, crossOrigin, color);
  if (!iconImage) {
    iconImage = new IconImage(
      image,
      image && 'src' in image ? image.src || undefined : cacheKey,
      crossOrigin,
      imageState,
      color,
    );
    iconImageCache.set(cacheKey, crossOrigin, color, iconImage, pattern);
  }
  if (
    pattern &&
    iconImage &&
    !iconImageCache.getPattern(cacheKey, crossOrigin, color)
  ) {
    iconImageCache.set(cacheKey, crossOrigin, color, iconImage, pattern);
  }
  return iconImage;
}

export default IconImage;
