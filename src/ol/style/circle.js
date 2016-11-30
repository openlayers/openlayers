goog.provide('ol.style.Circle');

goog.require('ol');
goog.require('ol.style.RegularShape');


/**
 * @classdesc
 * Set circle style for vector features.
 *
 * @constructor
 * @param {olx.style.CircleOptions=} opt_options Options.
 * @extends {ol.style.RegularShape}
 * @api
 */
ol.style.Circle = function(opt_options) {

  var options = opt_options || {};

  ol.style.RegularShape.call(this, {
    points: Infinity,
    fill: options.fill,
    radius: options.radius,
    snapToPixel: options.snapToPixel,
    stroke: options.stroke,
    atlasManager: options.atlasManager
  });

};
ol.inherits(ol.style.Circle, ol.style.RegularShape);


/**
 * Clones the style.  If an atlasmanager was provided to the original style it will be used in the cloned style, too.
 * @return {ol.style.Circle} The cloned style.
 * @api
 */
ol.style.Circle.prototype.clone = function() {
  var style = new ol.style.Circle({
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
ol.style.Circle.prototype.setRadius = function(radius) {
  this.radius_ = radius;
  this.render_(this.atlasManager_);
};
