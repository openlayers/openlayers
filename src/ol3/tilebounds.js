goog.provide('ol3.TileBounds');

goog.require('goog.asserts');
goog.require('ol3.Rectangle');
goog.require('ol3.TileCoord');



/**
 * @constructor
 * @extends {ol3.Rectangle}
 * @param {number} minX Minimum X.
 * @param {number} minY Minimum Y.
 * @param {number} maxX Maximum X.
 * @param {number} maxY Maximum Y.
 */
ol3.TileBounds = function(minX, minY, maxX, maxY) {
  goog.base(this, minX, minY, maxX, maxY);
};
goog.inherits(ol3.TileBounds, ol3.Rectangle);


/**
 * @param {...ol3.TileCoord} var_args Tile coordinates.
 * @return {!ol3.TileBounds} Bounding tile box.
 */
ol3.TileBounds.boundingTileBounds = function(var_args) {
  var tileCoord0 = arguments[0];
  var tileBounds = new ol3.TileBounds(tileCoord0.x, tileCoord0.y,
                                      tileCoord0.x, tileCoord0.y);
  var i;
  for (i = 1; i < arguments.length; ++i) {
    var tileCoord = arguments[i];
    goog.asserts.assert(tileCoord.z == tileCoord0.z);
    tileBounds.minX = Math.min(tileBounds.minX, tileCoord.x);
    tileBounds.minY = Math.min(tileBounds.minY, tileCoord.y);
    tileBounds.maxX = Math.max(tileBounds.maxX, tileCoord.x);
    tileBounds.maxY = Math.max(tileBounds.maxY, tileCoord.y);
  }
  return tileBounds;
};


/**
 * @return {ol3.TileBounds} Clone.
 */
ol3.TileBounds.prototype.clone = function() {
  return new ol3.TileBounds(this.minX, this.minY, this.maxX, this.maxY);
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @return {boolean} Contains tile coordinate.
 */
ol3.TileBounds.prototype.contains = function(tileCoord) {
  return this.minX <= tileCoord.x && tileCoord.x <= this.maxX &&
      this.minY <= tileCoord.y && tileCoord.y <= this.maxY;
};


/**
 * @param {ol3.TileBounds} tileBounds Tile bounds.
 * @return {boolean} Contains.
 */
ol3.TileBounds.prototype.containsTileBounds = function(tileBounds) {
  return this.minX <= tileBounds.minX && tileBounds.maxX <= this.maxX &&
      this.minY <= tileBounds.minY && tileBounds.minY <= this.maxY;
};


/**
 * @param {ol3.TileBounds} tileBounds Tile bounds.
 * @return {boolean} Equals.
 */
ol3.TileBounds.prototype.equals = function(tileBounds) {
  return this.minX == tileBounds.minX && tileBounds.maxX == this.maxX &&
      this.minY == tileBounds.minY && tileBounds.minY == this.minY;
};


/**
 * @param {number} z Z.
 * @param {function(this: T, ol3.TileCoord)} f Callback.
 * @param {T=} opt_obj The object to be used for the value of 'this' within f.
 * @template T
 */
ol3.TileBounds.prototype.forEachTileCoord = function(z, f, opt_obj) {
  var x, y;
  for (x = this.minX; x <= this.maxX; ++x) {
    for (y = this.minY; y <= this.maxY; ++y) {
      f.call(opt_obj, new ol3.TileCoord(z, x, y));
    }
  }
};


/**
 * @inheritDoc
 * @return {number} Height.
 */
ol3.TileBounds.prototype.getHeight = function() {
  return this.maxY - this.minY + 1;
};


/**
 * @inheritDoc
 * @return {number} Width.
 */
ol3.TileBounds.prototype.getWidth = function() {
  return this.maxX - this.minX + 1;
};
