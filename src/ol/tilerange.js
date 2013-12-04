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
 * @param {number} maxX Maximum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxY Maximum Y.
 * @struct
 */
ol.TileRange = function(minX, maxX, minY, maxY) {

  /**
   * @type {number}
   */
  this.minX = minX;

  /**
   * @type {number}
   */
  this.maxX = maxX;

  /**
   * @type {number}
   */
  this.minY = minY;

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
  var tileCoord0 = /** @type {ol.TileCoord} */ (arguments[0]);
  var tileRange = new ol.TileRange(tileCoord0.x, tileCoord0.x,
                                   tileCoord0.y, tileCoord0.y);
  var i, ii, tileCoord;
  for (i = 1, ii = arguments.length; i < ii; ++i) {
    tileCoord = /** @type {ol.TileCoord} */ (arguments[i]);
    goog.asserts.assert(tileCoord.z == tileCoord0.z);
    tileRange.minX = Math.min(tileRange.minX, tileCoord.x);
    tileRange.maxX = Math.max(tileRange.maxX, tileCoord.x);
    tileRange.minY = Math.min(tileRange.minY, tileCoord.y);
    tileRange.maxY = Math.max(tileRange.maxY, tileCoord.y);
  }
  return tileRange;
};


/**
 * @param {number} minX Minimum X.
 * @param {number} maxX Maximum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxY Maximum Y.
 * @param {ol.TileRange|undefined} tileRange TileRange.
 * @return {ol.TileRange} Tile range.
 */
ol.TileRange.createOrUpdate = function(minX, maxX, minY, maxY, tileRange) {
  if (goog.isDef(tileRange)) {
    tileRange.minX = minX;
    tileRange.maxX = maxX;
    tileRange.minY = minY;
    tileRange.maxY = maxY;
    return tileRange;
  } else {
    return new ol.TileRange(minX, maxX, minY, maxY);
  }
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
      this.minY <= tileRange.minY && tileRange.maxY <= this.maxY;
};


/**
 * @param {ol.TileRange} tileRange Tile range.
 * @return {boolean} Equals.
 */
ol.TileRange.prototype.equals = function(tileRange) {
  return this.minX == tileRange.minX && this.minY == tileRange.minY &&
      this.maxX == tileRange.maxX && this.maxY == tileRange.maxY;
};


/**
 * @param {ol.TileRange} tileRange Tile range.
 */
ol.TileRange.prototype.extend = function(tileRange) {
  if (tileRange.minX < this.minX) {
    this.minX = tileRange.minX;
  }
  if (tileRange.maxX > this.maxX) {
    this.maxX = tileRange.maxX;
  }
  if (tileRange.minY < this.minY) {
    this.minY = tileRange.minY;
  }
  if (tileRange.maxY > this.maxY) {
    this.maxY = tileRange.maxY;
  }
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
  return [this.getWidth(), this.getHeight()];
};


/**
 * @return {number} Width.
 */
ol.TileRange.prototype.getWidth = function() {
  return this.maxX - this.minX + 1;
};


/**
 * @param {ol.TileRange} tileRange Tile range.
 * @return {boolean} Intersects.
 */
ol.TileRange.prototype.intersects = function(tileRange) {
  return this.minX <= tileRange.maxX &&
      this.maxX >= tileRange.minX &&
      this.minY <= tileRange.maxY &&
      this.maxY >= tileRange.minY;
};
