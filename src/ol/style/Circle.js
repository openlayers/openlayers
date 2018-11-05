/**
 * @module ol/style/Circle
 */

import RegularShape from './RegularShape.js';


/**
 * @typedef {Object} Options
 * @property {import("./Fill.js").default} [fill] Fill style.
 * @property {number} radius Circle radius.
 * @property {import("./Stroke.js").default} [stroke] Stroke style.
 * @property {import("./AtlasManager.js").default} [atlasManager] The atlas manager to use for this circle.
 * When using WebGL it is recommended to use an atlas manager to avoid texture switching. If an atlas manager is given,
 * the circle is added to an atlas. By default no atlas manager is used.
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
      stroke: options.stroke,
      atlasManager: options.atlasManager
    });

  }

  /**
  * Clones the style.  If an atlasmanager was provided to the original style it will be used in the cloned style, too.
  * @return {CircleStyle} The cloned style.
  * @override
  * @api
  */
  clone() {
    const style = new CircleStyle({
      fill: this.getFill() ? this.getFill().clone() : undefined,
      stroke: this.getStroke() ? this.getStroke().clone() : undefined,
      radius: this.getRadius(),
      atlasManager: this.atlasManager_
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
    this.render_(this.atlasManager_);
  }
}


export default CircleStyle;
