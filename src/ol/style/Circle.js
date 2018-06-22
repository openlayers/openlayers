/**
 * @module ol/style/Circle
 */
import {inherits} from '../util.js';
import RegularShape from '../style/RegularShape.js';


/**
 * @typedef {Object} Options
 * @property {module:ol/style/Fill} [fill] Fill style.
 * @property {number} radius Circle radius.
 * @property {boolean} [snapToPixel=true] If `true` integral numbers of pixels are used as the X and Y pixel coordinate
 * when drawing the circle in the output canvas. If `false` fractional numbers may be used. Using `true` allows for
 * "sharp" rendering (no blur), while using `false` allows for "accurate" rendering. Note that accuracy is important if
 * the circle's position is animated. Without it, the circle may jitter noticeably.
 * @property {module:ol/style/Stroke} [stroke] Stroke style.
 * @property {module:ol/style/AtlasManager} [atlasManager] The atlas manager to use for this circle.
 * When using WebGL it is recommended to use an atlas manager to avoid texture switching. If an atlas manager is given,
 * the circle is added to an atlas. By default no atlas manager is used.
 */


/**
 * @classdesc
 * Set circle style for vector features.
 *
 * @constructor
 * @param {module:ol/style/Circle~Options=} opt_options Options.
 * @extends {module:ol/style/RegularShape}
 * @api
 */
const CircleStyle = function(opt_options) {

  const options = opt_options || {};

  RegularShape.call(this, {
    points: Infinity,
    fill: options.fill,
    radius: options.radius,
    snapToPixel: options.snapToPixel,
    stroke: options.stroke,
    atlasManager: options.atlasManager
  });

};

inherits(CircleStyle, RegularShape);


/**
 * Clones the style.  If an atlasmanager was provided to the original style it will be used in the cloned style, too.
 * @return {module:ol/style/Circle} The cloned style.
 * @override
 * @api
 */
CircleStyle.prototype.clone = function() {
  const style = new CircleStyle({
    fill: this.getFill() ? this.getFill().clone() : undefined,
    stroke: this.getStroke() ? this.getStroke().clone() : undefined,
    radius: this.getRadius(),
    snapToPixel: this.getSnapToPixel(),
    atlasManager: this.atlasManager_
  });
  style.setOpacity(this.getOpacity());
  style.setScale(this.getScale());
  return style;
};


/**
 * Set the circle radius.
 *
 * @param {number} radius Circle radius.
 * @api
 */
CircleStyle.prototype.setRadius = function(radius) {
  this.radius_ = radius;
  this.render_(this.atlasManager_);
};
export default CircleStyle;
