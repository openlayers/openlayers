goog.provide('ol3.TileCoord');

goog.require('goog.array');
goog.require('ol3.Coordinate');


/**
 * @enum {number}
 */
ol3.QuadKeyCharCode = {
  ZERO: '0'.charCodeAt(0),
  ONE: '1'.charCodeAt(0),
  TWO: '2'.charCodeAt(0),
  THREE: '3'.charCodeAt(0)
};



/**
 * @constructor
 * @extends {ol3.Coordinate}
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 */
ol3.TileCoord = function(z, x, y) {

  goog.base(this, x, y);

  /**
   * @type {number}
   */
  this.z = z;

};
goog.inherits(ol3.TileCoord, ol3.Coordinate);


/**
 * @param {string} quadKey Quad key.
 * @return {ol3.TileCoord} Tile coordinate.
 */
ol3.TileCoord.createFromQuadKey = function(quadKey) {
  var z = quadKey.length, x = 0, y = 0;
  var mask = 1 << (z - 1);
  var i;
  for (i = 0; i < z; ++i) {
    switch (quadKey.charCodeAt(i)) {
      case ol3.QuadKeyCharCode.ONE:
        x += mask;
        break;
      case ol3.QuadKeyCharCode.TWO:
        y += mask;
        break;
      case ol3.QuadKeyCharCode.THREE:
        x += mask;
        y += mask;
        break;
    }
    mask >>= 1;
  }
  return new ol3.TileCoord(z, x, y);
};


/**
 * @param {string} str String.
 * @return {ol3.TileCoord} Tile coord.
 */
ol3.TileCoord.createFromString = function(str) {
  var v = str.split('/');
  v = goog.array.map(v, function(e, i, a) {
    return parseInt(e, 10);
  });
  return new ol3.TileCoord(v[0], v[1], v[2]);
};


/**
 * @return {ol3.TileCoord} Clone.
 */
ol3.TileCoord.prototype.clone = function() {
  return new ol3.TileCoord(this.z, this.x, this.y);
};


/**
 * @return {number} Hash.
 */
ol3.TileCoord.prototype.hash = function() {
  return (this.x << this.z) + this.y;
};


/**
 * @return {string} Quad key.
 */
ol3.TileCoord.prototype.quadKey = function() {
  var digits = new Array(this.z);
  var mask = 1 << (this.z - 1);
  var i, charCode;
  for (i = 0; i < this.z; ++i) {
    charCode = ol3.QuadKeyCharCode.ZERO;
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
ol3.TileCoord.prototype.toString = function() {
  return [this.z, this.x, this.y].join('/');
};
