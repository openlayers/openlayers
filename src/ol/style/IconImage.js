/**
 * @module ol/style/IconImage
 */

import {createCanvasContext2D} from '../dom.js';
import EventTarget from '../events/Target.js';
import EventType from '../events/EventType.js';
import ImageState from '../ImageState.js';
import {shared as iconImageCache} from './IconImageCache.js';
import {listenImage} from '../Image.js';


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
    this.image_ = !image ? new Image() : image;

    if (crossOrigin !== null) {
      /** @type {HTMLImageElement} */ (this.image_).crossOrigin = crossOrigin;
    }

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.canvas_ = color ? document.createElement('canvas') : null;

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
     * @type {boolean|undefined}
     */
    this.tainted_;

  }

  /**
   * @private
   * @return {boolean} The image canvas is tainted.
   */
  isTainted_() {
    if (this.tainted_ === undefined && this.imageState_ === ImageState.LOADED) {
      this.tainted_ = false;
      const context = createCanvasContext2D(1, 1);
      try {
        context.drawImage(this.image_, 0, 0);
        context.getImageData(0, 0, 1, 1);
      } catch (e) {
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
    }
    this.size_ = [this.image_.width, this.image_.height];
    this.unlistenImage_();
    this.replaceColor_();
    this.dispatchChangeEvent_();
  }

  /**
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLImageElement|HTMLCanvasElement} Image or Canvas element.
   */
  getImage(pixelRatio) {
    return this.canvas_ ? this.canvas_ : this.image_;
  }

  /**
   * @return {import("../ImageState.js").default} Image state.
   */
  getImageState() {
    return this.imageState_;
  }

  /**
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLImageElement|HTMLCanvasElement} Image element.
   */
  getHitDetectionImage(pixelRatio) {
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
    if (this.imageState_ == ImageState.IDLE) {
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
  }

  /**
   * @private
   */
  replaceColor_() {
    if (!this.color_ || this.isTainted_()) {
      return;
    }

    this.canvas_.width = this.image_.width;
    this.canvas_.height = this.image_.height;

    const ctx = this.canvas_.getContext('2d');
    ctx.drawImage(this.image_, 0, 0);

    const imgData = ctx.getImageData(0, 0, this.image_.width, this.image_.height);
    const data = imgData.data;
    const r = this.color_[0] / 255.0;
    const g = this.color_[1] / 255.0;
    const b = this.color_[2] / 255.0;

    for (let i = 0, ii = data.length; i < ii; i += 4) {
      data[i] *= r;
      data[i + 1] *= g;
      data[i + 2] *= b;
    }
    ctx.putImageData(imgData, 0, 0);
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
