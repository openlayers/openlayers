/**
 * @module ol/style/AtlasManager
 */
import {MAX_TEXTURE_SIZE as WEBGL_MAX_TEXTURE_SIZE} from '../webgl.js';
import {VOID} from '../functions.js';
import Atlas from './Atlas.js';


/**
 * @typedef {Object} Options
 * @property {number} [initialSize=256] The size in pixels of the first atlas image.
 * @property {number} [maxSize] The maximum size in pixels of atlas images. Default is
 * `webgl/MAX_TEXTURE_SIZE` or 2048 if WebGL is not supported.
 * @property {number} [space=1] The space in pixels between images.
 */


/**
 * Provides information for an image inside an atlas manager.
 * `offsetX` and `offsetY` is the position of the image inside
 * the atlas image `image` and the position of the hit-detection image
 * inside the hit-detection atlas image `hitImage`.
 * @typedef {Object} AtlasManagerInfo
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {HTMLCanvasElement} image
 * @property {HTMLCanvasElement} hitImage
 */


/**
 * The size in pixels of the first atlas image.
 * @type {number}
 */
const INITIAL_ATLAS_SIZE = 256;

/**
 * The maximum size in pixels of atlas images.
 * @type {number}
 */
const MAX_ATLAS_SIZE = -1;


/**
 * @classdesc
 * Manages the creation of image atlases.
 *
 * Images added to this manager will be inserted into an atlas, which
 * will be used for rendering.
 * The `size` given in the constructor is the size for the first
 * atlas. After that, when new atlases are created, they will have
 * twice the size as the latest atlas (until `maxSize` is reached).
 *
 * If an application uses many images or very large images, it is recommended
 * to set a higher `size` value to avoid the creation of too many atlases.
 * @api
 */
class AtlasManager {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {

    const options = opt_options || {};

    /**
     * The size in pixels of the latest atlas image.
     * @private
     * @type {number}
     */
    this.currentSize_ = options.initialSize !== undefined ?
      options.initialSize : INITIAL_ATLAS_SIZE;

    /**
     * The maximum size in pixels of atlas images.
     * @private
     * @type {number}
     */
    this.maxSize_ = options.maxSize !== undefined ?
      options.maxSize : MAX_ATLAS_SIZE != -1 ?
        MAX_ATLAS_SIZE : WEBGL_MAX_TEXTURE_SIZE !== undefined ?
          WEBGL_MAX_TEXTURE_SIZE : 2048;

    /**
     * The size in pixels between images.
     * @private
     * @type {number}
     */
    this.space_ = options.space !== undefined ? options.space : 1;

    /**
     * @private
     * @type {Array<import("./Atlas.js").default>}
     */
    this.atlases_ = [new Atlas(this.currentSize_, this.space_)];

    /**
     * The size in pixels of the latest atlas image for hit-detection images.
     * @private
     * @type {number}
     */
    this.currentHitSize_ = this.currentSize_;

    /**
     * @private
     * @type {Array<import("./Atlas.js").default>}
     */
    this.hitAtlases_ = [new Atlas(this.currentHitSize_, this.space_)];
  }

  /**
   * @param {string} id The identifier of the entry to check.
   * @return {?AtlasManagerInfo} The position and atlas image for the
   *    entry, or `null` if the entry is not part of the atlas manager.
   */
  getInfo(id) {
    /** @type {?import("./Atlas.js").AtlasInfo} */
    const info = this.getInfo_(this.atlases_, id);

    if (!info) {
      return null;
    }
    const hitInfo = /** @type {import("./Atlas.js").AtlasInfo} */ (this.getInfo_(this.hitAtlases_, id));

    return this.mergeInfos_(info, hitInfo);
  }

  /**
   * @private
   * @param {Array<import("./Atlas.js").default>} atlases The atlases to search.
   * @param {string} id The identifier of the entry to check.
   * @return {?import("./Atlas.js").AtlasInfo} The position and atlas image for the entry,
   *    or `null` if the entry is not part of the atlases.
   */
  getInfo_(atlases, id) {
    for (let i = 0, ii = atlases.length; i < ii; ++i) {
      const atlas = atlases[i];
      const info = atlas.get(id);
      if (info) {
        return info;
      }
    }
    return null;
  }

  /**
   * @private
   * @param {import("./Atlas.js").AtlasInfo} info The info for the real image.
   * @param {import("./Atlas.js").AtlasInfo} hitInfo The info for the hit-detection
   *    image.
   * @return {?AtlasManagerInfo} The position and atlas image for the
   *    entry, or `null` if the entry is not part of the atlases.
   */
  mergeInfos_(info, hitInfo) {
    return (
      /** @type {AtlasManagerInfo} */ ({
        offsetX: info.offsetX,
        offsetY: info.offsetY,
        image: info.image,
        hitImage: hitInfo.image
      })
    );
  }

  /**
   * Add an image to the atlas manager.
   *
   * If an entry for the given id already exists, the entry will
   * be overridden (but the space on the atlas graphic will not be freed).
   *
   * If `renderHitCallback` is provided, the image (or the hit-detection version
   * of the image) will be rendered into a separate hit-detection atlas image.
   *
   * @param {string} id The identifier of the entry to add.
   * @param {number} width The width.
   * @param {number} height The height.
   * @param {function(CanvasRenderingContext2D, number, number)} renderCallback
   *    Called to render the new image onto an atlas image.
   * @param {function(CanvasRenderingContext2D, number, number)=} opt_renderHitCallback Called to render a hit-detection image onto a hit
   *    detection atlas image.
   * @param {Object=} opt_this Value to use as `this` when executing
   *    `renderCallback` and `renderHitCallback`.
   * @return {?AtlasManagerInfo}  The position and atlas image for the
   *    entry, or `null` if the image is too big.
   */
  add(id, width, height, renderCallback, opt_renderHitCallback, opt_this) {
    if (width + this.space_ > this.maxSize_ ||
        height + this.space_ > this.maxSize_) {
      return null;
    }

    /** @type {?import("./Atlas.js").AtlasInfo} */
    const info = this.add_(false, id, width, height, renderCallback, opt_this);
    if (!info) {
      return null;
    }

    // even if no hit-detection entry is requested, we insert a fake entry into
    // the hit-detection atlas, to make sure that the offset is the same for
    // the original image and the hit-detection image.
    const renderHitCallback = opt_renderHitCallback !== undefined ?
      opt_renderHitCallback : VOID;

    const hitInfo = /** @type {import("./Atlas.js").AtlasInfo} */ (this.add_(true,
      id, width, height, renderHitCallback, opt_this));

    return this.mergeInfos_(info, hitInfo);
  }

  /**
   * @private
   * @param {boolean} isHitAtlas If the hit-detection atlases are used.
   * @param {string} id The identifier of the entry to add.
   * @param {number} width The width.
   * @param {number} height The height.
   * @param {function(CanvasRenderingContext2D, number, number)} renderCallback
   *    Called to render the new image onto an atlas image.
   * @param {Object=} opt_this Value to use as `this` when executing
   *    `renderCallback` and `renderHitCallback`.
   * @return {?import("./Atlas.js").AtlasInfo}  The position and atlas image for the entry,
   *    or `null` if the image is too big.
   */
  add_(isHitAtlas, id, width, height, renderCallback, opt_this) {
    const atlases = (isHitAtlas) ? this.hitAtlases_ : this.atlases_;
    let atlas, info, i, ii;
    for (i = 0, ii = atlases.length; i < ii; ++i) {
      atlas = atlases[i];
      info = atlas.add(id, width, height, renderCallback, opt_this);
      if (info) {
        return info;
      } else if (!info && i === ii - 1) {
        // the entry could not be added to one of the existing atlases,
        // create a new atlas that is twice as big and try to add to this one.
        let size;
        if (isHitAtlas) {
          size = Math.min(this.currentHitSize_ * 2, this.maxSize_);
          this.currentHitSize_ = size;
        } else {
          size = Math.min(this.currentSize_ * 2, this.maxSize_);
          this.currentSize_ = size;
        }
        atlas = new Atlas(size, this.space_);
        atlases.push(atlas);
        // run the loop another time
        ++ii;
      }
    }
    return null;
  }
}

export default AtlasManager;
