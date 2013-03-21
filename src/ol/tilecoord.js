goog.provide('ol.TileCoord');

goog.require('goog.array');
goog.require('ol.Coordinate');


/**
 * @enum {number}
 */
ol.QuadKeyCharCode = {
  ZERO: '0'.charCodeAt(0),
  ONE: '1'.charCodeAt(0),
  TWO: '2'.charCodeAt(0),
  THREE: '3'.charCodeAt(0)
};



/**
 * @constructor
 * @extends {ol.Coordinate}
 * @param {number} z Zoom level.
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.TileCoord = function(z, x, y) {

  goog.base(this, x, y);

  /**
   * Zoom level.
   * @type {number}
   */
  this.z = z;

};
goog.inherits(ol.TileCoord, ol.Coordinate);


/**
 * @param {string} quadKey Quad key.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.TileCoord.createFromQuadKey = function(quadKey) {
  var z = quadKey.length, x = 0, y = 0;
  var mask = 1 << (z - 1);
  var i;
  for (i = 0; i < z; ++i) {
    switch (quadKey.charCodeAt(i)) {
      case ol.QuadKeyCharCode.ONE:
        x += mask;
        break;
      case ol.QuadKeyCharCode.TWO:
        y += mask;
        break;
      case ol.QuadKeyCharCode.THREE:
        x += mask;
        y += mask;
        break;
    }
    mask >>= 1;
  }
  return new ol.TileCoord(z, x, y);
};


/**
 * @param {string} str String that follows pattern “z/x/y” where x, y and z are
 *   numbers.
 * @return {ol.TileCoord} Tile coord.
 */
ol.TileCoord.createFromString = function(str) {
  var v = str.split('/');
  v = goog.array.map(v, function(e, i, a) {
    return parseInt(e, 10);
  });
  return new ol.TileCoord(v[0], v[1], v[2]);
};


/**
 * @return {number} Hash.
 */
ol.TileCoord.prototype.hash = function() {
  return (this.x << this.z) + this.y;
};


/**
 * @return {string} Quad key.
 */
ol.TileCoord.prototype.quadKey = function() {
  var digits = new Array(this.z);
  var mask = 1 << (this.z - 1);
  var i, charCode;
  for (i = 0; i < this.z; ++i) {
    charCode = ol.QuadKeyCharCode.ZERO;
    if (this.x & mask) {
      charCode += 1;
    }
    if (this.y & mask) {
      charCode += 2;
    }
    digits[i] = String.fromCharCode(charCode);
    mask >>= 1;
  }
  return digits.join('');
};


/**
 * @return {string} String.
 */
ol.TileCoord.prototype.toString = function() {
  return [this.z, this.x, this.y].join('/');
};
