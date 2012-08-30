goog.provide('ol3.TileUrlFunction');
goog.provide('ol3.TileUrlFunctionType');

goog.require('goog.math');
goog.require('ol3.TileCoord');


/**
 * @typedef {function(ol3.TileCoord): (string|undefined)}
 */
ol3.TileUrlFunctionType;


/**
 * @param {string} template Template.
 * @return {ol3.TileUrlFunctionType} Tile URL function.
 */
ol3.TileUrlFunction.createFromTemplate = function(template) {
  var match =
      /\{(\d)-(\d)\}/.exec(template) || /\{([a-z])-([a-z])\}/.exec(template);
  if (match) {
    var templates = [];
    var startCharCode = match[1].charCodeAt(0);
    var stopCharCode = match[2].charCodeAt(0);
    var charCode;
    for (charCode = startCharCode; charCode <= stopCharCode; ++charCode) {
      templates.push(template.replace(match[0], String.fromCharCode(charCode)));
    }
    return ol3.TileUrlFunction.createFromTemplates(templates);
  } else {
    return function(tileCoord) {
      if (goog.isNull(tileCoord)) {
        return undefined;
      } else {
        return template.replace('{z}', tileCoord.z)
                       .replace('{x}', tileCoord.x)
                       .replace('{y}', tileCoord.y);
      }
    };
  }
};


/**
 * @param {Array.<string>} templates Templates.
 * @return {ol3.TileUrlFunctionType} Tile URL function.
 */
ol3.TileUrlFunction.createFromTemplates = function(templates) {
  return ol3.TileUrlFunction.createFromTileUrlFunctions(
      goog.array.map(templates, ol3.TileUrlFunction.createFromTemplate));
};


/**
 * @param {Array.<ol3.TileUrlFunctionType>} tileUrlFunctions Tile URL Functions.
 * @return {ol3.TileUrlFunctionType} Tile URL function.
 */
ol3.TileUrlFunction.createFromTileUrlFunctions = function(tileUrlFunctions) {
  return function(tileCoord) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      var index = goog.math.modulo(tileCoord.hash(), tileUrlFunctions.length);
      return tileUrlFunctions[index](tileCoord);
    }
  };
};


/**
 * @param {ol3.TileCoord} tileCoord Tile coordinate.
 * @return {string|undefined} Tile URL.
 */
ol3.TileUrlFunction.nullTileUrlFunction = function(tileCoord) {
  return undefined;
};


/**
 * @param {function(ol3.TileCoord): ol3.TileCoord} transformFn
 *     Transform.function.
 * @param {ol3.TileUrlFunctionType} tileUrlFunction Tile URL function.
 * @return {ol3.TileUrlFunctionType} Tile URL function.
 */
ol3.TileUrlFunction.withTileCoordTransform =
    function(transformFn, tileUrlFunction) {
  return function(tileCoord) {
    if (goog.isNull(tileCoord)) {
      return undefined;
    } else {
      return tileUrlFunction(transformFn(tileCoord));
    }
  };
};
