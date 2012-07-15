goog.provide('ol.TileUrlFunction');
goog.provide('ol.TileUrlFunctionType');

goog.require('goog.math');
goog.require('ol.TileCoord');


/**
 * @typedef {function(ol.TileCoord): string}
 */
ol.TileUrlFunctionType;


/**
 * @param {string} template Template.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTemplate = function(template) {
  return function(tileCoord) {
    return template.replace(/\{z\}/, tileCoord.z)
                   .replace(/\{x\}/, tileCoord.x)
                   .replace(/\{y\}/, tileCoord.y);
  };
};


/**
 * @param {Array.<ol.TileUrlFunctionType>} tileUrlFunctions Tile URL Functions.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTileUrlFunctions = function(tileUrlFunctions) {
  return function(tileCoord) {
    var index = goog.math.modulo(tileCoord.hash(), tileUrlFunctions.length);
    return tileUrlFunctions[index](tileCoord);
  };
};


/**
 * @param {Array.<string>} templates Templates.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.createFromTemplates = function(templates) {
  return ol.TileUrlFunction.createFromTileUrlFunctions(
      goog.array.map(templates, ol.TileUrlFunction.createFromTemplate));
};


/**
 * @param {function(ol.TileCoord): ol.TileCoord} transform Transform.
 * @param {ol.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @return {ol.TileUrlFunctionType} Tile URL function.
 */
ol.TileUrlFunction.withTileCoordTransform =
    function(transform, tileUrlFunction) {
  return function(tileCoord) {
    return tileUrlFunction(transform(tileCoord));
  };
};
