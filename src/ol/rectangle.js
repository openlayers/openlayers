goog.provide('ol.Rectangle');

goog.require('goog.asserts');
goog.require('goog.math.Coordinate');



/**
 * @constructor
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol.Rectangle = function(minX, minY, maxX, maxY) {

  goog.asserts.assert(minX <= maxX);
  goog.asserts.assert(minY <= maxY);

  /**
   * @type {number}
   */
  this.minX = minX;

  /**
   * @type {number}
   */
  this.minY = minY;

  /**
   * @type {number}
   */
  this.maxX = maxX;

  /**
   * @type {number}
   */
  this.maxY = maxY;

};


/**
 * @return {ol.Rectangle} Clone.
 */
ol.Rectangle.prototype.clone = function() {
  return new ol.Rectangle(this.minX, this.minY, this.maxX, this.maxY);
};


/**
 * @param {goog.math.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains.
 */
ol.Rectangle.prototype.contains = function(coordinate) {
  return this.minX <= coordinate.x && coordinate.x <= this.maxX &&
      this.minY <= coordinate.y && coordinate.y <= this.maxY;
};


/**
 * @return {goog.math.Coordinate} Center.
 */
ol.Rectangle.prototype.getCenter = function() {
  return new goog.math.Coordinate(
      (this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
};
