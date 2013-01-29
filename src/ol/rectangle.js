goog.provide('ol.Rectangle');

goog.require('goog.asserts');
goog.require('ol.Coordinate');
goog.require('ol.Size');



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
 * @param {ol.Rectangle} rectangle Rectangle.
 * @return {boolean} Equals.
 */
ol.Rectangle.prototype.equals = function(rectangle) {
  return this.minX == rectangle.minX && this.minY == rectangle.minY &&
      this.maxX == rectangle.maxX && this.maxY == rectangle.maxY;
};


/**
 * @param {ol.Rectangle} rectangle Rectangle.
 */
ol.Rectangle.prototype.extend = function(rectangle) {
  this.minX = Math.min(this.minX, rectangle.minX);
  this.minY = Math.min(this.minY, rectangle.minY);
  this.maxX = Math.max(this.maxX, rectangle.maxX);
  this.maxY = Math.max(this.maxY, rectangle.maxY);
};


/**
 * @return {ol.Coordinate} Center.
 */
ol.Rectangle.prototype.getCenter = function() {
  return new ol.Coordinate(
      (this.minX + this.maxX) / 2, (this.minY + this.maxY) / 2);
};


/**
 * @return {number} Height.
 */
ol.Rectangle.prototype.getHeight = function() {
  return this.maxY - this.minY;
};


/**
 * @return {ol.Size} Size.
 */
ol.Rectangle.prototype.getSize = function() {
  return new ol.Size(this.getWidth(), this.getHeight());
};


/**
 * @return {number} Width.
 */
ol.Rectangle.prototype.getWidth = function() {
  return this.maxX - this.minX;
};


/**
 * @param {ol.Rectangle} rectangle Rectangle.
 * @return {boolean} Intersects.
 */
ol.Rectangle.prototype.intersects = function(rectangle) {
  return this.minX <= rectangle.maxX &&
      this.maxX >= rectangle.minX &&
      this.minY <= rectangle.maxY &&
      this.maxY >= rectangle.minY;
};


/**
 * @param {ol.Coordinate} coordinate Coordinate.
 * @return {ol.Coordinate} Coordinate.
 */
ol.Rectangle.prototype.normalize = function(coordinate) {
  return new ol.Coordinate(
      (coordinate.x - this.minX) / this.getWidth(),
      (coordinate.y - this.minY) / this.getHeight());
};


/**
 * @return {string} String.
 */
ol.Rectangle.prototype.toString = function() {
  return '(' + [this.minX, this.minY, this.maxX, this.maxY].join(', ') + ')';
};


/**
 * @param {number} value Value.
 */
ol.Rectangle.prototype.scale = function(value) {
  var deltaX = (this.getWidth() / 2.0) * (value - 1);
  var deltaY = (this.getHeight() / 2.0) * (value - 1);
  this.minX -= deltaX;
  this.minY -= deltaY;
  this.maxX += deltaX;
  this.maxY += deltaY;
};
