/**
 * @module ol/style/Fill
 */

import ImageState from '../ImageState.js';
import {asArray} from '../color.js';
import {getUid} from '../util.js';
import {get as getIconImage} from './IconImage.js';

/**
 * @typedef {Object} Options
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike|import('../colorlike.js').PatternDescriptor|null} [color=null] A color,
 * gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats. For polygon fills (not for {@link import("./RegularShape.js").default} fills),
 * a pattern can also be provided as {@link module:ol/colorlike~PatternDescriptor}.
 * Default null; if null, the Canvas/renderer default black will be used.
 * @property {import("../coordinate.js").Coordinate} [displacement=[0, 0]] Fill
 * displacement in pixels. A positive x value shifts the fill right, and a
 * positive y value shifts it down. WebGPU only.
 * @property {'map'|'viewport'} [displacementAnchor='map'] Frame of reference
 * for the displacement. WebGPU only.
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

    /**
     * @private
     * @type {import("../coordinate.js").Coordinate}
     */
    this.displacement_ = options.displacement
      ? options.displacement.slice()
      : [0, 0];

    /**
     * @private
     * @type {'map'|'viewport'}
     */
    this.displacementAnchor_ = options.displacementAnchor || 'map';
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
      displacement: this.getDisplacement().slice(),
      displacementAnchor: this.getDisplacementAnchor(),
    });
  }

  /**
   * Get the fill displacement.
   * @return {import("../coordinate.js").Coordinate} Displacement in pixels.
   * @api
   */
  getDisplacement() {
    return this.displacement_;
  }

  /**
   * Set the fill displacement.
   * @param {import("../coordinate.js").Coordinate} displacement Displacement
   * in pixels.
   * @api
   */
  setDisplacement(displacement) {
    this.displacement_ = displacement;
  }

  /**
   * Get the frame of reference for the fill displacement.
   * @return {'map'|'viewport'} Displacement anchor.
   * @api
   */
  getDisplacementAnchor() {
    return this.displacementAnchor_;
  }

  /**
   * Set the frame of reference for the fill displacement.
   * @param {'map'|'viewport'} displacementAnchor Displacement anchor.
   * @api
   */
  setDisplacementAnchor(displacementAnchor) {
    this.displacementAnchor_ = displacementAnchor;
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
        {crossOrigin: 'anonymous'},
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
      ? getUid(/** @type {Object} */ (fill))
      : typeof fill === 'object' && 'src' in fill
        ? fill.src + ':' + fill.offset + ':' + (fill.scale ?? 1)
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
