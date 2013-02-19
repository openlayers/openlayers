goog.provide('ol.TileRange');

goog.require('goog.asserts');
goog.require('ol.Size');
goog.require('ol.TileCoord');



/**
 * A representation of a contiguous block of tiles.  A tile range is specified
 * by its min/max tile coordinates and is inclusive of coordinates.
 *
 * @constructor
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol.TileRange = function(minX, minY, maxX, maxY) {

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
 * @param {...ol.TileCoord} var_args Tile coordinates.
 * @return {!ol.TileRange} Bounding tile box.
 */
ol.TileRange.boundingTileRange = function(var_args) {
  var tileCoord0 = arguments[0];
  var tileRange = new ol.TileRange(tileCoord0.x, tileCoord0.y,
                                   tileCoord0.x, tileCoord0.y);
  var i, tileCoord;
  for (i = 1; i < arguments.length; ++i) {
    tileCoord = arguments[i];
    goog.asserts.assert(tileCoord.z == tileCoord0.z);
    tileRange.minX = Math.min(tileRange.minX, tileCoord.x);
    tileRange.minY = Math.min(tileRange.minY, tileCoord.y);
    tileRange.maxX = Math.max(tileRange.maxX, tileCoord.x);
    tileRange.maxY = Math.max(tileRange.maxY, tileCoord.y);
  }
  return tileRange;
};


/**
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @return {boolean} Contains tile coordinate.
 */
ol.TileRange.prototype.contains = function(tileCoord) {
  return this.minX <= tileCoord.x && tileCoord.x <= this.maxX &&
      this.minY <= tileCoord.y && tileCoord.y <= this.maxY;
};


/**
 * @param {ol.TileRange} tileRange Tile range.
 * @return {boolean} Contains.
 */
ol.TileRange.prototype.containsTileRange = function(tileRange) {
  return this.minX <= tileRange.minX && tileRange.maxX <= this.maxX &&
      this.minY <= tileRange.minY && tileRange.minY <= this.maxY;
};


/**
 * @param {ol.TileRange} range Other range.
 * @return {boolean} The two ranges are equivalent.
 */
ol.TileRange.prototype.equals = function(range) {
  return this.minX == range.minX && this.minY == range.minY &&
      this.maxX == range.maxX && this.maxY == range.maxY;
};


/**
 * Extend this range so it includes the other.
 * @param {ol.TileRange} other Other range.
 */
ol.TileRange.prototype.extend = function(other) {
  this.minX = Math.min(this.minX, other.minX);
  this.minY = Math.min(this.minY, other.minY);
  this.maxX = Math.max(this.maxX, other.maxX);
  this.maxY = Math.max(this.maxY, other.maxY);
};


/**
 * @return {number} Height.
 */
ol.TileRange.prototype.getHeight = function() {
  return this.maxY - this.minY + 1;
};


/**
 * @return {ol.Size} Size.
 */
ol.TileRange.prototype.getSize = function() {
  return new ol.Size(this.getWidth(), this.getHeight());
};


/**
 * @return {number} Width.
 */
ol.TileRange.prototype.getWidth = function() {
  return this.maxX - this.minX + 1;
};


/**
 * Test for range intersection.
 * @param {ol.TileRange} other Other range.
 * @return {boolean} The two ranges intersect.
 */
ol.TileRange.prototype.intersects = function(other) {
  return this.minX <= other.maxX &&
      this.maxX >= other.minX &&
      this.minY <= other.maxY &&
      this.maxY >= other.minY;
};

