goog.provide('ol.Extent');

goog.require('goog.math.Box');
goog.require('ol.TransformFunction');



/**
 * @constructor
 * @extends {goog.math.Box}
 * @param {number} top Top.
 * @param {number} right Right.
 * @param {number} bottom Bottom.
 * @param {number} left Left.
 */
ol.Extent = function(top, right, bottom, left) {

  goog.base(this, top, right, bottom, left);

};
goog.inherits(ol.Extent, goog.math.Box);


/**
 * @return {ol.Extent} Extent.
 */
ol.Extent.prototype.clone = function() {
  return new ol.Extent(this.top, this.right, this.bottom, this.left);
};


/**
 * @param {ol.TransformFunction} transform Transform.
 * @return {ol.Extent} Extent.
 */
ol.Extent.prototype.transform = function(transform) {
  var topRight = transform(new goog.math.Coordinate(this.right, this.top));
  var bottomLeft = transform(new goog.math.Coordinate(this.left, this.bottom));
  return new ol.Extent(topRight.y, topRight.x, bottomLeft.y, bottomLeft.x);
};
