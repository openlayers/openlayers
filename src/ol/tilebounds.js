goog.provide('ol.TileBounds');

goog.require('goog.asserts');
goog.require('goog.math.Box');
goog.require('ol.TileCoord');



/**
 * @constructor
 * @extends {goog.math.Box}
 * @param {number} top Top.
 * @param {number} right Right.
 * @param {number} bottom Bottom.
 * @param {number} left Left.
 */
ol.TileBounds = function(top, right, bottom, left) {

  goog.base(this, top, right, bottom, left);

};
goog.inherits(ol.TileBounds, goog.math.Box);


/**
 * @param {...ol.TileCoord} var_args Tile coordinates.
 * @return {!ol.TileBounds} Bounding tile box.
 */
ol.TileBounds.boundingTileBounds = function(var_args) {
  var tileCoord0 = arguments[0];
  var tileBounds = new ol.TileBounds(tileCoord0.y, tileCoord0.x,
                                     tileCoord0.y, tileCoord0.x);
  var i;
  for (i = 1; i < arguments.length; ++i) {
    var tileCoord = arguments[i];
    goog.asserts.assert(tileCoord.z == tileCoord0.z);
    tileBounds.top = Math.min(tileBounds.top, tileCoord.y);
    tileBounds.right = Math.max(tileBounds.right, tileCoord.x);
    tileBounds.bottom = Math.max(tileBounds.bottom, tileCoord.y);
    tileBounds.left = Math.min(tileBounds.left, tileCoord.x);
  }
  return tileBounds;
};
