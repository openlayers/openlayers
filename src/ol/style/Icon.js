/**
 * @module ol/style/Icon
 */
import ImageState from '../ImageState.js';
import {assert} from '../asserts.js';
import {asArray} from '../color.js';
import EventType from '../events/EventType.js';
import {getUid} from '../util.js';
import {get as getIconImage} from './IconImage.js';
import ImageStyle from './Image.js';

/**
 * @typedef {'fraction' | 'pixels'} IconAnchorUnits
 * Anchor unit can be either a fraction of the icon size or in pixels.
 */

/**
 * @typedef {'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'} IconOrigin
 * Icon origin. One of 'bottom-left', 'bottom-right', 'top-left', 'top-right'.
 */

/**
 * @typedef {Object} Options
 * @property {Array<number>} [anchor=[0.5, 0.5]] Anchor. Default value is the icon center.
 * @property {IconOrigin} [anchorOrigin='top-left'] Origin of the anchor: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {IconAnchorUnits} [anchorXUnits='fraction'] Units in which the anchor x value is
 * specified. A value of `'fraction'` indicates the x value is a fraction of the icon. A value of `'pixels'` indicates
 * the x value in pixels.
 * @property {IconAnchorUnits} [anchorYUnits='fraction'] Units in which the anchor y value is
 * specified. A value of `'fraction'` indicates the y value is a fraction of the icon. A value of `'pixels'` indicates
 * the y value in pixels.
 * @property {import("../color.js").Color|string} [color] Color to tint the icon. If not specified,
 * the icon will be left as is.
 * @property {null|string} [crossOrigin] The `crossOrigin` attribute for loaded images. Note that you must provide a
 * `crossOrigin` value if you want to access pixel data with the Canvas renderer.
 * See https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image for more detail.
 * @property {HTMLImageElement|HTMLCanvasElement|ImageBitmap} [img] Image object for the icon.
 * @property {Array<number>} [displacement=[0, 0]] Displacement of the icon in pixels.
 * Positive values will shift the icon right and up.
 * @property {number} [opacity=1] Opacity of the icon.
 * @property {number} [width] The width of the icon in pixels. This can't be used together with `scale`.
 * @property {number} [height] The height of the icon in pixels. This can't be used together with `scale`.
 * @property {number|import("../size.js").Size} [scale=1] Scale.
 * @property {boolean} [rotateWithView=false] Whether to rotate the icon with the view.
 * @property {number} [rotation=0] Rotation in radians (positive rotation clockwise).
 * @property {Array<number>} [offset=[0, 0]] Offset which, together with `size` and `offsetOrigin`, defines the
 * sub-rectangle to use from the original (sprite) image.
 * @property {IconOrigin} [offsetOrigin='top-left'] Origin of the offset: `bottom-left`, `bottom-right`,
 * `top-left` or `top-right`.
 * @property {import("../size.js").Size} [size] Icon size in pixels. Used together with `offset` to define the
 * sub-rectangle to use from the original (sprite) image.
 * @property {string} [src] Image source URI.
 * @property {import("./Style.js").DeclutterMode} [declutterMode] Declutter mode.
 */

/**
 * @param {number} width The width.
 * @param {number} height The height.
 * @param {number|undefined} wantedWidth The wanted width.
 * @param {number|undefined} wantedHeight The wanted height.
 * @return {number|Array<number>} The scale.
 */
function calculateScale(width, height, wantedWidth, wantedHeight) {
  if (wantedWidth !== undefined && wantedHeight !== undefined) {
    return [wantedWidth / width, wantedHeight / height];
  }
  if (wantedWidth !== undefined) {
    return wantedWidth / width;
  }
  if (wantedHeight !== undefined) {
    return wantedHeight / height;
  }
  return 1;
}

/**
 * @classdesc
 * Set icon style for vector features.
 * @api
 */
class Icon extends ImageStyle {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options || {};

    /**
     * @type {number}
     */
    const opacity = options.opacity !== undefined ? options.opacity : 1;

    /**
     * @type {number}
     */
    const rotation = options.rotation !== undefined ? options.rotation : 0;

    /**
     * @type {number|import("../size.js").Size}
     */
    const scale = options.scale !== undefined ? options.scale : 1;

    /**
     * @type {boolean}
     */
    const rotateWithView =
      options.rotateWithView !== undefined ? options.rotateWithView : false;

    super({
      opacity: opacity,
      rotation: rotation,
      scale: scale,
      displacement:
        options.displacement !== undefined ? options.displacement : [0, 0],
      rotateWithView: rotateWithView,
      declutterMode: options.declutterMode,
    });

    /**
     * @private
     * @type {Array<number>}
     */
    this.anchor_ = options.anchor !== undefined ? options.anchor : [0.5, 0.5];

    /**
     * @private
     * @type {Array<number>}
     */
    this.normalizedAnchor_ = null;

    /**
     * @private
     * @type {IconOrigin}
     */
    this.anchorOrigin_ =
      options.anchorOrigin !== undefined ? options.anchorOrigin : 'top-left';

    /**
     * @private
     * @type {IconAnchorUnits}
     */
    this.anchorXUnits_ =
      options.anchorXUnits !== undefined ? options.anchorXUnits : 'fraction';

    /**
     * @private
     * @type {IconAnchorUnits}
     */
    this.anchorYUnits_ =
      options.anchorYUnits !== undefined ? options.anchorYUnits : 'fraction';

    /**
     * @private
     * @type {?string}
     */
    this.crossOrigin_ =
      options.crossOrigin !== undefined ? options.crossOrigin : null;

    const image = options.img !== undefined ? options.img : null;

    let cacheKey = options.src;

    assert(
      !(cacheKey !== undefined && image),
      '`image` and `src` cannot be provided at the same time',
    );

    if ((cacheKey === undefined || cacheKey.length === 0) && image) {
      cacheKey = /** @type {HTMLImageElement} */ (image).src || getUid(image);
    }
    assert(
      cacheKey !== undefined && cacheKey.length > 0,
      'A defined and non-empty `src` or `image` must be provided',
    );

    assert(
      !(
        (options.width !== undefined || options.height !== undefined) &&
        options.scale !== undefined
      ),
      '`width` or `height` cannot be provided together with `scale`',
    );

    let imageState;
    if (options.src !== undefined) {
      imageState = ImageState.IDLE;
    } else if (image !== undefined) {
      if ('complete' in image) {
        if (image.complete) {
          imageState = image.src ? ImageState.LOADED : ImageState.IDLE;
        } else {
          imageState = ImageState.LOADING;
        }
      } else {
        imageState = ImageState.LOADED;
      }
    }

    /**
     * @private
     * @type {import("../color.js").Color}
     */
    this.color_ = options.color !== undefined ? asArray(options.color) : null;

    /**
     * @private
     * @type {import("./IconImage.js").default}
     */
    this.iconImage_ = getIconImage(
      image,
      /** @type {string} */ (cacheKey),
      this.crossOrigin_,
      imageState,
      this.color_,
    );

    /**
     * @private
     * @type {Array<number>}
     */
    this.offset_ = options.offset !== undefined ? options.offset : [0, 0];
    /**
     * @private
     * @type {IconOrigin}
     */
    this.offsetOrigin_ =
      options.offsetOrigin !== undefined ? options.offsetOrigin : 'top-left';

    /**
     * @private
     * @type {Array<number>}
     */
    this.origin_ = null;

    /**
     * @private
     * @type {import("../size.js").Size}
     */
    this.size_ = options.size !== undefined ? options.size : null;

    /**
     * @private
     */
    this.initialOptions_;

    /**
     * Calculate the scale if width or height were given.
     */
    if (options.width !== undefined || options.height !== undefined) {
      let width, height;
      if (options.size) {
        [width, height] = options.size;
      } else {
        const image = this.getImage(1);
        if (image.width && image.height) {
          width = image.width;
          height = image.height;
        } else if (image instanceof HTMLImageElement) {
          this.initialOptions_ = options;
          const onload = () => {
            this.unlistenImageChange(onload);
            if (!this.initialOptions_) {
              return;
            }
            const imageSize = this.iconImage_.getSize();
            this.setScale(
              calculateScale(
                imageSize[0],
                imageSize[1],
                options.width,
                options.height,
              ),
            );
          };
          this.listenImageChange(onload);
          return;
        }
      }
      if (width !== undefined) {
        this.setScale(
          calculateScale(width, height, options.width, options.height),
        );
      }
    }
  }

  /**
   * Clones the style. The underlying Image/HTMLCanvasElement is not cloned.
   * @return {Icon} The cloned style.
   * @api
   * @override
   */
  clone() {
    let scale, width, height;
    if (this.initialOptions_) {
      width = this.initialOptions_.width;
      height = this.initialOptions_.height;
    } else {
      scale = this.getScale();
      scale = Array.isArray(scale) ? scale.slice() : scale;
    }
    return new Icon({
      anchor: this.anchor_.slice(),
      anchorOrigin: this.anchorOrigin_,
      anchorXUnits: this.anchorXUnits_,
      anchorYUnits: this.anchorYUnits_,
      color:
        this.color_ && this.color_.slice
          ? this.color_.slice()
          : this.color_ || undefined,
      crossOrigin: this.crossOrigin_,
      offset: this.offset_.slice(),
      offsetOrigin: this.offsetOrigin_,
      opacity: this.getOpacity(),
      rotateWithView: this.getRotateWithView(),
      rotation: this.getRotation(),
      scale,
      width,
      height,
      size: this.size_ !== null ? this.size_.slice() : undefined,
      src: this.getSrc(),
      displacement: this.getDisplacement().slice(),
      declutterMode: this.getDeclutterMode(),
    });
  }

  /**
   * Get the anchor point in pixels. The anchor determines the center point for the
   * symbolizer.
   * @return {Array<number>} Anchor.
   * @api
   * @override
   */
  getAnchor() {
    let anchor = this.normalizedAnchor_;
    if (!anchor) {
      anchor = this.anchor_;
      const size = this.getSize();
      if (
        this.anchorXUnits_ == 'fraction' ||
        this.anchorYUnits_ == 'fraction'
      ) {
        if (!size) {
          return null;
        }
        anchor = this.anchor_.slice();
        if (this.anchorXUnits_ == 'fraction') {
          anchor[0] *= size[0];
        }
        if (this.anchorYUnits_ == 'fraction') {
          anchor[1] *= size[1];
        }
      }

      if (this.anchorOrigin_ != 'top-left') {
        if (!size) {
          return null;
        }
        if (anchor === this.anchor_) {
          anchor = this.anchor_.slice();
        }
        if (
          this.anchorOrigin_ == 'top-right' ||
          this.anchorOrigin_ == 'bottom-right'
        ) {
          anchor[0] = -anchor[0] + size[0];
        }
        if (
          this.anchorOrigin_ == 'bottom-left' ||
          this.anchorOrigin_ == 'bottom-right'
        ) {
          anchor[1] = -anchor[1] + size[1];
        }
      }
      this.normalizedAnchor_ = anchor;
    }
    const displacement = this.getDisplacement();
    const scale = this.getScaleArray();
    // anchor is scaled by renderer but displacement should not be scaled
    // so divide by scale here
    return [
      anchor[0] - displacement[0] / scale[0],
      anchor[1] + displacement[1] / scale[1],
    ];
  }

  /**
   * Set the anchor point. The anchor determines the center point for the
   * symbolizer.
   *
   * @param {Array<number>} anchor Anchor.
   * @api
   */
  setAnchor(anchor) {
    this.anchor_ = anchor;
    this.normalizedAnchor_ = null;
  }

  /**
   * Get the icon color.
   * @return {import("../color.js").Color} Color.
   * @api
   */
  getColor() {
    return this.color_;
  }

  /**
   * Get the image icon.
   * @param {number} pixelRatio Pixel ratio.
   * @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image or Canvas element. If the Icon
   * style was configured with `src` or with a not let loaded `img`, an `ImageBitmap` will be returned.
   * @api
   * @override
   */
  getImage(pixelRatio) {
    return this.iconImage_.getImage(pixelRatio);
  }

  /**
   * Get the pixel ratio.
   * @param {number} pixelRatio Pixel ratio.
   * @return {number} The pixel ratio of the image.
   * @api
   * @override
   */
  getPixelRatio(pixelRatio) {
    return this.iconImage_.getPixelRatio(pixelRatio);
  }

  /**
   * @return {import("../size.js").Size} Image size.
   * @override
   */
  getImageSize() {
    return this.iconImage_.getSize();
  }

  /**
   * @return {import("../ImageState.js").default} Image state.
   * @override
   */
  getImageState() {
    return this.iconImage_.getImageState();
  }

  /**
   * @return {HTMLImageElement|HTMLCanvasElement|ImageBitmap} Image element.
   * @override
   */
  getHitDetectionImage() {
    return this.iconImage_.getHitDetectionImage();
  }

  /**
   * Get the origin of the symbolizer.
   * @return {Array<number>} Origin.
   * @api
   * @override
   */
  getOrigin() {
    if (this.origin_) {
      return this.origin_;
    }
    let offset = this.offset_;

    if (this.offsetOrigin_ != 'top-left') {
      const size = this.getSize();
      const iconImageSize = this.iconImage_.getSize();
      if (!size || !iconImageSize) {
        return null;
      }
      offset = offset.slice();
      if (
        this.offsetOrigin_ == 'top-right' ||
        this.offsetOrigin_ == 'bottom-right'
      ) {
        offset[0] = iconImageSize[0] - size[0] - offset[0];
      }
      if (
        this.offsetOrigin_ == 'bottom-left' ||
        this.offsetOrigin_ == 'bottom-right'
      ) {
        offset[1] = iconImageSize[1] - size[1] - offset[1];
      }
    }
    this.origin_ = offset;
    return this.origin_;
  }

  /**
   * Get the image URL.
   * @return {string|undefined} Image src.
   * @api
   */
  getSrc() {
    return this.iconImage_.getSrc();
  }

  /**
   * Get the size of the icon (in pixels).
   * @return {import("../size.js").Size} Image size.
   * @api
   * @override
   */
  getSize() {
    return !this.size_ ? this.iconImage_.getSize() : this.size_;
  }

  /**
   * Get the width of the icon (in pixels). Will return undefined when the icon image is not yet loaded.
   * @return {number} Icon width (in pixels).
   * @api
   */
  getWidth() {
    const scale = this.getScaleArray();
    if (this.size_) {
      return this.size_[0] * scale[0];
    }
    if (this.iconImage_.getImageState() == ImageState.LOADED) {
      return this.iconImage_.getSize()[0] * scale[0];
    }
    return undefined;
  }

  /**
   * Get the height of the icon (in pixels). Will return undefined when the icon image is not yet loaded.
   * @return {number} Icon height (in pixels).
   * @api
   */
  getHeight() {
    const scale = this.getScaleArray();
    if (this.size_) {
      return this.size_[1] * scale[1];
    }
    if (this.iconImage_.getImageState() == ImageState.LOADED) {
      return this.iconImage_.getSize()[1] * scale[1];
    }
    return undefined;
  }

  /**
   * Set the scale.
   *
   * @param {number|import("../size.js").Size} scale Scale.
   * @api
   * @override
   */
  setScale(scale) {
    delete this.initialOptions_;
    super.setScale(scale);
  }

  /**
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   * @override
   */
  listenImageChange(listener) {
    this.iconImage_.addEventListener(EventType.CHANGE, listener);
  }

  /**
   * Load not yet loaded URI.
   * When rendering a feature with an icon style, the vector renderer will
   * automatically call this method. However, you might want to call this
   * method yourself for preloading or other purposes.
   * @api
   * @override
   */
  load() {
    this.iconImage_.load();
  }

  /**
   * @param {function(import("../events/Event.js").default): void} listener Listener function.
   * @override
   */
  unlistenImageChange(listener) {
    this.iconImage_.removeEventListener(EventType.CHANGE, listener);
  }

  /**
   * @override
   */
  ready() {
    return this.iconImage_.ready();
  }
}

export default Icon;
