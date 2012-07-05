goog.provide('ol.TileCoord');

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
 * @return {number} Hash.
 */
ol.TileCoord.prototype.hash = function() {
  return (this.x << this.z) + this.y;
};
