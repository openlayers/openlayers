goog.provide('ol3.Rectangle');

goog.require('goog.asserts');
goog.require('ol3.Coordinate');
goog.require('ol3.Size');



/**
 * @constructor
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol3.Rectangle = function(minX, minY, maxX, maxY) {

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
 * @return {ol3.Rectangle} Clone.
 */
ol3.Rectangle.prototype.clone = function() {
  return new ol3.Rectangle(this.minX, this.minY, this.maxX, this.maxY);
};


/**
 * @param {ol3.Coordinate} coordinate Coordinate.
 * @return {boolean} Contains.
 */
ol3.Rectangle.prototype.contains = function(coordinate) {
  return this.minX <= coordinate.x && coordinate.x <= this.maxX &&
      this.minY <= coordinate.y && coordinate.y <= this.maxY;
};


/**
 * @return {ol3.Coordinate} Center.
 */
ol3.Rectangle.prototype.getCenter = function() {
  return new ol3.Coordinate(
      (this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
};


/**
 * @return {number} Height.
 */
ol3.Rectangle.prototype.getHeight = function() {
  return this.maxY - this.minY;
};


/**
 * @return {ol3.Size} Size.
 */
ol3.Rectangle.prototype.getSize = function() {
  return new ol3.Size(this.getWidth(), this.getHeight());
};


/**
 * @return {number} Width.
 */
ol3.Rectangle.prototype.getWidth = function() {
  return this.maxX - this.minX;
};


/**
 * @param {ol3.Rectangle} rectangle Rectangle.
 * @return {boolean} Intersects.
 */
ol3.Rectangle.prototype.intersects = function(rectangle) {
  return this.minX <= rectangle.maxX &&
      this.maxX >= rectangle.minX &&
      this.minY <= rectangle.maxY &&
      this.maxY >= rectangle.minY;
};


/**
 * @param {ol3.Coordinate} coordinate Coordinate.
 * @return {ol3.Coordinate} Coordinate.
 */
ol3.Rectangle.prototype.normalize = function(coordinate) {
  return new ol3.Coordinate(
      (coordinate.x - this.minX) / this.getWidth(),
      (coordinate.y - this.minY) / this.getHeight());
};


/**
 * @return {string} String.
 */
ol3.Rectangle.prototype.toString = function() {
  return '(' + [this.minX, this.minY, this.maxX, this.maxY].join(', ') + ')';
};
