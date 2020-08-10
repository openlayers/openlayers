/**
 * @module ol/style/Circle
 */

import RegularShape from './RegularShape.js';

/**
 * @typedef {Object} Options
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {number} radius Circle radius.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {Array<number>} [displacement=[0,0]] displacement
 * @property {number|import("../size.js").Size} [scale=1] Scale. A two dimensional scale will produce an ellipse.
 * Unless two dimensional scaling is required a better result may be obtained with an appropriate setting for `radius`.
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
    const options = opt_options ? opt_options : {};

    super({
      points: Infinity,
      fill: options.fill,
      radius: options.radius,
      stroke: options.stroke,
      scale: options.scale !== undefined ? options.scale : 1,
      displacement:
        options.displacement !== undefined ? options.displacement : [0, 0],
    });
  }

  /**
   * Clones the style.
   * @return {CircleStyle} The cloned style.
   * @api
   */
  clone() {
    const scale = this.getScale();
    const style = new CircleStyle({
      fill: this.getFill() ? this.getFill().clone() : undefined,
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      radius: this.getRadius(),
      scale: Array.isArray(scale) ? scale.slice() : scale,
      displacement: this.getDisplacement().slice(),
    });
    style.setOpacity(this.getOpacity());
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
    this.render();
  }
}

export default CircleStyle;
