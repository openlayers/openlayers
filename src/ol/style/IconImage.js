/**
 * @module ol/style/IconImage
 */

import EventTarget from '../events/Target.js';
import EventType from '../events/EventType.js';
import ImageState from '../ImageState.js';
import {asString} from '../color.js';
import {createCanvasContext2D} from '../dom.js';
import {shared as iconImageCache} from './IconImageCache.js';
import {listenImage} from '../Image.js';

/**
 * @type {CanvasRenderingContext2D}
 */
let taintedTestContext = null;

class IconImage extends EventTarget {
  /**
   * @param {HTMLImageElement|HTMLCanvasElement} image Image.
   * @param {string|undefined} src Src.
   * @param {import("../size.js").Size} size Size.
   * @param {?string} crossOrigin Cross origin.
   * @param {import("../ImageState.js").default} imageState Image state.
   * @param {import("../color.js").Color} color Color.
   */
  constructor(image, src, size, crossOrigin, imageState, color) {
    super();

    /**
     * @private
     * @type {HTMLImageElement|HTMLCanvasElement}
     */
    this.hitDetectionImage_ = null;

    /**
     * @private
     * @type {HTMLImageElement|HTMLCanvasElement}
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
     * @type {import("../color.js").Color}
     */
    this.color_ = color;

    /**
     * @private
     * @type {?function():void}
     */
    this.unlisten_ = null;

    /**
     * @private
     * @type {import("../ImageState.js").default}
     */
    this.imageState_ = imageState;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.size_ = size;

    /**
     * @private
     * @type {string|undefined}
     */
    this.src_ = src;

    /**
     * @private
     */
    this.tainted_;
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
        taintedTestContext = createCanvasContext2D(1, 1);
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
    this.unlistenImage_();
    this.dispatchChangeEvent_();
  }

  /**
   * @private
   */
  handleImageLoad_() {
    this.imageState_ = ImageState.LOADED;
    if (this.size_) {
      this.image_.width = this.size_[0];
      this.image_.height = this.size_[1];
    } else {
      this.size_ = [this.image_.width, this.image_.height];
    }
    this.unlistenImage_();
    this.dispatchChangeEvent_();
  }

  /**
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLImageElement|HTMLCanvasElement} Image or Canvas element.
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
   * @return {HTMLImageElement|HTMLCanvasElement} Image element.
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
      /** @type {HTMLImageElement} */ (this.image_).src = this.src_;
    } catch (e) {
      this.handleImageError_();
    }
    this.unlisten_ = listenImage(
      this.image_,
      this.handleImageLoad_.bind(this),
      this.handleImageError_.bind(this)
    );
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
   * Discards event handlers which listen for load completion or errors.
   *
   * @private
   */
  unlistenImage_() {
    if (this.unlisten_) {
      this.unlisten_();
      this.unlisten_ = null;
    }
  }
}

/**
 * @param {HTMLImageElement|HTMLCanvasElement} image Image.
 * @param {string} src Src.
 * @param {import("../size.js").Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {import("../ImageState.js").default} imageState Image state.
 * @param {import("../color.js").Color} color Color.
 * @return {IconImage} Icon image.
 */
export function get(image, src, size, crossOrigin, imageState, color) {
  let iconImage = iconImageCache.get(src, crossOrigin, color);
  if (!iconImage) {
    iconImage = new IconImage(image, src, size, crossOrigin, imageState, color);
    iconImageCache.set(src, crossOrigin, color, iconImage);
  }
  return iconImage;
}

export default IconImage;
