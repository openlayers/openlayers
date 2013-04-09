goog.provide('ol.TileCoord');

goog.require('goog.array');


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
 * @param {number} z Zoom level.
 * @param {number} x X.
 * @param {number} y Y.
 */
ol.TileCoord = function(z, x, y) {

  /**
   * Zoom level.
   * @type {number}
   */
  this.z = z;

  /**
   * @type {number}
   */
  this.x = x;

  /**
   * @type {number}
   */
  this.y = y;

};


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
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @param {ol.TileCoord|undefined} tileCoord Tile coordinate.
 * @return {ol.TileCoord} Tile coordinate.
 */
ol.TileCoord.createOrUpdate = function(z, x, y, tileCoord) {
  if (goog.isDef(tileCoord)) {
    tileCoord.z = z;
    tileCoord.x = x;
    tileCoord.y = y;
    return tileCoord;
  } else {
    return new ol.TileCoord(z, x, y);
  }
};


/**
 * @param {number} z Z.
 * @param {number} x X.
 * @param {number} y Y.
 * @return {string} Key.
 */
ol.TileCoord.getKeyZXY = function(z, x, y) {
  return [z, x, y].join('/');
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
  return ol.TileCoord.getKeyZXY(this.z, this.x, this.y);
};
