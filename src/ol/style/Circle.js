/**
 * @module ol/style/Circle
 */

import RegularShape from './RegularShape.js';


/**
 * @typedef {Object} Options
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {number} radius Circle radius.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 */


/**
 * @classdesc
 * Set circle style for vector features.
 * @api
 */
class CircleStyle extends RegularShape {
  /**
   * @param {Options=} opt_options Options.
   */
  constructor(opt_options) {

    const options = opt_options || /** @type {Options} */ ({});

    super({
      points: Infinity,
      fill: options.fill,
      radius: options.radius,
      stroke: options.stroke
    });

  }

  /**
  * Clones the style.
  * @return {CircleStyle} The cloned style.
  * @override
  * @api
  */
  clone() {
    const style = new CircleStyle({
      fill: this.getFill() ? this.getFill().clone() : undefined,
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      radius: this.getRadius()
    });
    style.setOpacity(this.getOpacity());
    style.setScale(this.getScale());
    return style;
  }

  /**
  * Set the circle radius.
  *
  * @param {number} radius Circle radius.
  * @api
  */
  setRadius(radius) {
    this.radius_ = radius;
  }
}


export default CircleStyle;
