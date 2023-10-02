/**
 * @module ol/style/Fill
 */

/**
 * @typedef {Object} Options
 * @property {import("../color.js").Color|import("../colorlike.js").ColorLike|null} [color=null] A color, gradient or pattern.
 * See {@link module:ol/color~Color} and {@link module:ol/colorlike~ColorLike} for possible formats.
 * Default null; if null, the Canvas/renderer default black will be used.
 * @property {number} [opacity=1] Opacity.
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
     * @type {import("../color.js").Color|import("../colorlike.js").ColorLike|null}
     */
    this.color_ = options.color !== undefined ? options.color : null;
    this.opacity_ = options.opacity !== undefined ? options.opacity : 1;
  }

  /**
   * Clones the style. The color is not cloned if it is an {@link module:ol/colorlike~ColorLike}.
   * @return {Fill} The cloned style.
   * @api
   */
  clone() {
    const color = this.getColor();
    const opacity = this.getOpacity();
    return new Fill({
      color: Array.isArray(color) ? color.slice() : color || undefined,
      opacity: opacity,
    });
  }

  /**
   * Get the fill color.
   * @return {import("../color.js").Color|import("../colorlike.js").ColorLike|null} Color.
   * @api
   */
  getColor() {
    return this.color_;
  }

  /**
   * Get the fill opacity.
   * @return {number} Opacity.
   * @api
   */
  getOpacity() {
    return this.opacity_;
  }

  /**
   * Set the color.
   *
   * @param {import("../color.js").Color|import("../colorlike.js").ColorLike|null} color Color.
   * @api
   */
  setColor(color) {
    this.color_ = color;
  }
}

export default Fill;
