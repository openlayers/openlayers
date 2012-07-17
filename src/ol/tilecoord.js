goog.provide('ol.TileCoord');

goog.require('goog.array');
goog.require('goog.math.Coordinate');



/**
 * @constructor
 * @extends {goog.math.Coordinate}
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.TileCoord = function(z, x, y) {

  goog.base(this, x, y);

  /**
   * @type {number}
   */
  this.z = z;

};
goog.inherits(ol.TileCoord, goog.math.Coordinate);


/**
 * @return {ol.TileCoord} Clone.
 */
ol.TileCoord.prototype.clone = function() {
  return new ol.TileCoord(this.z, this.x, this.y);
};


/**
 * @return {number} Hash.
 */
ol.TileCoord.prototype.hash = function() {
  return (this.x << this.z) + this.y;
};


/**
 * @return {string} String.
 */
ol.TileCoord.prototype.toString = function() {
  return [this.z, this.x, this.y].join('/');
};


/**
 * @param {string} str String.
 * @return {ol.TileCoord} Tile coord.
 */
ol.TileCoord.fromString = function(str) {
  var v = str.split('/');
  v = goog.array.map(v, function(e, i, a) {
    return parseInt(e, 10);
  });
  return new ol.TileCoord(v[0], v[1], v[2]);
};
