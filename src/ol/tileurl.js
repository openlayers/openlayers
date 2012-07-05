goog.provide('ol.TileUrl');

goog.require('goog.math');
goog.require('ol.TileCoord');


/**
 * @typedef {function(ol.TileCoord): string}
 */
ol.TileUrlFunction;


/**
 * @param {string} template Template.
 * @return {ol.TileUrlFunction} Tile URL function.
 */
ol.TileUrl.createFromTemplate = function(template) {
  return function(tileCoord) {
    return template.replace(/\{z\}/, tileCoord.z)
                   .replace(/\{x\}/, tileCoord.x)
                   .replace(/\{y\}/, tileCoord.y);
  };
};


/**
 * @param {Array.<ol.TileUrlFunction>} tileUrlFunctions Tile URL Functions.
 * @return {ol.TileUrlFunction} Tile URL function.
 */
ol.TileUrl.createFromTileUrlFunctions = function(tileUrlFunctions) {
  return function(tileCoord) {
    var index = goog.math.modulo(tileCoord.hash(), tileUrlFunctions.length);
    return tileUrlFunctions[index](tileCoord);
  };
};
