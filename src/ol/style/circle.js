import _ol_ from '../index';
import _ol_style_RegularShape_ from '../style/regularshape';

/**
 * @classdesc
 * Set circle style for vector features.
 *
 * @constructor
 * @param {olx.style.CircleOptions=} opt_options Options.
 * @extends {ol.style.RegularShape}
 * @api
 */
var _ol_style_Circle_ = function(opt_options) {

  var options = opt_options || {};

  _ol_style_RegularShape_.call(this, {
    points: Infinity,
    fill: options.fill,
    radius: options.radius,
    snapToPixel: options.snapToPixel,
    stroke: options.stroke,
    atlasManager: options.atlasManager
  });

};

_ol_.inherits(_ol_style_Circle_, _ol_style_RegularShape_);


/**
 * Clones the style.  If an atlasmanager was provided to the original style it will be used in the cloned style, too.
 * @return {ol.style.Circle} The cloned style.
 * @override
 * @api
 */
_ol_style_Circle_.prototype.clone = function() {
  var style = new _ol_style_Circle_({
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
_ol_style_Circle_.prototype.setRadius = function(radius) {
  this.radius_ = radius;
  this.render_(this.atlasManager_);
};
export default _ol_style_Circle_;
