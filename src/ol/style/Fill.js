/**
 * @module ol/style/Fill
 */

import ImageState from '../ImageState.js';
import {asArray} from '../color.js';
import {get as getIconImage} from './IconImage.js';
import {getUid} from '../util.js';

/**
 * @typedef {Object} Options
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} [color=null] A color,
 * gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats. For polygon fills (not for {@link import("./RegularShape.js").default} fills),
 * a pattern can also be provided as {@link module:ol/colorlike~PatternDescriptor}.
 * Default null; if null, the Canvas/renderer default black will be used.
 */

/**
 * @classdesc
 * Set fill style for vector features.
 * @api
 */
class Fill {
  /**
   * @param {Options} [options] Options.
   */
  constructor(options) {
    options = options || {};

    /**
     * @private
     * @type {import("./IconImage.js").default|null}
     */
    this.patternImage_ = null;

    /**
     * @private
     * @type {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null}
     */
    this.color_ = null;
    if (options.color !== undefined) {
      this.setColor(options.color);
    }
  }

  /**
   * Clones the style. The color is not cloned if it is a {@link module:ol/colorlike~ColorLike}.
   * @return {Fill} The cloned style.
   * @api
   */
  clone() {
    const color = this.getColor();
    return new Fill({
      color: Array.isArray(color) ? color.slice() : color || undefined,
    });
  }

  /**
   * Get the fill color.
   * @return {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} Color.
   * @api
   */
  getColor() {
    return this.color_;
  }

  /**
   * Set the color.
   *
   * @param {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} color Color.
   * @api
   */
  setColor(color) {
    if (color !== null && typeof color === 'object' && 'src' in color) {
      const patternImage = getIconImage(
        null,
        color.src,
        'anonymous',
        undefined,
        color.offset ? null : color.color ? color.color : null,
        !(color.offset && color.size),
      );
      patternImage.ready().then(() => {
        this.patternImage_ = null;
      });
      if (patternImage.getImageState() === ImageState.IDLE) {
        patternImage.load();
      }
      if (patternImage.getImageState() === ImageState.LOADING) {
        this.patternImage_ = patternImage;
      }
    }
    this.color_ = color;
  }

  /**
   * @return {string} Key of the fill for cache lookup.
   */
  getKey() {
    const fill = this.getColor();
    if (!fill) {
      return '';
    }
    return fill instanceof CanvasPattern || fill instanceof CanvasGradient
      ? getUid(fill)
      : typeof fill === 'object' && 'src' in fill
        ? fill.src + ':' + fill.offset
        : asArray(fill).toString();
  }

  /**
   * @return {boolean} The fill style is loading an image pattern.
   */
  loading() {
    return !!this.patternImage_;
  }

  /**
   * @return {Promise<void>} `false` or a promise that resolves when the style is ready to use.
   */
  ready() {
    return this.patternImage_ ? this.patternImage_.ready() : Promise.resolve();
  }
}

export default Fill;
